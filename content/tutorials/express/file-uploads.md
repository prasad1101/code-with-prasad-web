Profile photos, product images, CSV imports, invoices — most applications accept file uploads. Browsers send files as `multipart/form-data`, which `express.json()` can't parse. **Multer** handles it.

## Setup

```bash
npm install multer
```

## A basic upload

```js
import multer from 'multer'
import path from 'node:path'

const upload = multer({
  dest: 'uploads/',                           // store on disk with random names
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB, one file
})

app.post('/api/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  // req.file: { fieldname, originalname, mimetype, size, path, filename }
  res.status(201).json({ file: req.file.filename, size: req.file.size })
})
```

`upload.single('avatar')` expects one file in the form field named `avatar`. Also available: `upload.array('photos', 5)`, `upload.fields([...])` and `upload.none()`.

The client side:

```js
const form = new FormData()
form.append('avatar', fileInput.files[0])
await fetch('/api/avatar', { method: 'POST', body: form, headers: { Authorization: `Bearer ${token}` } })
```

Don't set `Content-Type` manually — the browser adds the multipart boundary.

## Validating file type

Check the type **and** the content — `mimetype` and file extensions are supplied by the client and can lie:

```js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError('Only JPEG, PNG or WebP images are allowed', { status: 400, code: 'INVALID_FILE_TYPE' }))
    }
    cb(null, true)
  },
})
```

For stronger checks, inspect the file's **magic bytes** (e.g. with the `file-type` package) after upload, and re-encode images with an image library such as **sharp** — which also strips metadata and neutralises malicious payloads:

```js
import sharp from 'sharp'

app.post('/api/products/:id/image', requireAuth, upload.single('image'), async (req, res) => {
  const webp = await sharp(req.file.buffer)
    .rotate()                               // respect EXIF orientation
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  const key = `products/${req.params.id}/${crypto.randomUUID()}.webp`
  await storage.put(key, webp, 'image/webp')
  res.status(201).json({ url: storage.publicUrl(key) })
})
```

## Where to store files

Local disk doesn't work when you run multiple instances or containers — files uploaded to one instance aren't on the others, and containers lose files on restart. Use **object storage**: Amazon S3, Google Cloud Storage, Azure Blob Storage, or S3-compatible services.

```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION })

export async function put(key, body, contentType) {
  await s3.send(new PutObjectCommand({ Bucket: process.env.BUCKET, Key: key, Body: body, ContentType: contentType }))
}
```

Store only the **key/URL** in MongoDB, not the file itself (GridFS exists but object storage is usually a better fit).

## Direct-to-storage uploads

For large files (videos, big documents), don't stream them through your API. Generate a **pre-signed URL** and let the browser upload directly to object storage:

```js
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

app.post('/api/uploads/presign', requireAuth, async (req, res) => {
  const key = `uploads/${req.user.id}/${crypto.randomUUID()}`
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.BUCKET, Key: key, ContentType: req.body.contentType }), { expiresIn: 300 })
  res.json({ url, key })
})
```

Your server stays free of large uploads, and uploads are faster.

## Handling Multer errors

```js
import multer from 'multer'

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    return res.status(status).json({ error: { code: err.code, message: err.message } })
  }
  next(err)
})
```

## Security checklist for uploads

- Limit file size and number of files.
- Allow-list types; verify content, not just the extension.
- Generate your own file names — never use `originalname` in paths (path traversal).
- Store outside the web root / in object storage; serve with the correct `Content-Type` and `Content-Disposition: attachment` for non-images.
- Scan for malware if users share files with each other.
- Re-encode images to strip hidden content and metadata (GPS coordinates in photos).

## Try it yourself

Build `POST /api/me/avatar` that accepts one image up to 2 MB, verifies it's a real image, resizes it to 256×256 WebP with sharp, saves it (to disk for now, behind a `storage` interface), stores the URL on the user, and returns it.

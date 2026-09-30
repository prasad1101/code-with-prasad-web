JavaScript strings are text. But servers constantly deal with **binary data**: files, images, network packets, encrypted payloads. Node represents raw bytes with **`Buffer`**, a subclass of `Uint8Array`.

## Creating buffers

```js
const fromText = Buffer.from('Hello, नमस्ते', 'utf8')
const fromBytes = Buffer.from([0x48, 0x69])          // 'Hi'
const empty = Buffer.alloc(16)                        // 16 zero-filled bytes

console.log(fromText)          // <Buffer 48 65 6c 6c 6f 2c 20 e0 a4 a8 …>
console.log(fromText.length)   // byte length — not character count!
```

`Buffer.allocUnsafe(size)` is faster but may contain old memory contents — only use it if you'll overwrite every byte immediately.

## Characters vs. bytes

UTF-8 uses 1–4 bytes per character:

```js
'नमस्ते'.length                    // 6 UTF-16 code units
Buffer.byteLength('नमस्ते', 'utf8') // 18 bytes
```

This matters for `Content-Length` headers, database column limits and protocol framing — always measure **bytes** for those.

## Encodings

```js
const buf = Buffer.from('Node.js')

buf.toString('utf8')      // 'Node.js'
buf.toString('hex')       // '4e6f64652e6a73'
buf.toString('base64')    // 'Tm9kZS5qcw=='
buf.toString('base64url') // URL-safe base64 — used in JWTs

Buffer.from('Tm9kZS5qcw==', 'base64').toString() // 'Node.js'
```

## Reading and slicing

```js
const b = Buffer.from('Hello, world')

b[0]                        // 72 (the byte for 'H')
b.subarray(0, 5).toString() // 'Hello' — shares memory with b
Buffer.concat([Buffer.from('a'), Buffer.from('b')]).toString() // 'ab'
b.equals(Buffer.from('Hello, world')) // true
b.includes('world')         // true
```

`subarray` (and the older `slice`) **share memory**: modifying the sub-buffer modifies the original. Copy with `Buffer.from(sub)` when you need independence.

## Binary formats

Buffers can read and write numbers in specific binary layouts — useful for file headers and network protocols:

```js
const header = Buffer.alloc(8)
header.writeUInt32BE(0xcafebabe, 0)  // 4 bytes, big-endian
header.writeUInt16LE(513, 4)         // 2 bytes, little-endian

header.readUInt32BE(0).toString(16)  // 'cafebabe'
header.readUInt16LE(4)               // 513
```

For example, checking a PNG file's signature:

```js
import { open } from 'node:fs/promises'

const file = await open('image.png')
const { buffer } = await file.read(Buffer.alloc(8), 0, 8, 0)
await file.close()

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
console.log(buffer.equals(PNG) ? 'PNG file' : 'Not a PNG')
```

## Buffers and crypto

Hashes, HMACs and random bytes all work with buffers:

```js
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const token = randomBytes(32).toString('base64url')        // secure random token
const digest = createHash('sha256').update('data').digest('hex')

// Compare secrets in constant time to avoid timing attacks
function safeCompare(a, b) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}
```

## Buffers and memory

Buffers are allocated outside the V8 heap, so a program can use a lot of memory in buffers without the heap looking large. Reading whole large files or request bodies into buffers is a common cause of memory spikes — stream them instead (next lesson), and set size limits on request bodies.

## Try it yourself

1. Write `toBase64Url(text)` and `fromBase64Url(encoded)`.
2. Read the first 4 bytes of a few files and identify PDFs (`%PDF`), PNGs and ZIPs (`PK\x03\x04`) by their signatures.
3. Generate a 6-digit OTP from `randomBytes` without modulo bias (hint: `crypto.randomInt`).

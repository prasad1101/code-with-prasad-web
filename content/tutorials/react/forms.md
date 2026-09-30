Forms are where users give your app data. React supports two styles — **controlled inputs** driven by state, and **form actions** introduced in React 19 — and you'll use both.

## Controlled inputs

The input's value lives in state; every keystroke updates it:

```tsx
function NewsletterForm() {
  const [email, setEmail] = useState('')
  const isValid = /^\S+@\S+\.\S+$/.test(email)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        subscribe(email)
      }}
    >
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {!isValid && email.length > 0 && <p className="error">Enter a valid email</p>}
      <button type="submit" disabled={!isValid}>Subscribe</button>
    </form>
  )
}
```

Controlled inputs are ideal when the UI reacts to every keystroke: live validation, character counters, formatting, dependent fields.

### Different input types

```tsx
<input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />

<select value={country} onChange={(e) => setCountry(e.target.value)}>
  <option value="IN">India</option>
  <option value="AE">United Arab Emirates</option>
</select>

<textarea value={bio} onChange={(e) => setBio(e.target.value)} />

<input type="radio" name="plan" value="pro" checked={plan === 'pro'} onChange={() => setPlan('pro')} />
```

### One state object for many fields

```tsx
const [form, setForm] = useState({ name: '', email: '', city: '' })

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setForm({ ...form, [e.target.name]: e.target.value })
}

<input name="name" value={form.name} onChange={handleChange} />
<input name="email" value={form.email} onChange={handleChange} />
```

## Uncontrolled inputs with `FormData`

For simple forms, let the browser hold the values and read them on submit:

```tsx
function ContactForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    console.log(data) // { name: '…', message: '…' }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <textarea name="message" required minLength={10} />
      <button>Send</button>
    </form>
  )
}
```

Native attributes like `required`, `minLength` and `type="email"` give free browser validation.

## React 19 form actions

In React 19, a form's `action` prop can be a **function**. React calls it with the form's `FormData`, handles the pending state, and resets the form after success:

```tsx
import { useActionState } from 'react'

type State = { error?: string; success?: boolean }

async function subscribeAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '')
  if (!email.includes('@')) return { error: 'Enter a valid email' }
  const res = await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) })
  return res.ok ? { success: true } : { error: 'Subscription failed, please try again' }
}

function Newsletter() {
  const [state, formAction, isPending] = useActionState(subscribeAction, {})

  return (
    <form action={formAction}>
      <input type="email" name="email" required />
      <button disabled={isPending}>{isPending ? 'Subscribing…' : 'Subscribe'}</button>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p>Thanks for subscribing!</p>}
    </form>
  )
}
```

`useActionState` returns the latest state returned by the action, a wrapped action to pass to the form, and an `isPending` flag.

### `useFormStatus`

Child components (like a reusable submit button) can read the parent form's status:

```tsx
import { useFormStatus } from 'react-dom'

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending}>{pending ? 'Saving…' : children}</button>
}
```

### `useOptimistic`

Show the expected result immediately while the request is in flight:

```tsx
import { useOptimistic } from 'react'

function Comments({ comments, addComment }: { comments: Comment[]; addComment: (text: string) => Promise<void> }) {
  const [optimistic, addOptimistic] = useOptimistic(comments, (current, text: string) => [
    ...current,
    { id: `temp-${current.length}`, text, pending: true },
  ])

  async function action(formData: FormData) {
    const text = String(formData.get('text'))
    addOptimistic(text)
    await addComment(text) // when the real comments arrive, the optimistic one is replaced
  }

  return (
    <>
      <ul>{optimistic.map((c) => <li key={c.id} style={{ opacity: c.pending ? 0.5 : 1 }}>{c.text}</li>)}</ul>
      <form action={action}>
        <input name="text" required />
        <button>Post</button>
      </form>
    </>
  )
}
```

## Larger forms: React Hook Form

For complex forms (many fields, dynamic arrays, schema validation), libraries like **React Hook Form** with a **Zod** resolver minimise re-renders and boilerplate:

```tsx
const schema = z.object({ name: z.string().min(2), email: z.string().email() })
type FormValues = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<FormValues>({ resolver: zodResolver(schema) })

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('name')} />
  {errors.name && <p>{errors.name.message}</p>}
</form>
```

## Accessibility

- Every input needs a `<label>` (with `htmlFor`) or `aria-label`.
- Announce errors with `role="alert"` or `aria-describedby`.
- Use proper `type` and `autoComplete` attributes for mobile keyboards and autofill.

## Try it yourself

Build a registration form with name, email, password and a "terms" checkbox. Validate live (controlled inputs), submit with `useActionState` to a fake async function that fails for `taken@example.com`, show a pending button via `useFormStatus`, and display server errors.

Forms are central to business applications — sign-up, checkout, admin screens. Angular offers **reactive forms** (the long-standing standard in enterprise apps), **template-driven forms** (simple `ngModel` forms), and the newer **signal forms**. This lesson focuses on reactive forms and then shows signal forms.

## Setting up

```ts
import { Component, inject } from '@angular/core'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './signup.html',
})
export class Signup {
  private fb = inject(FormBuilder).nonNullable

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    newsletter: [true],
  })

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()   // reveal all errors
      return
    }
    const value = this.form.getRawValue() // fully typed: { name: string; email: string; … }
    console.log('Submitting', value)
  }
}
```

`nonNullable` means controls reset to their initial value instead of `null`, and gives precise types.

## Binding in the template

```html
<form [formGroup]="form" (ngSubmit)="submit()" novalidate>
  <label>
    Name
    <input formControlName="name" autocomplete="name" />
  </label>
  @if (form.controls.name.touched && form.controls.name.hasError('required')) {
    <p class="error">Name is required</p>
  }

  <label>
    Email
    <input type="email" formControlName="email" autocomplete="email" />
  </label>
  @if (form.controls.email.touched && form.controls.email.hasError('email')) {
    <p class="error">Enter a valid email address</p>
  }

  <label>
    Password
    <input type="password" formControlName="password" autocomplete="new-password" />
  </label>
  @if (form.controls.password.hasError('minlength'); as err) {
    <p class="error">At least 12 characters</p>
  }

  <label><input type="checkbox" formControlName="newsletter" /> Send me updates</label>

  <button type="submit" [disabled]="form.pending">Create account</button>
</form>
```

Each control tracks `value`, `valid`/`invalid`, `touched`/`dirty` and `errors`. Angular also adds CSS classes (`ng-invalid`, `ng-touched`) for styling.

## Custom validators

A validator is a function returning `null` (valid) or an errors object:

```ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

export const noWhitespace: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  (control.value ?? '').trim().length === 0 ? { whitespace: true } : null

// Cross-field validator on the group
export const passwordsMatch: ValidatorFn = (group: AbstractControl) => {
  const password = group.get('password')?.value
  const confirm = group.get('confirmPassword')?.value
  return password === confirm ? null : { passwordsMismatch: true }
}

form = this.fb.group(
  { password: [''], confirmPassword: [''] },
  { validators: [passwordsMatch] },
)
```

### Async validators

Check something on the server (e.g. username availability):

```ts
export function usernameAvailable(api: UserApi): AsyncValidatorFn {
  return (control) =>
    timer(400).pipe(                                     // debounce
      switchMap(() => api.isAvailable(control.value)),
      map((available) => (available ? null : { taken: true })),
      catchError(() => of(null)),
    )
}
```

While running, the control's status is `PENDING`.

## Dynamic forms with `FormArray`

```ts
form = this.fb.group({
  customer: ['', Validators.required],
  items: this.fb.array([this.createItem()]),
})

createItem() {
  return this.fb.group({ sku: ['', Validators.required], qty: [1, [Validators.required, Validators.min(1)]] })
}

get items() {
  return this.form.controls.items
}

addItem() {
  this.items.push(this.createItem())
}

removeItem(i: number) {
  this.items.removeAt(i)
}
```

```html
<div formArrayName="items">
  @for (item of items.controls; track item; let i = $index) {
    <div [formGroupName]="i">
      <input formControlName="sku" placeholder="SKU" />
      <input type="number" formControlName="qty" />
      <button type="button" (click)="removeItem(i)">Remove</button>
    </div>
  }
</div>
<button type="button" (click)="addItem()">Add line</button>
```

## Reacting to changes

```ts
// Observable of values
this.form.controls.country.valueChanges.pipe(takeUntilDestroyed()).subscribe((country) => {
  const postcode = this.form.controls.postcode
  postcode.setValidators(country === 'IN' ? [Validators.pattern(/^\d{6}$/)] : [])
  postcode.updateValueAndValidity()
})
```

Other useful APIs: `patchValue` (partial update), `setValue` (all fields), `reset()`, `disable()`/`enable()`, and `form.events` (a stream of all form events).

## Signal forms

Angular also provides **signal forms** (`@angular/forms/signals`): the model is a signal, validation rules are declared in a schema function, and each field exposes its state as signals.

```ts
import { Component, signal } from '@angular/core'
import { FormField, email, form, minLength, required } from '@angular/forms/signals'

@Component({
  selector: 'app-login',
  imports: [FormField],
  template: `
    <form (submit)="$event.preventDefault(); login()">
      <input type="email" [formField]="loginForm.email" />
      @if (loginForm.email().touched() && loginForm.email().invalid()) {
        @for (error of loginForm.email().errors(); track error) {
          <p class="error">{{ error.message }}</p>
        }
      }
      <input type="password" [formField]="loginForm.password" />
      <button type="submit" [disabled]="loginForm().invalid()">Log in</button>
    </form>
  `,
})
export class Login {
  model = signal({ email: '', password: '' })

  loginForm = form(this.model, (path) => {
    required(path.email, { message: 'Email is required' })
    email(path.email, { message: 'Enter a valid email' })
    required(path.password, { message: 'Password is required' })
    minLength(path.password, 12, { message: 'At least 12 characters' })
  })

  login() {
    console.log(this.model())
  }
}
```

Signal forms fit naturally with signal-based components. Reactive forms remain widely used and fully supported — you'll maintain plenty of them in existing enterprise apps.

## Good form UX

- Show errors after a field is **touched** or on submit, not while the user is still typing their first character.
- Use proper `type`, `autocomplete` and `<label>` elements for accessibility and autofill.
- Disable the submit button only while submitting — let users press it to see what's missing.
- Always validate again on the **server**.

## Try it yourself

Build a checkout form with contact details, a shipping address (6-digit Indian PIN code validation), a "billing same as shipping" checkbox that disables the billing group, a `FormArray` of gift messages, and a cross-field validator ensuring the delivery date is at least two days away.

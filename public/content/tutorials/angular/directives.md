A **directive** adds behaviour to an existing element. Components are directives with templates; **attribute directives** change the appearance or behaviour of the element they're on. They're ideal for reusable DOM behaviour: tooltips, permissions, auto-focus, click-outside, lazy images.

## Built-in attribute directives

```html
<div [class.active]="selected()">…</div>          <!-- class binding (preferred) -->
<div [ngClass]="{ active: selected(), disabled: disabled() }">…</div>
<div [ngStyle]="{ 'width.px': width() }">…</div>
<input [(ngModel)]="name" />                      <!-- FormsModule -->
```

In modern Angular, plain `[class]` and `[style]` bindings cover most uses of `ngClass`/`ngStyle`.

## Writing an attribute directive

```bash
ng generate directive highlight
```

```ts
import { Directive, input, signal } from '@angular/core'

@Directive({
  selector: '[appHighlight]',
  host: {
    '[style.backgroundColor]': 'active() ? color() : null',
    '(mouseenter)': 'active.set(true)',
    '(mouseleave)': 'active.set(false)',
  },
})
export class Highlight {
  color = input('#fff3bf', { alias: 'appHighlight' })
  active = signal(false)
}
```

```html
<p appHighlight>Hover me</p>
<p appHighlight="lightblue">Custom colour</p>
```

The **`host`** property binds properties, attributes, classes and events on the element the directive is attached to. It's preferred over the older `@HostBinding` / `@HostListener` decorators.

## Practical directive examples

### Auto-focus

```ts
import { Directive, ElementRef, afterNextRender, inject } from '@angular/core'

@Directive({ selector: '[appAutofocus]' })
export class Autofocus {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef)
    afterNextRender(() => el.nativeElement.focus())
  }
}
```

`afterNextRender` runs after the element is in the DOM — and never on the server, which matters for SSR.

### Click outside

```ts
import { Directive, ElementRef, inject, output } from '@angular/core'

@Directive({
  selector: '[appClickOutside]',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class ClickOutside {
  private el = inject<ElementRef<HTMLElement>>(ElementRef)
  appClickOutside = output<void>()

  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target as Node)) this.appClickOutside.emit()
  }
}
```

```html
<div class="dropdown" (appClickOutside)="open.set(false)">…</div>
```

### Permission-based visibility (a structural directive)

Structural directives add or remove elements using a template:

```ts
import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core'
import { AuthService } from './auth.service'

@Directive({ selector: '[appHasRole]' })
export class HasRole {
  private tpl = inject(TemplateRef)
  private vcr = inject(ViewContainerRef)
  private auth = inject(AuthService)
  role = input.required<string>({ alias: 'appHasRole' })

  constructor() {
    effect(() => {
      this.vcr.clear()
      if (this.auth.hasRole(this.role())) this.vcr.createEmbeddedView(this.tpl)
    })
  }
}
```

```html
<button *appHasRole="'admin'">Delete product</button>
```

The `*` is shorthand for wrapping the element in an `<ng-template>`. (UI permission checks are for UX only — the API must enforce them too.)

## Directive composition

Components can include directives through `hostDirectives`, composing reusable behaviours without inheritance:

```ts
@Component({
  selector: 'app-menu-button',
  hostDirectives: [ClickOutside, { directive: Tooltip, inputs: ['tooltip'] }],
  template: `<ng-content />`,
})
export class MenuButton {}
```

## Accessing the host element safely

- Prefer `host` bindings over touching `nativeElement` directly — they work with SSR and are declarative.
- If you must use the DOM API, do it in `afterNextRender` / `afterRenderEffect`.
- Use `Renderer2` in libraries that must run in non-browser environments.
- Never set `innerHTML` with unsanitised user data.

## Try it yourself

1. Write an `appTooltip` directive that shows a tooltip with the given text on hover and focus, and hides it on Escape.
2. Write an `appLazyImage` directive that loads the real `src` only when the image scrolls into view (using `IntersectionObserver`), disconnecting the observer on destroy.
3. Write a structural `*appFeature="'newCheckout'"` directive driven by a feature-flag service.

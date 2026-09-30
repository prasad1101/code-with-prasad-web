In a large Angular application, how you split responsibilities between components matters more than any single API. Good component architecture makes features easy to build, test, reuse and change.

## Smart (container) vs. presentational components

**Presentational components**:

- receive data through **inputs** and report user actions through **outputs**;
- don't inject application services or talk to APIs;
- are easy to reuse, test and showcase (e.g. in Storybook).

**Smart (container) components**:

- inject services and stores, load data, handle navigation;
- pass data down to presentational components and react to their events.

```ts
// Presentational
@Component({
  selector: 'app-product-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCard],
  template: `
    @for (p of products(); track p.id) {
      <app-product-card [product]="p" (addToCart)="addToCart.emit($event)" />
    } @empty {
      <p>No products match your filters.</p>
    }
  `,
})
export class ProductGrid {
  products = input.required<Product[]>()
  addToCart = output<Product>()
}

// Smart
@Component({
  selector: 'app-catalogue-page',
  imports: [ProductGrid, ProductFilters],
  template: `
    <app-product-filters [(category)]="category" />
    <app-product-grid [products]="products.value() ?? []" (addToCart)="cart.add($event)" />
  `,
})
export class CataloguePage {
  cart = inject(CartStore)
  category = signal<string | undefined>(undefined)
  products = httpResource<Product[]>(() => {
    const category = this.category()
    return { url: '/api/products', params: category ? { category } : undefined }
  })
}
```

Data flows **down** through inputs; events flow **up** through outputs. This one-way flow makes behaviour easy to follow.

## Composition over configuration

Instead of one giant component with 20 inputs controlling every variation, compose smaller pieces with **content projection**:

```html
<!-- Rigid -->
<app-dialog title="Delete product?" message="This cannot be undone" confirmText="Delete" [showCancel]="true" />

<!-- Composable -->
<app-dialog>
  <h2 dialog-title>Delete product?</h2>
  <p>This cannot be undone.</p>
  <div dialog-actions>
    <button (click)="close()">Cancel</button>
    <button class="danger" (click)="delete()">Delete</button>
  </div>
</app-dialog>
```

### Template-driven customisation with `ng-template`

Let consumers control how items render:

```ts
@Component({
  selector: 'app-data-list',
  imports: [NgTemplateOutlet],
  template: `
    <ul>
      @for (item of items(); track trackBy()(item)) {
        <li><ng-container [ngTemplateOutlet]="itemTemplate()" [ngTemplateOutletContext]="{ $implicit: item }" /></li>
      }
    </ul>
  `,
})
export class DataList<T> {
  items = input.required<T[]>()
  trackBy = input.required<(item: T) => unknown>()
  itemTemplate = contentChild.required(TemplateRef)
}
```

```html
<app-data-list [items]="users()" [trackBy]="byId">
  <ng-template let-user>
    <strong>{{ user.name }}</strong> — {{ user.email }}
  </ng-template>
</app-data-list>
```

## Querying children

```ts
// A child element or component in this component's template
searchInput = viewChild<ElementRef<HTMLInputElement>>('search')
tabs = contentChildren(Tab)   // projected children
```

These are signals, so dependent `computed`s and effects update automatically.

## Folder structure by feature

```text
src/app/
  core/                   # app-wide singletons: auth, interceptors, layout shell
  shared/
    ui/                   # presentational building blocks: button, card, dialog
    pipes/  directives/
  features/
    catalogue/
      catalogue.routes.ts
      pages/              # smart, routed components
      components/         # feature-specific presentational components
      data/               # API services, stores
    checkout/
    account/
```

Rules that keep this healthy:

- Features don't import from each other directly; shared code moves to `shared/` or a library.
- `shared/ui` never imports from `features/`.
- Each feature is lazy-loaded through its routes file.

## Communication patterns

| Situation | Pattern |
| --- | --- |
| Parent → child | Inputs |
| Child → parent | Outputs |
| Two-way value | `model()` |
| Siblings / distant components | A shared service or store (signals) |
| Parent needs child API | `viewChild` / template reference |
| Cross-feature events | A service/store in `core`, or the router (URL state) |

**Put state in the URL** when users should be able to bookmark or share it (filters, pagination, selected tab) — use query parameters and component input binding.

## Designing a reusable component library

- Consistent input naming (`size`, `variant`, `disabled`) across components.
- Accessibility built in: keyboard support, focus management, ARIA roles and labels.
- Theming via CSS custom properties rather than inputs for every colour.
- `OnPush` and signals everywhere.
- Documented examples (Storybook) and tests for each component.
- Consider **Angular CDK** for accessible primitives (overlays, focus trapping, drag and drop, virtual scrolling) instead of building them from scratch.

## Try it yourself

Refactor a product page that does everything in one component into: a smart `ProductPage` (loads data, handles cart), presentational `ProductGallery`, `ProductInfo`, `ReviewList` and a reusable `Tabs` component using content projection. Keep all API calls in the smart component.

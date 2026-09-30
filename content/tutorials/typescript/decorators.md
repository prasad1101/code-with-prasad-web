**Decorators** are functions that annotate and modify classes and class members using the `@expression` syntax. Angular and NestJS are built on them (`@Component`, `@Injectable`, `@Controller`), so understanding what they do removes a lot of "magic".

## Two flavours of decorators

- **Standard (ECMAScript) decorators** — supported by TypeScript 5.0+ without any flag. This is the future-proof version.
- **Legacy "experimental" decorators** — enabled with `"experimentalDecorators": true`. Angular and NestJS use these (together with `emitDecoratorMetadata` for dependency injection in NestJS).

The syntax at the usage site looks the same; the decorator function signatures differ. This lesson shows standard decorators and then how framework decorators fit in.

## A method decorator

```ts
function log<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  const name = String(context.name)
  return function (this: This, ...args: Args): Return {
    console.log(`→ ${name}(${args.map((a) => JSON.stringify(a)).join(', ')})`)
    const result = target.call(this, ...args)
    console.log(`← ${name} returned`, result)
    return result
  }
}

class Calculator {
  @log
  add(a: number, b: number) {
    return a + b
  }
}

new Calculator().add(2, 3)
// → add(2, 3)
// ← add returned 5
```

A method decorator receives the original method and a **context** object, and may return a replacement function.

## Decorator factories

To pass options, write a function that returns a decorator:

```ts
function retry(times: number) {
  return function <This, Args extends unknown[], Return>(
    target: (this: This, ...args: Args) => Promise<Return>,
    _context: ClassMethodDecoratorContext,
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      for (let attempt = 0; ; attempt++) {
        try {
          return await target.call(this, ...args)
        } catch (e) {
          if (attempt >= times) throw e
        }
      }
    }
  }
}

class PaymentsClient {
  @retry(2)
  async charge(amount: number) {
    /* call the payment API */
  }
}
```

## Class decorators

```ts
const registry = new Map<string, new (...args: any[]) => unknown>()

function register(name: string) {
  return function <C extends new (...args: any[]) => unknown>(value: C, _ctx: ClassDecoratorContext) {
    registry.set(name, value)
    return value
  }
}

@register('email')
class EmailChannel {}
```

## Field decorators and `addInitializer`

```ts
function bound<This, T extends (...args: any[]) => any>(
  _target: T,
  context: ClassMethodDecoratorContext<This, T>,
) {
  context.addInitializer(function (this: This) {
    const self = this as any
    self[context.name] = self[context.name].bind(this)
  })
}

class Button {
  label = 'Save'
  @bound
  onClick() {
    console.log(this.label) // `this` is correct even when passed as a callback
  }
}
```

## How framework decorators use this

Framework decorators mostly **record metadata** that the framework reads later:

```ts
@Component({
  selector: 'app-user-card',
  template: `<h2>{{ user().name }}</h2>`,
})
export class UserCardComponent {
  user = input.required<User>()
}
```

`@Component` attaches configuration (selector, template) to the class; Angular's compiler turns it into rendering instructions. NestJS's `@Controller('users')` and `@Get(':id')` record routing metadata that Nest uses to build the router, and `@Injectable()` marks classes for its dependency-injection container.

## When to write your own

Good fits: cross-cutting concerns applied to many methods — logging, timing, caching, retries, authorisation checks, validation. Keep them small and well-named; hidden behaviour is hard to debug. For plain functions (not class members), a higher-order function (`withRetry(fn)`) does the same job without decorators.

## Try it yourself

1. Write a `@measure` decorator that logs how long a method takes (works for async methods too).
2. Write a `@memoize` decorator for methods with a single primitive argument.
3. Write a `@deprecated(message)` decorator that warns once per method.

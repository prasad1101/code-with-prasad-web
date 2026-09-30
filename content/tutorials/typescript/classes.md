TypeScript adds type annotations, access modifiers and abstract classes on top of JavaScript classes. These features are used heavily in Angular and NestJS.

## Typed fields and constructors

```ts
class Account {
  owner: string
  balance: number

  constructor(owner: string, balance = 0) {
    this.owner = owner
    this.balance = balance
  }

  deposit(amount: number): void {
    this.balance += amount
  }
}
```

With `strictPropertyInitialization` (part of `strict`), every field must be initialised in its declaration or the constructor.

## Access modifiers

```ts
class Employee {
  public name: string          // default — accessible everywhere
  protected department: string // this class and subclasses
  private salary: number       // this class only (compile-time check)

  constructor(name: string, department: string, salary: number) {
    this.name = name
    this.department = department
    this.salary = salary
  }
}
```

`private` is enforced only by the compiler; at runtime the property is a normal one. JavaScript's `#private` fields are enforced at runtime:

```ts
class Wallet {
  #pin: string
  constructor(pin: string) { this.#pin = pin }
  verify(pin: string) { return pin === this.#pin }
}
```

Use `#private` when true privacy matters; TypeScript's `private` is fine for design-time encapsulation.

## Parameter properties

A shorthand that declares and assigns fields from constructor parameters — you'll see it constantly in Angular services:

```ts
class UserService {
  constructor(
    private readonly http: HttpClient,
    private readonly logger: Logger,
  ) {}

  load(id: string) {
    this.logger.info(`Loading ${id}`)
    return this.http.get(`/api/users/${id}`)
  }
}
```

(Parameter properties generate code, so they're not "erasable syntax". Newer Angular code often uses the `inject()` function instead.)

## `readonly`

```ts
class Point {
  constructor(readonly x: number, readonly y: number) {}
}

const p = new Point(1, 2)
p.x = 5 // Error
```

## Implementing interfaces

`implements` checks that a class satisfies a contract:

```ts
interface Cache<T> {
  get(key: string): T | undefined
  set(key: string, value: T): void
}

class MemoryCache<T> implements Cache<T> {
  private store = new Map<string, T>()
  get(key: string) { return this.store.get(key) }
  set(key: string, value: T) { this.store.set(key, value) }
}
```

`implements` doesn't change the class's type or add anything — it's purely a check.

## Abstract classes

An abstract class can't be instantiated; it provides shared code and forces subclasses to implement abstract members:

```ts
abstract class Notifier {
  abstract send(to: string, message: string): Promise<void>

  async notifyAll(recipients: string[], message: string) {
    await Promise.all(recipients.map((r) => this.send(r, message)))
  }
}

class EmailNotifier extends Notifier {
  async send(to: string, message: string) {
    console.log(`Emailing ${to}: ${message}`)
  }
}

new Notifier()        // Error: cannot create an instance of an abstract class
new EmailNotifier().notifyAll(['a@x.com'], 'Hi')
```

## `override`

With `noImplicitOverride`, methods that override a parent method must say so — catching typos and parent renames:

```ts
class Base {
  greet() { return 'hello' }
}
class Child extends Base {
  override greet() { return 'hi' }
}
```

## Static members

Static members belong to the class, not instances — handy for factory methods:

```ts
class Money {
  static zero(currency: string) {
    return new Money(0, currency)
  }

  constructor(readonly amount: number, readonly currency: string) {}

  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error('Currency mismatch')
    return new Money(this.amount + other.amount, this.currency)
  }
}

const total = Money.zero('INR').add(new Money(250, 'INR'))
```

## Classes are also types

A class declaration creates a type for its instances. Because TypeScript is structural, any object with the same public shape is compatible:

```ts
class Point2D { constructor(public x: number, public y: number) {} }
const p: Point2D = { x: 1, y: 2 } // OK — same shape
```

Private and protected members make classes nominal: two classes with the same private field aren't interchangeable.

## Try it yourself

Write an abstract `Shape` with an abstract `area()` and a concrete `describe()`. Implement `Circle` and `Rectangle` with `readonly` parameter properties, and a `Repository<T extends { id: string }>` interface implemented by an in-memory class.

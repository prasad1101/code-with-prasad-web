**Classes** are a clean syntax for creating objects that share behaviour. Under the hood they're built on prototypes (covered in the Advanced chapter), but the class syntax is what you'll use day to day.

## Defining a class

```js
class BankAccount {
  constructor(owner, balance = 0) {
    this.owner = owner
    this.balance = balance
  }

  deposit(amount) {
    if (amount <= 0) throw new RangeError('Deposit must be positive')
    this.balance += amount
    return this
  }

  withdraw(amount) {
    if (amount > this.balance) throw new Error('Insufficient funds')
    this.balance -= amount
    return this
  }
}

const account = new BankAccount('Asha', 1000)
account.deposit(500).withdraw(200) // methods returning `this` can be chained
console.log(account.balance)       // 1300
```

`constructor` runs when you call `new BankAccount(…)`. Methods are shared by every instance.

## Class fields and private members

Fields can be declared directly in the class body. Names starting with `#` are **truly private** — inaccessible outside the class:

```js
class Counter {
  count = 0            // public field
  #step              // private field

  constructor(step = 1) {
    this.#step = step
  }

  increment() {
    this.count += this.#step
  }

  #log() {           // private method
    console.log(this.count)
  }
}

const c = new Counter(5)
c.increment()
c.count     // 5
c.#step     // SyntaxError: private field
```

## Getters and setters

```js
class Temperature {
  #celsius = 0

  get fahrenheit() {
    return this.#celsius * 9 / 5 + 32
  }

  set celsius(value) {
    if (value < -273.15) throw new RangeError('Below absolute zero')
    this.#celsius = value
  }
}

const t = new Temperature()
t.celsius = 25
console.log(t.fahrenheit) // 77
```

## Static members

`static` members belong to the class itself, not to instances — useful for factory functions and constants:

```js
class User {
  static #nextId = 1

  static fromJSON(json) {
    const { name, email } = JSON.parse(json)
    return new User(name, email)
  }

  constructor(name, email) {
    this.id = User.#nextId++
    this.name = name
    this.email = email
  }
}

const u = User.fromJSON('{"name":"Ravi","email":"ravi@example.com"}')
```

## Inheritance

`extends` creates a subclass. Call `super(…)` in the constructor before using `this`, and `super.method()` to reuse the parent's behaviour:

```js
class SavingsAccount extends BankAccount {
  constructor(owner, balance, rate) {
    super(owner, balance)
    this.rate = rate
  }

  addInterest() {
    return this.deposit(this.balance * this.rate)
  }

  withdraw(amount) {
    if (amount > 10_000) throw new Error('Daily limit exceeded')
    return super.withdraw(amount)
  }
}

const s = new SavingsAccount('Meera', 2000, 0.05)
s.addInterest()
s instanceof SavingsAccount // true
s instanceof BankAccount    // true
```

## Composition over inheritance

Deep inheritance chains become rigid quickly. Often it's simpler to give an object the capabilities it needs:

```js
const canLog = (obj) => ({ ...obj, log: (msg) => console.log(`[${obj.name}] ${msg}`) })
const service = canLog({ name: 'payments' })
service.log('started')
```

A good rule: use inheritance for genuine "is-a" relationships with shared behaviour, and composition for everything else.

## Classes and `this`

Methods lose their `this` when passed around as callbacks:

```js
const { deposit } = account
deposit(10) // TypeError: Cannot read properties of undefined
```

Fix it with an arrow-function field (bound per instance) or `.bind`:

```js
class Clicker {
  count = 0
  handleClick = () => {   // arrow function captures `this`
    this.count++
  }
}
```

## Try it yourself

Create a `Shape` class with an `area()` method that throws "not implemented", and subclasses `Circle` and `Rectangle` that implement it. Add a static `Shape.largest(shapes)` that returns the shape with the biggest area, and give `Rectangle` a private `#validate()` method called from its constructor.

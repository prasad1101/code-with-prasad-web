You don't need to install anything to start writing JavaScript — every browser already includes a JavaScript engine. In this lesson you'll run code in three ways: in the browser console, in an HTML page, and with Node.js.

## Option 1: the browser console

1. Open Chrome, Firefox, Edge or Safari.
2. Open the developer tools: press **F12**, or **Cmd + Option + J** on macOS (Chrome) / **Ctrl + Shift + J** on Windows and Linux.
3. Click the **Console** tab.
4. Type the following and press Enter:

```js
console.log('Hello from the console!')
```

The console is perfect for quick experiments. You can also type expressions like `2 + 3` and see the result immediately.

## Option 2: a script in an HTML page

Create a folder with two files.

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My first script</title>
  </head>
  <body>
    <h1 id="title">Hello!</h1>
    <script src="app.js"></script>
  </body>
</html>
```

`app.js`:

```js
const heading = document.getElementById('title')
heading.textContent = 'Hello from JavaScript!'
console.log('Page updated')
```

Open `index.html` in your browser. The heading text changes, and "Page updated" appears in the console. The `<script>` tag is placed at the end of `<body>` so the heading already exists when the script runs.

## Option 3: Node.js

Node.js runs JavaScript outside the browser.

1. Download the **LTS** version from [nodejs.org](https://nodejs.org) and install it.
2. Check the installation in a terminal:

```bash
node --version
```

3. Create a file called `hello.js`:

```js
const year = new Date().getFullYear()
console.log(`Hello from Node.js! It's ${year}.`)
```

4. Run it:

```bash
node hello.js
```

Node.js has no `document` or `window` — those belong to the browser. It adds its own features instead, such as reading files and starting web servers.

## A good editor

Any text editor works, but **Visual Studio Code** is free and has excellent JavaScript support: autocompletion, error highlighting and a built-in terminal.

## Comments

Comments are notes for humans; JavaScript ignores them.

```js
// A single-line comment

/*
  A multi-line comment.
  Useful for longer explanations.
*/
```

## Try it yourself

Write a Node.js script that prints your name and your favourite programming language on two separate lines.

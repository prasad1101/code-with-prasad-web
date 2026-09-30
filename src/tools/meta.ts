/*
 * Plain data describing every built-in developer tool — no React, no icons — so the build
 * step (vite.config.ts) can read it to write each tool's static HTML page and sitemap entry.
 * The registry (./registry.ts) adds the icon and lazily loaded component.
 */

export const TOOL_CATEGORIES = [
  'Formatters & converters',
  'Encoding & security',
  'Everyday helpers',
] as const
export type ToolCategory = (typeof TOOL_CATEGORIES)[number]

export type ToolMeta = {
  slug: string
  title: string
  /** Search-friendly <title>, phrased the way people search for the tool. */
  seoTitle: string
  /** One line for cards. */
  summary: string
  /** Longer text for the tool page header and meta description. */
  description: string
  category: ToolCategory
  keywords: string
  /** Questions and answers shown under the tool. */
  faq: [question: string, answer: string][]
}

export const TOOL_META: ToolMeta[] = [
  {
    slug: 'json-formatter',
    title: 'JSON Formatter & Validator',
    summary: 'Beautify, minify, validate and sort JSON with exact error locations.',
    description:
      'Paste JSON to pretty-print, minify or sort its keys. Invalid JSON is pinpointed to the exact line and column, with a plain-English reason.',
    category: 'Formatters & converters',
    keywords: 'json beautify pretty print minify validate lint sort keys',
    seoTitle: 'JSON Formatter & Validator Online — Beautify, Minify, Validate',
    faq: [
      [
        'How do I find the error in invalid JSON?',
        'Paste it in: the validator reports the first problem with its exact line and column — for example a trailing comma, a missing quote, or single quotes instead of double quotes.',
      ],
      [
        'Is my JSON uploaded anywhere?',
        'No. Formatting and validation run entirely in your browser, so it is safe to paste API responses, configs and logs.',
      ],
      [
        'What is the difference between beautify and minify?',
        'Beautify adds indentation and line breaks so humans can read it; minify removes all optional whitespace to make payloads smaller. The data itself is identical.',
      ],
    ],
  },
  {
    slug: 'data-converter',
    title: 'JSON ↔ CSV ↔ YAML Converter',
    summary: 'Convert data between JSON, CSV and YAML in either direction.',
    description:
      'Convert between JSON, CSV and YAML. Nested objects are flattened to dotted column names for CSV, and CSV numbers and booleans can be typed automatically.',
    category: 'Formatters & converters',
    keywords: 'json csv yaml yml convert excel spreadsheet',
    seoTitle: 'JSON to CSV, CSV to JSON & YAML Converter Online',
    faq: [
      [
        'How are nested JSON objects converted to CSV?',
        'Nested objects are flattened into dotted column names (address.city), and arrays are kept as JSON text in a single cell, so no data is lost.',
      ],
      [
        'Can I open the CSV in Excel?',
        'Yes. Choose comma, semicolon, tab or pipe as the delimiter; semicolons work best for Excel in locales that use a comma as the decimal separator.',
      ],
      [
        'Does CSV to JSON keep numbers as numbers?',
        'With “Detect numbers & booleans” on, values such as 42 and true become JSON numbers and booleans; turn it off to keep every value as text.',
      ],
    ],
  },
  {
    slug: 'sql-formatter',
    title: 'SQL Formatter',
    summary: 'Format messy SQL for PostgreSQL, MySQL, SQL Server, BigQuery and more.',
    description:
      'Turn one-line or messy SQL into readable, consistently indented queries. Supports standard SQL plus PostgreSQL, MySQL, SQL Server, SQLite, BigQuery, Snowflake, Spark and more.',
    category: 'Formatters & converters',
    keywords: 'sql format beautify query postgres mysql tsql bigquery snowflake',
    seoTitle: 'SQL Formatter & Beautifier Online — PostgreSQL, MySQL, SQL Server',
    faq: [
      [
        'Which SQL dialects are supported?',
        'Standard SQL, PostgreSQL, MySQL, MariaDB, SQL Server (T-SQL), Oracle PL/SQL, SQLite, BigQuery, Snowflake, Redshift, Spark SQL, DuckDB and Trino/Presto.',
      ],
      [
        'Does formatting change what my query does?',
        'No. Only whitespace, line breaks and (optionally) keyword case change; identifiers, literals and logic stay exactly the same.',
      ],
      [
        'Should SQL keywords be uppercase?',
        'It is a style choice, not a requirement. Uppercase keywords are the most common convention because they separate SQL syntax from table and column names.',
      ],
    ],
  },
  {
    slug: 'text-diff',
    title: 'Text Diff Checker',
    summary: 'Compare two texts and see what was added, removed or changed.',
    description:
      'Compare two versions of text or code line by line, word by word or character by character, with additions and removals highlighted.',
    category: 'Formatters & converters',
    keywords: 'diff compare difference text code merge changes',
    seoTitle: 'Text Diff Checker — Compare Two Texts or Code Online',
    faq: [
      [
        'What is the difference between line, word and character diff?',
        'Line diff is best for code and config files; word diff for prose and small edits within a line; character diff shows the exact characters that changed.',
      ],
      [
        'Can I ignore whitespace or case changes?',
        'Yes. Tick “Ignore whitespace” (line mode) or “Ignore case” to hide changes that don’t matter.',
      ],
      [
        'Is the text I compare stored?',
        'No. The comparison runs in your browser and nothing is uploaded or saved.',
      ],
    ],
  },
  {
    slug: 'markdown-preview',
    title: 'Markdown Live Preview',
    summary: 'Write Markdown and see the rendered result instantly.',
    description:
      'Write GitHub-flavoured Markdown — tables, task lists, code blocks with syntax highlighting — and see the rendered result as you type. Copy the HTML when you are done.',
    category: 'Formatters & converters',
    keywords: 'markdown md preview readme gfm html editor',
    seoTitle: 'Markdown Live Preview & Editor Online (GitHub Flavored)',
    faq: [
      [
        'Does it support GitHub-flavoured Markdown?',
        'Yes — tables, task lists, strikethrough, autolinks and fenced code blocks with syntax highlighting.',
      ],
      [
        'Can I get the HTML output?',
        'Use “Copy HTML” to copy the rendered, sanitised HTML for use in a CMS, email or web page.',
      ],
      [
        'Is it good for writing README files?',
        'Yes. It renders the same Markdown features GitHub uses for README.md files, so you can preview before you commit.',
      ],
    ],
  },
  {
    slug: 'case-converter',
    title: 'Case Converter',
    summary: 'camelCase, snake_case, kebab-case, PascalCase and more in one click.',
    description:
      'Convert identifiers and text between camelCase, PascalCase, snake_case, CONSTANT_CASE, kebab-case, Title Case and more. Each line converts separately, so whole lists work.',
    category: 'Formatters & converters',
    keywords: 'case camel snake kebab pascal title upper lower constant variable name',
    seoTitle: 'Case Converter — camelCase, snake_case, kebab-case, PascalCase',
    faq: [
      [
        'Which naming convention should I use?',
        'Follow the language: camelCase for JavaScript variables, PascalCase for classes and React components, snake_case for Python and SQL, CONSTANT_CASE for constants, kebab-case for URLs and CSS classes.',
      ],
      [
        'Can I convert many names at once?',
        'Yes. Put one identifier per line and every line is converted separately.',
      ],
      [
        'How are acronyms handled?',
        'Words are split at case changes, so parseHTTPResponse becomes parse http response and then parse_http_response or parseHttpResponse.',
      ],
    ],
  },
  {
    slug: 'base64',
    title: 'Base64 Encoder / Decoder',
    summary: 'Encode and decode Base64 (standard and URL-safe) with full Unicode.',
    description:
      'Encode text to Base64 or decode it back, including URL-safe Base64 and full Unicode (emoji, Hindi, accented characters). Files can be encoded to data URLs too.',
    category: 'Encoding & security',
    keywords: 'base64 encode decode btoa atob data url urlsafe',
    seoTitle: 'Base64 Encode & Decode Online — UTF-8, URL-safe, Files',
    faq: [
      [
        'Is Base64 encryption?',
        'No. Base64 is an encoding that anyone can reverse; never use it to protect passwords or secrets.',
      ],
      [
        'What is URL-safe Base64?',
        'A variant that uses - and _ instead of + and / and drops = padding, so the value can go in URLs and JWTs without escaping.',
      ],
      [
        'Why does decoding say the result is not text?',
        'The Base64 represents binary data — an image, PDF or zip file — rather than UTF-8 text.',
      ],
    ],
  },
  {
    slug: 'url-encoder',
    title: 'URL Encoder / Decoder & Parser',
    summary: 'Percent-encode or decode text, and break URLs into their parts.',
    description:
      'Percent-encode and decode URL components, and parse a full URL into protocol, host, path, hash and decoded query parameters.',
    category: 'Encoding & security',
    keywords: 'url encode decode percent uri component query string parse params',
    seoTitle: 'URL Encoder / Decoder Online — Percent-Encoding & URL Parser',
    faq: [
      [
        'What is the difference between encodeURI and encodeURIComponent?',
        'encodeURIComponent also escapes reserved characters such as & = ? / #, so use it for individual query values; encodeURI keeps them so a whole URL stays valid.',
      ],
      [
        'Why do spaces become %20 or +?',
        'Percent-encoding uses %20; HTML form encoding (application/x-www-form-urlencoded) uses +. Tick “Treat + as space” when decoding form data.',
      ],
      [
        'What does the URL parser show?',
        'The protocol, host, path, hash and every query parameter decoded — handy for debugging redirects and tracking links.',
      ],
    ],
  },
  {
    slug: 'jwt-decoder',
    title: 'JWT Decoder',
    summary: 'Inspect a JSON Web Token’s header, payload and expiry.',
    description:
      'Decode a JSON Web Token to read its header and payload claims, with issued-at and expiry times shown in your time zone and a clear expired / valid indicator.',
    category: 'Encoding & security',
    keywords: 'jwt json web token decode bearer auth claims exp iat oauth',
    seoTitle: 'JWT Decoder Online — Decode JSON Web Token Header & Payload',
    faq: [
      [
        'Is it safe to paste my JWT here?',
        'The token is decoded in your browser and never sent anywhere. Even so, avoid pasting live production tokens into any website you don’t control.',
      ],
      [
        'Does this verify the JWT signature?',
        'No. Decoding only reads the header and payload. Servers must always verify the signature with the secret or public key before trusting the claims.',
      ],
      [
        'What do exp, iat and nbf mean?',
        'They are Unix timestamps: exp is when the token expires, iat when it was issued and nbf the time before which it must not be accepted.',
      ],
    ],
  },
  {
    slug: 'hash-generator',
    title: 'Hash Generator',
    summary: 'SHA-1, SHA-256, SHA-384 and SHA-512 hashes and HMACs of text or files.',
    description:
      'Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes of text or files using your browser’s Web Crypto API, optionally as an HMAC with a secret key. Compare against an expected checksum.',
    category: 'Encoding & security',
    keywords: 'hash sha sha1 sha256 sha512 hmac checksum digest crypto file',
    seoTitle: 'SHA-256 Hash Generator Online — SHA-1, SHA-512, HMAC & File Checksums',
    faq: [
      [
        'How do I verify a downloaded file’s checksum?',
        'Choose “Hash a file”, then paste the published checksum into the compare box; the tool tells you which algorithm matches.',
      ],
      [
        'What is an HMAC?',
        'A hash combined with a secret key. It proves a message came from someone who knows the key — used for webhook signatures and API request signing.',
      ],
      [
        'Can I hash passwords with SHA-256?',
        'Not for storage. Use a slow, salted password hash such as bcrypt, scrypt or Argon2; plain SHA hashes can be brute-forced quickly.',
      ],
    ],
  },
  {
    slug: 'uuid-generator',
    title: 'UUID Generator',
    summary: 'Generate v4 or time-ordered v7 UUIDs in bulk, and inspect existing ones.',
    description:
      'Generate random (v4) or time-ordered (v7) UUIDs one at a time or in bulk, in the format you need. Paste a UUID to see its version and, for v7, when it was created.',
    category: 'Encoding & security',
    keywords: 'uuid guid v4 v7 random unique id generator bulk',
    seoTitle: 'UUID Generator Online — v4 & v7 GUIDs in Bulk',
    faq: [
      [
        'What is the difference between UUID v4 and v7?',
        'v4 is completely random. v7 starts with a millisecond timestamp, so newer ids sort after older ones, which keeps database indexes efficient.',
      ],
      [
        'Can two UUIDs ever collide?',
        'In practice no: a v4 UUID has 122 random bits, so the chance of a duplicate is negligible even across billions of ids.',
      ],
      [
        'Is a UUID the same as a GUID?',
        'Yes. GUID is Microsoft’s name for the same 128-bit identifier format.',
      ],
    ],
  },
  {
    slug: 'password-generator',
    title: 'Password Generator',
    summary: 'Strong random passwords and memorable passphrases.',
    description:
      'Create strong passwords or memorable passphrases using your browser’s cryptographically secure random number generator, with a strength estimate in bits of entropy.',
    category: 'Encoding & security',
    keywords: 'password passphrase generator random secure strong secret',
    seoTitle: 'Strong Password Generator & Passphrase Generator — Secure, Free',
    faq: [
      [
        'How long should a password be?',
        'At least 16 characters for important accounts, or a passphrase of 5 or more random words. The strength meter shows the entropy in bits — aim for 80+.',
      ],
      [
        'Are these passwords really random?',
        'Yes. They come from your browser’s cryptographically secure random number generator (crypto.getRandomValues) and are never sent or stored.',
      ],
      [
        'Passphrase or password?',
        'Passphrases are easier to type and remember at similar strength; random passwords are more compact. Store either in a password manager.',
      ],
    ],
  },
  {
    slug: 'regex-tester',
    title: 'Regex Tester',
    summary: 'Test JavaScript regular expressions with live highlighted matches.',
    description:
      'Write a JavaScript regular expression and see matches highlighted live, with capture groups, named groups, flags, a replace preview and a quick-reference cheat sheet.',
    category: 'Everyday helpers',
    keywords: 'regex regexp regular expression test match replace pattern groups',
    seoTitle: 'Regex Tester Online — JavaScript Regular Expressions with Highlighting',
    faq: [
      [
        'Which regex flavour is used?',
        'JavaScript (ECMAScript) regular expressions — the same engine used by browsers and Node.js, including named groups, lookbehind and the u and s flags.',
      ],
      [
        'How do I reference groups in a replacement?',
        'Use $1, $2 … for numbered groups, $<name> for named groups and $& for the whole match.',
      ],
      [
        'Why does my regex only match once?',
        'Without the g (global) flag, JavaScript stops at the first match. Tick “global (g)” to find every match.',
      ],
    ],
  },
  {
    slug: 'timestamp-converter',
    title: 'Unix Timestamp Converter',
    summary: 'Convert epoch times to dates and back, across time zones.',
    description:
      'Convert Unix timestamps (seconds, milliseconds, microseconds) to human-readable dates in any time zone, and turn a date and time back into a timestamp.',
    category: 'Everyday helpers',
    keywords: 'unix epoch timestamp date time zone convert utc ist iso 8601',
    seoTitle: 'Unix Timestamp Converter — Epoch to Date & Date to Epoch (IST, UTC)',
    faq: [
      [
        'What is a Unix timestamp?',
        'The number of seconds since 1 January 1970 00:00:00 UTC. JavaScript’s Date.now() returns milliseconds, which is why some timestamps have 13 digits.',
      ],
      [
        'How do I know if a timestamp is in seconds or milliseconds?',
        'The converter detects it from the size: 10 digits is seconds, 13 milliseconds, 16 microseconds and 19 nanoseconds.',
      ],
      [
        'Can I convert to India Standard Time?',
        'Yes. Pick Asia/Kolkata (UTC+05:30) or any other time zone from the list.',
      ],
    ],
  },
  {
    slug: 'cron-explainer',
    title: 'Cron Expression Explainer',
    summary: 'Turn cron schedules into plain English and see upcoming runs.',
    description:
      'Paste a cron expression to read it in plain English and see its next run times. Includes common presets and a field-by-field reference.',
    category: 'Everyday helpers',
    keywords: 'cron crontab schedule expression explain next run job airflow kubernetes',
    seoTitle: 'Cron Expression Explainer & Next Run Calculator',
    faq: [
      [
        'What do the five cron fields mean?',
        'Minute, hour, day of month, month and day of week — for example 0 9 * * 1-5 runs at 9:00 AM Monday to Friday.',
      ],
      [
        'Which time zone do cron jobs run in?',
        'The server’s time zone unless the scheduler says otherwise (Kubernetes and GitHub Actions use UTC by default). Tick “Show times in UTC” to compare.',
      ],
      [
        'What happens if both day of month and day of week are set?',
        'Standard (Vixie) cron runs the job when either one matches, not only when both do.',
      ],
    ],
  },
  {
    slug: 'number-base-converter',
    title: 'Number Base Converter',
    summary: 'Binary, octal, decimal and hex — any size, all at once.',
    description:
      'Convert integers of any size between binary, octal, decimal, hexadecimal and any base from 2 to 36. Type in any field and the others update instantly.',
    category: 'Everyday helpers',
    keywords: 'binary octal decimal hex hexadecimal base radix convert bits',
    seoTitle: 'Binary, Hex, Decimal & Octal Converter — Number Base Converter',
    faq: [
      [
        'How do I convert hexadecimal to decimal?',
        'Type the hex value (with or without 0x) in the Hexadecimal field and the decimal, binary and octal values update instantly.',
      ],
      [
        'Is there a size limit?',
        'No. The converter uses BigInt, so it handles integers far larger than 64 bits exactly.',
      ],
      [
        'Can I convert to other bases?',
        'Yes — use the custom field for any base from 2 to 36, such as base 36 for short ids.',
      ],
    ],
  },
  {
    slug: 'color-converter',
    title: 'Color Converter & Picker',
    summary: 'HEX, RGB and HSL conversion with shades and contrast checks.',
    description:
      'Pick a colour or paste HEX, RGB or HSL to convert between formats, generate tints and shades, and check WCAG contrast against white and black text.',
    category: 'Everyday helpers',
    keywords: 'color colour hex rgb hsl picker convert contrast wcag palette shades css',
    seoTitle: 'Color Converter — HEX to RGB, RGB to HSL & WCAG Contrast Checker',
    faq: [
      [
        'How do I convert HEX to RGB?',
        'Paste the HEX code (for example #6d28d9) and the RGB and HSL values appear instantly, ready to copy as CSS.',
      ],
      [
        'What contrast ratio do I need for accessibility?',
        'WCAG 2 AA requires 4.5:1 for normal text and 3:1 for large text; AAA requires 7:1. The checker tests your colour against white and black text.',
      ],
      [
        'What are tints and shades?',
        'Lighter and darker versions of the same hue — useful for building a consistent colour palette.',
      ],
    ],
  },
  {
    slug: 'dummy-data',
    title: 'Lorem Ipsum & Dummy Data Generator',
    summary: 'Placeholder text plus realistic fake JSON, CSV or SQL records.',
    description:
      'Generate lorem ipsum placeholder text, or realistic fake records — users, employees, orders, products — as JSON, CSV or SQL INSERT statements for mocks, tests and seed data.',
    category: 'Everyday helpers',
    keywords: 'lorem ipsum placeholder dummy fake mock data json csv sql seed test faker',
    seoTitle: 'Lorem Ipsum & Fake Data Generator — JSON, CSV & SQL Mock Data',
    faq: [
      [
        'Is the generated data real?',
        'No. All names, emails and numbers are random and fictional, and emails use the reserved example.com / .org / .net domains.',
      ],
      [
        'What formats can I export?',
        'JSON arrays, CSV with a header row, or SQL INSERT statements for a table name you choose.',
      ],
      [
        'What is lorem ipsum?',
        'Scrambled Latin placeholder text used in layouts and mock-ups so the design can be judged without real copy.',
      ],
    ],
  },
]

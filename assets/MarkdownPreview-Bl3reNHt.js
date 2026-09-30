import{a as e,n as t,t as n}from"./jsx-runtime-OQpaS_Dv.js";import{n as r,t as i}from"./rich-C52tpdm9.js";import{N as a}from"./logic-3E0YX8dj.js";import{l as o,r as s,s as c}from"./ui-CyVci0tJ.js";var l=e(t(),1),u=n(),d=`# Project title

A short description of **what this does** and _why it exists_.

## Features

- [x] Fast and lightweight
- [x] Works offline
- [ ] Dark mode (coming soon)

## Quick start

\`\`\`bash
npm install
npm run dev
\`\`\`

\`\`\`ts
export function add(a: number, b: number): number {
  return a + b
}
\`\`\`

## Comparison

| Tool   | Language   | Stars |
| ------ | ---------- | ----: |
| React  | JavaScript | ★★★★★ |
| Django | Python     | ★★★★☆ |

> **Tip:** Use \`inline code\` for commands and file names.

Read more on [the blog](/blog).
`,f=[{value:`split`,label:`Split`},{value:`edit`,label:`Editor`},{value:`preview`,label:`Preview`}];function p(){let[e,t]=(0,l.useState)(d),[n,p]=(0,l.useState)(`split`),m=(0,l.useDeferredValue)(e),h=(0,l.useMemo)(()=>i(m,`/tools/markdown-preview`,{keepH1:!0}).html,[m]),g=a(e);return(0,u.jsxs)(`div`,{className:`space-y-5`,children:[(0,u.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-3`,children:[(0,u.jsx)(c,{label:`Layout`,value:n,onChange:p,options:f}),(0,u.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,u.jsxs)(`span`,{className:`text-muted text-sm`,children:[g.words.toLocaleString(),` words · `,g.characters.toLocaleString(),` chars`]}),(0,u.jsx)(s,{value:h,label:`Copy HTML`})]})]}),(0,u.jsxs)(`div`,{className:`grid gap-5 ${n===`split`?`lg:grid-cols-2`:``}`,children:[n!==`preview`&&(0,u.jsx)(o,{label:`Markdown`,value:e,onChange:t,rows:26}),n!==`edit`&&(0,u.jsxs)(`section`,{"aria-label":`Preview`,className:`flex min-w-0 flex-col gap-2`,children:[(0,u.jsx)(`p`,{className:`text-muted flex min-h-7 items-center text-xs font-semibold tracking-wide uppercase`,children:`Preview`}),(0,u.jsx)(`div`,{className:`card max-h-[42rem] min-h-80 overflow-auto p-5 sm:p-6`,children:(0,u.jsx)(r,{html:h})})]})]})]})}export{p as default};
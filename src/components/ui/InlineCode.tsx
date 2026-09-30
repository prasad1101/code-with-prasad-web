/** Renders `backtick` segments of a plain-text title as <code>, e.g. question titles. */
export function InlineCode({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <code
            key={i}
            className="border-line bg-surface-2 rounded-md border px-1.5 py-0.5 font-mono text-[0.85em]"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  )
}

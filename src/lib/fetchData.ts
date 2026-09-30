import type { z } from 'zod'

export class DataError extends Error {}

/**
 * Fetch a JSON file and validate it; throws DataError with a readable message.
 * The schema is passed as a lazy import so zod loads in parallel with the request
 * instead of sitting in the initial bundle.
 */
export async function fetchJson<S extends z.ZodType>(
  url: string,
  getSchema: () => Promise<S>,
): Promise<z.output<S>> {
  const [res, schema] = await Promise.all([fetch(url), getSchema()])
  if (!res.ok) throw new DataError(`Could not load ${url} (HTTP ${res.status})`)
  const parsed = schema.safeParse(await res.json())
  if (!parsed.success) {
    if (import.meta.env.DEV) console.warn(`Invalid data in ${url}`, parsed.error.issues)
    throw new DataError(`The data in ${url} is not in the expected format`)
  }
  return parsed.data
}

/** Fetch a markdown file as text. */
export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  // Vite's dev server answers unknown paths with index.html; treat that as missing too.
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || type.includes('text/html')) throw new DataError(`Could not load ${url}`)
  return res.text()
}

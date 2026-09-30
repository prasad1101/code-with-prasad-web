import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { IconType } from 'react-icons'
import {
  FiCalendar,
  FiClock,
  FiCode,
  FiColumns,
  FiCpu,
  FiDatabase,
  FiDroplet,
  FiFileText,
  FiHash,
  FiKey,
  FiLink,
  FiLock,
  FiRefreshCw,
  FiRepeat,
  FiSearch,
  FiShield,
  FiType,
  FiWind,
} from 'react-icons/fi'

import { TOOL_META, type ToolMeta } from './meta'

/*
 * Every built-in developer tool: its metadata (./meta.ts) plus icon and component. Each
 * component is its own lazily loaded chunk, so heavy libraries (SQL formatter, YAML, diff …)
 * only download when that tool is opened. Everything runs in the browser — nothing a
 * visitor pastes is sent anywhere.
 */

export { TOOL_CATEGORIES, type ToolCategory } from './meta'

export type Tool = ToolMeta & {
  icon: IconType
  Component: LazyExoticComponent<ComponentType>
}

const EXTRAS: Record<string, Pick<Tool, 'icon' | 'Component'>> = {
  'json-formatter': { icon: FiCode, Component: lazy(() => import('./tools/JsonFormatter')) },
  'data-converter': { icon: FiRepeat, Component: lazy(() => import('./tools/DataConverter')) },
  'sql-formatter': { icon: FiDatabase, Component: lazy(() => import('./tools/SqlFormatter')) },
  'text-diff': { icon: FiColumns, Component: lazy(() => import('./tools/TextDiff')) },
  'markdown-preview': {
    icon: FiFileText,
    Component: lazy(() => import('./tools/MarkdownPreview')),
  },
  'case-converter': { icon: FiType, Component: lazy(() => import('./tools/CaseConverter')) },
  base64: { icon: FiRefreshCw, Component: lazy(() => import('./tools/Base64Tool')) },
  'url-encoder': { icon: FiLink, Component: lazy(() => import('./tools/UrlTool')) },
  'jwt-decoder': { icon: FiKey, Component: lazy(() => import('./tools/JwtDecoder')) },
  'hash-generator': { icon: FiHash, Component: lazy(() => import('./tools/HashGenerator')) },
  'uuid-generator': { icon: FiShield, Component: lazy(() => import('./tools/UuidGenerator')) },
  'password-generator': {
    icon: FiLock,
    Component: lazy(() => import('./tools/PasswordGenerator')),
  },
  'regex-tester': { icon: FiSearch, Component: lazy(() => import('./tools/RegexTester')) },
  'timestamp-converter': {
    icon: FiClock,
    Component: lazy(() => import('./tools/TimestampConverter')),
  },
  'cron-explainer': { icon: FiCalendar, Component: lazy(() => import('./tools/CronExplainer')) },
  'number-base-converter': { icon: FiCpu, Component: lazy(() => import('./tools/NumberBase')) },
  'color-converter': { icon: FiDroplet, Component: lazy(() => import('./tools/ColorConverter')) },
  'dummy-data': { icon: FiWind, Component: lazy(() => import('./tools/DummyData')) },
}

export const TOOLS: Tool[] = TOOL_META.map((m) => ({ ...m, ...EXTRAS[m.slug] }))

export const toolBySlug = (slug: string | undefined) => TOOLS.find((t) => t.slug === slug)

/** Case-insensitive match on title, summary and keywords. */
export const matchesTool = (t: Tool, query: string) => {
  const q = query.trim().toLowerCase()
  return !q || `${t.title} ${t.summary} ${t.keywords}`.toLowerCase().includes(q)
}

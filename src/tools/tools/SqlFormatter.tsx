import { useMemo, useState } from 'react'
import { format, type SqlLanguage } from 'sql-formatter'
import { Input, Note, Select, TextArea, TwoCol } from '../ui'

const SAMPLE = `select c.customer_id, c.name, count(o.order_id) as orders, sum(o.amount) as revenue from customers c left join orders o on o.customer_id = c.customer_id and o.status <> 'cancelled' where c.created_at >= '2026-01-01' group by c.customer_id, c.name having sum(o.amount) > 10000 order by revenue desc limit 10;`

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'transactsql', label: 'SQL Server (T-SQL)' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'redshift', label: 'Redshift' },
  { value: 'spark', label: 'Spark SQL' },
  { value: 'duckdb', label: 'DuckDB' },
  { value: 'trino', label: 'Trino / Presto' },
]

const CASES = [
  { value: 'upper', label: 'UPPERCASE keywords' },
  { value: 'lower', label: 'lowercase keywords' },
  { value: 'preserve', label: 'Keep as typed' },
] as const

export default function SqlFormatter() {
  const [input, setInput] = useState(SAMPLE)
  const [language, setLanguage] = useState<SqlLanguage>('postgresql')
  const [keywordCase, setKeywordCase] = useState<(typeof CASES)[number]['value']>('upper')
  const [tabWidth, setTabWidth] = useState('2')

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      return {
        output: format(input, {
          language,
          keywordCase,
          dataTypeCase: keywordCase,
          functionCase: keywordCase,
          tabWidth: Math.min(8, Math.max(1, Number(tabWidth) || 2)),
          linesBetweenQueries: 2,
        }),
        error: '',
      }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) }
    }
  }, [input, language, keywordCase, tabWidth])

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Dialect" value={language} onChange={setLanguage} options={DIALECTS} />
        <Select
          label="Keyword case"
          value={keywordCase}
          onChange={setKeywordCase}
          options={CASES}
        />
        <Input
          label="Indent width"
          type="number"
          min={1}
          max={8}
          value={tabWidth}
          onChange={setTabWidth}
        />
      </div>
      <TwoCol>
        <TextArea
          label="Input SQL"
          value={input}
          onChange={setInput}
          rows={16}
          invalid={!!result.error}
        />
        <TextArea label="Formatted SQL" value={result.output} readOnly rows={16} />
      </TwoCol>
      {result.error && <Note tone="error">✗ {result.error.split('\n')[0]}</Note>}
    </div>
  )
}

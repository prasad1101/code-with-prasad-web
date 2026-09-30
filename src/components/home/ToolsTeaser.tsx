import { FiArrowRight } from 'react-icons/fi'
import { TOOLS } from '../../tools/registry'
import { ToolCard } from '../tools/ToolCards'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'

const FEATURED = [
  'json-formatter',
  'jwt-decoder',
  'regex-tester',
  'timestamp-converter',
  'sql-formatter',
  'cron-explainer',
]

export function ToolsTeaser() {
  const tools = FEATURED.flatMap((slug) => TOOLS.filter((t) => t.slug === slug))
  return (
    <Section
      id="tools"
      eyebrow="Developer tools"
      title="Handy tools for everyday dev work"
      intro={`${TOOLS.length} free tools that run right in your browser — nothing you paste leaves your device — plus a curated directory of the apps developers rely on.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t, i) => (
          <Reveal key={t.slug} delay={i * 0.04}>
            <ToolCard tool={t} />
          </Reveal>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button to="/tools" variant="secondary">
          All {TOOLS.length} tools{' '}
          <FiArrowRight
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Button>
        <Button to={{ pathname: '/tools', search: '?tab=directory' }} variant="ghost">
          Browse the toolkit directory
        </Button>
      </div>
    </Section>
  )
}

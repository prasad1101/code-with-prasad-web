import { m } from 'framer-motion'
import type { Site } from '../../lib/schemas'
import { TechIcon } from '../ui/TechIcon'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'

export function Skills({ skills }: { skills: Site['skills'] }) {
  if (!skills.length) return null
  return (
    <Section id="skills" eyebrow="Skills" title="Tools I work with every day">
      <div className="grid gap-6 md:grid-cols-2">
        {skills.map((group, gi) => (
          <Reveal key={group.category} delay={gi * 0.05}>
            <div className="card h-full p-6">
              <h3 className="mb-5 text-lg font-semibold">{group.category}</h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {group.items.map((item) => {
                  return (
                    <m.li
                      key={item.name}
                      whileHover={{ y: -3 }}
                      className="group border-line bg-surface-2/50 hover:border-accent/50 relative rounded-xl border p-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <TechIcon
                          icon={item.icon}
                          name={item.name}
                          className="text-muted group-hover:text-accent-2 size-5 shrink-0 transition-colors"
                        />
                        <span className="truncate text-sm font-medium">{item.name}</span>
                      </div>
                      {item.level !== undefined && (
                        <div
                          className="bg-line mt-2.5 h-1 overflow-hidden rounded-full"
                          role="meter"
                          aria-label={`${item.name} proficiency`}
                          aria-valuenow={item.level}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <m.div
                            className="bg-gradient-accent h-full rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.level}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      )}
                    </m.li>
                  )
                })}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

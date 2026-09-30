import { m, useScroll, useSpring } from 'framer-motion'

export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 })
  return (
    <m.div
      aria-hidden="true"
      className="bg-gradient-accent fixed inset-x-0 top-0 z-[60] h-[3px] origin-left"
      style={{ scaleX }}
    />
  )
}

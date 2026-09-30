/** Primary navigation. `section` items scroll on the home page; `route` items are pages. */
export type NavItem = { label: string } & ({ section: string } | { route: string })

export const NAV_ITEMS: NavItem[] = [
  { label: 'About', section: 'about' },
  { label: 'Skills', section: 'skills' },
  { label: 'Experience', section: 'experience' },
  { label: 'Work', section: 'work' },
  { label: 'Blog', route: '/blog' },
  { label: 'Tutorials', route: '/tutorials' },
  { label: 'Contact', section: 'contact' },
]

export const HOME_SECTIONS = NAV_ITEMS.flatMap((i) => ('section' in i ? [i.section] : []))

export const sectionHref = (id: string) => ({ pathname: '/', search: `?section=${id}` })

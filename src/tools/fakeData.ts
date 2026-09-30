import { randomInt } from './logic'

/*
 * Realistic-looking dummy records for mocks, fixtures and seed scripts.
 * Everything is random — none of these people, emails or phone numbers are real.
 */

const FIRST =
  'Aarav Aditi Ananya Arjun Diya Ishaan Kavya Krishna Meera Neha Pooja Priya Rahul Riya Rohan Saanvi Sneha Tanvi Vihaan Vivaan Emma Liam Olivia Noah Sophia James Mia Lucas Amelia Ethan Chloe Daniel Hannah Leo Sara Omar Yuki Mateo Zara Lena'.split(
    ' ',
  )
const LAST =
  'Sharma Patel Iyer Reddy Nair Kulkarni Deshpande Joshi Gupta Mehta Rao Menon Kapoor Singh Das Smith Johnson Brown Garcia Miller Wilson Lopez Martin Clark Lewis Walker Young Allen King Tanaka Rossi Müller Silva'.split(
    ' ',
  )
const CITIES = [
  ['Pune', 'India'],
  ['Mumbai', 'India'],
  ['Bengaluru', 'India'],
  ['Hyderabad', 'India'],
  ['Chennai', 'India'],
  ['Delhi', 'India'],
  ['London', 'United Kingdom'],
  ['Berlin', 'Germany'],
  ['New York', 'United States'],
  ['Austin', 'United States'],
  ['Toronto', 'Canada'],
  ['Singapore', 'Singapore'],
  ['Sydney', 'Australia'],
  ['Dubai', 'United Arab Emirates'],
  ['Tokyo', 'Japan'],
] as const
const COMPANIES =
  'Acme Corp,Globex,Initech,Umbrella Labs,Stark Digital,Wayne Systems,Hooli,Pied Piper,Soylent Tech,Cyberdyne,Vandelay Industries,Nimbus Cloud,BluePeak Analytics,Orbit Retail'.split(
    ',',
  )
const TITLES =
  'Software Engineer,Senior Developer,Tech Lead,Data Analyst,Data Engineer,Product Manager,QA Engineer,DevOps Engineer,UX Designer,Engineering Manager,Solutions Architect,Scrum Master'.split(
    ',',
  )
const PRODUCTS =
  'Wireless Mouse,Mechanical Keyboard,USB-C Hub,27" Monitor,Laptop Stand,Noise-Cancelling Headphones,Webcam,Desk Lamp,Ergonomic Chair,External SSD,Smart Watch,Bluetooth Speaker'.split(
    ',',
  )
const STATUSES = ['active', 'inactive', 'pending', 'suspended'] as const
const ORDER_STATUSES = ['placed', 'paid', 'shipped', 'delivered', 'cancelled'] as const
const STREETS =
  'MG Road,Baker Street,Park Avenue,FC Road,Linking Road,Main Street,Church Street,Station Road,High Street,Lake View Road'.split(
    ',',
  )

const pick = <T>(xs: readonly T[]) => xs[randomInt(xs.length)]
const between = (lo: number, hi: number) => lo + randomInt(hi - lo + 1)
const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

function randomDate(fromYear: number, toYear: number) {
  const from = Date.UTC(fromYear, 0, 1)
  const to = Date.UTC(toYear, 11, 31)
  return new Date(from + randomInt(Math.floor((to - from) / 86400000)) * 86400000)
}

type Ctx = { index: number; first: string; last: string; city: (typeof CITIES)[number] }

export const FIELDS = {
  id: { label: 'id (1, 2, 3…)', gen: (c: Ctx) => c.index + 1 },
  uuid: { label: 'uuid', gen: () => crypto.randomUUID() },
  firstName: { label: 'firstName', gen: (c: Ctx) => c.first },
  lastName: { label: 'lastName', gen: (c: Ctx) => c.last },
  fullName: { label: 'fullName', gen: (c: Ctx) => `${c.first} ${c.last}` },
  username: {
    label: 'username',
    gen: (c: Ctx) => `${slug(c.first)}_${slug(c.last)}${between(1, 99)}`,
  },
  email: {
    label: 'email',
    // example.com/.org/.net are reserved for documentation, so these never reach a real inbox.
    gen: (c: Ctx) =>
      `${slug(c.first)}.${slug(c.last)}${between(1, 99)}@${pick(['example.com', 'example.org', 'example.net'])}`,
  },
  phone: { label: 'phone', gen: () => `+91 ${between(70000, 99999)} ${between(10000, 99999)}` },
  age: { label: 'age', gen: () => between(18, 65) },
  gender: { label: 'gender', gen: () => pick(['female', 'male', 'non-binary']) },
  street: { label: 'street', gen: () => `${between(1, 250)} ${pick(STREETS)}` },
  city: { label: 'city', gen: (c: Ctx) => c.city[0] },
  country: { label: 'country', gen: (c: Ctx) => c.city[1] },
  company: { label: 'company', gen: () => pick(COMPANIES) },
  jobTitle: { label: 'jobTitle', gen: () => pick(TITLES) },
  salary: { label: 'salary', gen: () => between(30, 400) * 10000 },
  product: { label: 'product', gen: () => pick(PRODUCTS) },
  price: { label: 'price', gen: () => between(19900, 9999900) / 100 },
  quantity: { label: 'quantity', gen: () => between(1, 10) },
  orderStatus: { label: 'orderStatus', gen: () => pick(ORDER_STATUSES) },
  status: { label: 'status', gen: () => pick(STATUSES) },
  isActive: { label: 'isActive (boolean)', gen: () => randomInt(2) === 1 },
  rating: { label: 'rating (1–5)', gen: () => between(10, 50) / 10 },
  birthDate: { label: 'birthDate', gen: () => randomDate(1960, 2006).toISOString().slice(0, 10) },
  createdAt: {
    label: 'createdAt (ISO)',
    gen: () => new Date(randomDate(2022, 2026).getTime() + randomInt(86400000)).toISOString(),
  },
  website: { label: 'website', gen: (c: Ctx) => `https://${slug(c.last)}.example.com` },
  avatar: { label: 'avatar URL', gen: (c: Ctx) => `https://i.pravatar.cc/150?u=${c.index + 1}` },
  ipv4: {
    label: 'ipv4',
    gen: () => `${between(11, 223)}.${randomInt(256)}.${randomInt(256)}.${between(1, 254)}`,
  },
  hexColor: {
    label: 'hexColor',
    gen: () => `#${randomInt(0x1000000).toString(16).padStart(6, '0')}`,
  },
} as const

export type FieldKey = keyof typeof FIELDS
export type FakeRow = Record<string, string | number | boolean>

export const PRESETS: { label: string; fields: FieldKey[] }[] = [
  {
    label: 'Users',
    fields: ['id', 'fullName', 'email', 'phone', 'age', 'city', 'country', 'isActive', 'createdAt'],
  },
  {
    label: 'Employees',
    fields: ['id', 'firstName', 'lastName', 'email', 'company', 'jobTitle', 'salary', 'city'],
  },
  {
    label: 'Orders',
    fields: ['uuid', 'fullName', 'product', 'quantity', 'price', 'orderStatus', 'createdAt'],
  },
  { label: 'Products', fields: ['id', 'product', 'price', 'rating', 'quantity', 'status'] },
]

export function fakeRows(fields: FieldKey[], count: number): FakeRow[] {
  return Array.from({ length: count }, (_, index) => {
    const ctx: Ctx = { index, first: pick(FIRST), last: pick(LAST), city: pick(CITIES) }
    return Object.fromEntries(fields.map((f) => [f, FIELDS[f].gen(ctx)]))
  })
}

const sqlValue = (v: string | number | boolean) =>
  typeof v === 'number'
    ? String(v)
    : typeof v === 'boolean'
      ? v
        ? 'TRUE'
        : 'FALSE'
      : `'${v.replace(/'/g, "''")}'`

export function toSqlInsert(rows: FakeRow[], table: string) {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const values = rows.map((r) => `  (${cols.map((c) => sqlValue(r[c])).join(', ')})`).join(',\n')
  return `INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${values};`
}

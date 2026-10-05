export const pad = (n: number) => String(n).padStart(2, '0')

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayKey = () => toKey(new Date())

export const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const addDaysKey = (key: string, n: number) => toKey(addDays(fromKey(key), n))

export const diffDays = (a: string, b: string) =>
  Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / 86_400_000)

/** Monday-based start of week */
export const startOfWeek = (d: Date) => {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = (r.getDay() + 6) % 7
  return addDays(r, -day)
}

export const weekDays = (anchor: Date) => {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const nowMinutes = () => {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

export const fmtTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const dayShort = (d: Date) => DAY_SHORT[d.getDay()]
export const dayLong = (d: Date) => DAY_LONG[d.getDay()]
export const monthName = (d: Date) => MONTHS[d.getMonth()]
export const monthShort = (d: Date) => MONTHS_SHORT[d.getMonth()]

/** "10 de octubre" */
export const fmtDayMonth = (key: string) => {
  const d = fromKey(key)
  return `${d.getDate()} de ${monthName(d)}`
}

/** "02 Oct" */
export const fmtShort = (key: string) => {
  const d = fromKey(key)
  return `${pad(d.getDate())} ${monthShort(d)}`
}

/** "Jueves 10 de octubre" */
export const fmtLong = (key: string) => {
  const d = fromKey(key)
  return `${dayLong(d)} ${d.getDate()} de ${monthName(d)}`
}

/** Hoy / Mañana / Ayer / fmtLong */
export const fmtRelative = (key: string) => {
  const diff = diffDays(key, todayKey())
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  return fmtLong(key)
}

export const fmtAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'ahora'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  const d = Math.floor(s / 86400)
  return d === 1 ? 'ayer' : `hace ${d} días`
}

export const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export const monthGrid = (anchor: Date) => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

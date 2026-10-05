const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

export const money = (n: number) => (n === 0 ? 'Gratis' : mxn.format(n).replace('MX', ''))
export const moneyPlain = (n: number) => mxn.format(n).replace('MX', '')

export const duration = (min: number) => {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export const initials = (name: string) =>
  name
    .replace(/^(Dra?\.|Lic\.|Mtro\.)\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

export const firstName = (name: string) => name.replace(/^(Dra?\.|Lic\.|Mtro\.)\s*/, '').split(' ')[0]

export const uid = () => Math.random().toString(36).slice(2, 10)

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`

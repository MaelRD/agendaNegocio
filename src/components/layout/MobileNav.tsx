import { motion } from 'framer-motion'
import { ExternalLink, LogOut, MoreHorizontal, Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cx } from '../../lib/format'
import { useStore } from '../../store/AppStore'
import { useUI } from '../../store/ui'
import { Sheet } from '../ui/Sheet'
import { navItems } from './nav'

export function MobileNav() {
  const { template, data } = useStore()
  const { openNew } = useUI()
  const { pathname } = useLocation()
  const [more, setMore] = useState(false)
  const items = navItems(template.terms)
  const primary = [items[0], items[1], items[2], items[3]]
  const rest = items.slice(4)
  const moreActive = rest.some((i) => pathname.startsWith(i.to)) || pathname.startsWith('/demo/settings')

  const Tab = ({ to, label, icon: Icon }: (typeof items)[number]) => {
    const active = pathname.startsWith(to)
    return (
      <NavLink to={to} className="relative flex flex-1 flex-col items-center gap-1 pb-1 pt-2">
        {active && (
          <motion.span layoutId="mob-active" className="absolute top-0 h-[3px] w-6 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
        )}
        <Icon size={21} strokeWidth={active ? 2.1 : 1.7} className={active ? 'text-ink' : 'text-ink-3'} />
        <span className={cx('text-2xs font-medium', active ? 'text-ink' : 'text-ink-3')}>{label}</span>
      </NavLink>
    )
  }

  return (
    <>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 bg-surface/90 shadow-[0_-1px_0_var(--line)] backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-stretch px-2">
          <Tab {...primary[0]} />
          <Tab {...primary[1]} />
          <div className="flex flex-1 items-center justify-center">
            <button
              onClick={() => openNew()}
              aria-label={`Nueva ${template.terms.appointment}`}
              className="grid size-12 -translate-y-3 place-items-center rounded-2xl bg-accent text-accent-fg shadow-[0_10px_24px_-8px_var(--accent)] transition active:scale-95"
            >
              <Plus size={22} />
            </button>
          </div>
          <Tab {...primary[2]} />
          <button onClick={() => setMore(true)} className="relative flex flex-1 flex-col items-center gap-1 pb-1 pt-2">
            {moreActive && <span className="absolute top-0 h-[3px] w-6 rounded-full bg-accent" />}
            <MoreHorizontal size={21} className={moreActive ? 'text-ink' : 'text-ink-3'} />
            <span className={cx('text-2xs font-medium', moreActive ? 'text-ink' : 'text-ink-3')}>Más</span>
          </button>
        </div>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="Más opciones">
        <div className="grid grid-cols-2 gap-3">
          {[primary[3], ...rest, { to: '/demo/settings', label: 'Ajustes', icon: Settings }].map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMore(false)}
              className={cx(
                'flex flex-col gap-3 rounded-3xl p-4 transition active:scale-[0.98]',
                pathname.startsWith(to) ? 'bg-accent-soft text-accent-ink' : 'bg-surface-2 text-ink',
              )}
            >
              <Icon size={22} strokeWidth={1.8} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <Link
            to={`/book/${data.businessId}`}
            onClick={() => setMore(false)}
            className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium text-ink hover:bg-surface-2"
          >
            Ver página pública de reservas <ExternalLink size={16} className="text-ink-3" />
          </Link>
          <Link to="/" className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-medium text-bad hover:bg-bad-soft">
            Salir de la demo <LogOut size={16} />
          </Link>
        </div>
      </Sheet>
    </>
  )
}

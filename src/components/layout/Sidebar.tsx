import { motion } from 'framer-motion'
import { LogOut, Settings } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../../store/AppStore'
import { cx } from '../../lib/format'
import { Tooltip } from '../ui/primitives'
import { navItems, type NavItem } from './nav'
import { LogoMark } from './LogoMark'

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Tooltip label={item.label}>
      <NavLink
        to={item.to}
        aria-label={item.label}
        className={cx(
          'relative grid size-11 place-items-center rounded-2xl transition-colors duration-150',
          active ? 'text-accent-fg' : 'text-ink-3 hover:bg-surface-2 hover:text-ink',
        )}
      >
        {active && (
          <motion.span
            layoutId="side-active"
            className="absolute inset-0 rounded-2xl bg-accent shadow-[0_8px_20px_-8px_var(--accent)]"
            transition={{ type: 'spring', stiffness: 520, damping: 40 }}
          />
        )}
        <Icon size={20} strokeWidth={active ? 2.1 : 1.8} className="relative" />
      </NavLink>
    </Tooltip>
  )
}

export function Sidebar() {
  const { template } = useStore()
  const { pathname } = useLocation()
  const items = navItems(template.terms)

  return (
    <aside className="sticky top-0 z-30 hidden h-dvh w-[76px] shrink-0 flex-col items-center py-5 md:flex lg:w-[88px]">
      <Link to="/" aria-label="Inicio del portafolio" className="mb-8">
        <LogoMark />
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-2 rounded-[26px] bg-surface p-2 shadow-soft">
        {items.map((item) => (
          <SideLink key={item.to} item={item} active={pathname.startsWith(item.to)} />
        ))}
        <div className="flex-1" />
        <span className="my-1 h-px w-6 bg-line" />
        <SideLink item={{ to: '/demo/settings', label: 'Ajustes', icon: Settings }} active={pathname.startsWith('/demo/settings')} />
        <Tooltip label="Salir de la demo">
          <Link
            to="/"
            aria-label="Salir de la demo"
            className="grid size-11 place-items-center rounded-2xl text-ink-3 transition-colors hover:bg-bad-soft hover:text-bad"
          >
            <LogOut size={19} strokeWidth={1.8} />
          </Link>
        </Tooltip>
      </nav>
    </aside>
  )
}

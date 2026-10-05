import {
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  Palette,
  Sparkles,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { cap } from '../../lib/format'
import type { Terms } from '../../lib/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const navItems = (t: Terms): NavItem[] => [
  { to: '/demo/dashboard', label: 'Inicio', icon: LayoutGrid },
  { to: '/demo/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/demo/appointments', label: cap(t.appointments), icon: ClipboardList },
  { to: '/demo/customers', label: cap(t.clients), icon: Users },
  { to: '/demo/services', label: 'Servicios', icon: Sparkles },
  { to: '/demo/automations', label: 'Automatizaciones', icon: Workflow },
  { to: '/demo/customize', label: 'Personalizar', icon: Palette },
]

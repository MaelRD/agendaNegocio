import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogoMark } from '../components/layout/LogoMark'
import { BUSINESS_LIST } from '../data/businesses'

export default function BookIndex() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 py-8 md:py-14">
      <Link to="/" className="flex items-center gap-3 self-start">
        <LogoMark size={36} />
        <span className="text-sm font-medium text-ink-2">Agenda · demo</span>
      </Link>
      <h1 className="mt-10 text-[34px] font-semibold leading-tight tracking-tight md:text-5xl">
        Reserva en <span className="font-serif font-normal italic text-accent-ink">segundos</span>
      </h1>
      <p className="mt-3 max-w-xl text-ink-2">
        Así ven tus clientes tu página de reservas. Elige un negocio de ejemplo: cada uno tiene sus propios servicios, equipo y horarios.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {BUSINESS_LIST.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link
              to={`/book/${b.id}`}
              className="group flex items-center gap-4 rounded-[28px] bg-surface p-5 shadow-soft transition hover:shadow-float"
            >
              <span className="grid size-14 place-items-center rounded-2xl text-2xl" style={{ background: `oklch(0.95 0.04 ${b.hue})` }}>
                {b.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{b.name}</span>
                <span className="block text-sm text-ink-3">{b.kind}</span>
              </span>
              <ArrowRight size={18} className="text-ink-3 transition group-hover:translate-x-1 group-hover:text-ink" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

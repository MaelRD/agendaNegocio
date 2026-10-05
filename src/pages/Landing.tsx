import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Globe, MessageCircle, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/layout/LogoMark'
import { ThemeButton } from '../components/layout/Header'
import { PhonePreview } from '../components/whatsapp/PhonePreview'
import { BUSINESS_LIST } from '../data/businesses'
import { addDaysKey, todayKey } from '../lib/date'
import { buildMessage } from '../lib/messages'
import { useStore } from '../store/AppStore'

const FEATURES = [
  { icon: CalendarDays, title: 'Agenda del equipo', body: 'Calendario semanal por profesional, con disponibilidad real y cero empalmes.' },
  { icon: Globe, title: 'Reservas en línea', body: 'Un link propio para que tus clientes agenden solos, 24/7, desde Instagram o Google.' },
  { icon: MessageCircle, title: 'WhatsApp automático', body: 'Confirmaciones y recordatorios que reducen las ausencias sin escribir un mensaje.' },
  { icon: Users, title: 'Mini CRM', body: 'Historial, notas y gasto de cada cliente, armado solo con cada visita.' },
]

export default function Landing() {
  const { data, switchBusiness } = useStore()
  const navigate = useNavigate()
  const sample = buildMessage('confirmation', data, {
    customer: 'Andrea Hernández',
    service: data.services[0].name,
    staff: data.staff[0].name,
    date: addDaysKey(todayKey(), 3),
    start: 10 * 60,
  })

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-70"
        style={{ background: 'radial-gradient(60% 60% at 70% 10%, var(--accent-soft) 0%, transparent 70%)' }}
      />
      <header className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 md:px-8">
        <LogoMark size={36} />
        <span className="font-semibold">Agenda</span>
        <span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-medium text-ink-3 shadow-soft">demo</span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeButton />
          <Link to="/book" className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink sm:block">
            Reservar como cliente
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-8 md:px-8 md:pt-16 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-accent-ink">
            Software a medida para negocios con citas
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-4xl font-semibold md:text-6xl"
          >
            Tu agenda, tus reglas,
            <br />
            <span className="serif-accent text-accent-ink">tu forma de trabajar.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 md:text-lg">
            Esta demo muestra un sistema de agenda, reservas en línea y recordatorios por WhatsApp. El mismo núcleo se adapta a una clínica dental, un
            estudio de tatuajes o una barbería. Pruébalo: todo es interactivo.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/demo/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-md font-medium text-accent-fg shadow-[0_10px_24px_-10px_var(--accent)] transition hover:brightness-110 active:scale-[0.98]"
            >
              Abrir el panel <ArrowRight size={17} />
            </Link>
            <Link
              to={`/book/${data.businessId}`}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-surface px-6 text-md font-medium text-ink shadow-soft transition hover:bg-surface-2 active:scale-[0.98]"
            >
              Reservar como cliente
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-12">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-3">Míralo adaptado a</p>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_LIST.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    switchBusiness(b.id)
                    navigate('/demo/dashboard')
                  }}
                  className="flex items-center gap-2 rounded-full bg-surface py-2 pl-2.5 pr-4 text-sm font-medium shadow-soft transition hover:-translate-y-0.5 hover:shadow-float"
                >
                  <span>{b.emoji}</span> {b.kind}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 24, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 18 }} className="hidden lg:block">
          <PhonePreview
            title={data.settings.name}
            subtitle="cuenta de empresa"
            messages={[
              { id: '1', from: 'business', text: sample, time: '09:12', label: 'Confirmación automática' },
              { id: '2', from: 'client', text: '¡Perfecto, gracias! 🙌', time: '09:13' },
            ]}
          />
        </motion.div>
      </main>

      <section className="relative mx-auto max-w-6xl px-4 pb-24 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-[28px] bg-surface p-6 shadow-soft"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
                <f.icon size={20} />
              </span>
              <p className="mt-5 font-semibold">{f.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{f.body}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-ink-3">Demo con datos simulados · se guarda en tu navegador · sin backend</p>
      </section>
    </div>
  )
}

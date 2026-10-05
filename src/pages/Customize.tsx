import { AnimatePresence, motion } from 'framer-motion'
import { Check, Moon, Sun } from 'lucide-react'
import { BUSINESS_LIST, HUES } from '../data/businesses'
import { Avatar, Card, Field, Input } from '../components/ui/primitives'
import { cap, cx, duration, money } from '../lib/format'
import { useStore } from '../store/AppStore'

export default function Customize() {
  const { data, template, switchBusiness, updateSettings, theme, toggleTheme, toast } = useStore()
  const t = template.terms

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="max-w-2xl pt-2">
        <h1 className="text-4xl font-semibold md:text-5xl">
          Un sistema, <span className="serif-accent text-accent-ink">tu forma de trabajar</span>
        </h1>
        <p className="mt-3 text-md leading-relaxed text-ink-2 md:text-base">
          Elige un tipo de negocio y mira cómo se adaptan el vocabulario, los servicios, el equipo, los mensajes de WhatsApp y los colores. Así arranca
          cada proyecto a medida: con tu operación real, no con una plantilla.
        </p>
      </div>

      <section>
        <h2 className="mb-3 px-1 text-ui font-semibold uppercase tracking-wider text-ink-3">Tipo de negocio</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {BUSINESS_LIST.map((b) => {
            const active = b.id === data.businessId
            return (
              <motion.button
                key={b.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (active) return
                  switchBusiness(b.id)
                  toast({ title: `Ahora eres ${b.name}`, body: b.kind, tone: 'info' })
                }}
                className={cx(
                  'relative flex flex-col items-start gap-3 rounded-[24px] p-4 text-left transition',
                  active ? 'bg-surface shadow-float ring-2 ring-accent' : 'bg-surface-2 hover:bg-surface-3',
                )}
              >
                <span className="text-2xl">{b.emoji}</span>
                <span>
                  <span className="block text-sm font-semibold">{b.kind}</span>
                  <span className="block text-xs text-ink-3">{b.name}</span>
                </span>
                <AnimatePresence>
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-accent text-accent-fg"
                    >
                      <Check size={14} strokeWidth={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="flex flex-col gap-6 p-6">
          <h2 className="text-md font-semibold">Identidad</h2>
          <Field label="Nombre del negocio">
            <Input value={data.settings.name} onChange={(e) => updateSettings({ name: e.target.value })} />
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-ui font-medium text-ink-2">Color de acento</span>
            <div className="flex flex-wrap gap-3">
              {HUES.map((h) => (
                <button
                  key={h.hue}
                  onClick={() => updateSettings({ hue: h.hue })}
                  aria-label={h.name}
                  title={h.name}
                  className={cx('size-10 rounded-full transition', data.settings.hue === h.hue && 'ring-2 ring-offset-2 ring-offset-surface')}
                  style={{ background: `oklch(0.6 0.16 ${h.hue})`, ['--tw-ring-color' as string]: `oklch(0.6 0.16 ${h.hue})` }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-ui font-medium text-ink-2">Apariencia</span>
            <div className="grid grid-cols-2 gap-3">
              {(['light', 'dark'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => theme !== m && toggleTheme()}
                  className={cx('flex items-center gap-3 rounded-2xl p-3 text-sm font-medium transition', theme === m ? 'bg-accent-soft text-accent-ink ring-1 ring-accent/40' : 'bg-surface-2 text-ink-2')}
                >
                  {m === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                  {m === 'light' ? 'Claro' : 'Oscuro'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-semibold">Lo que cambió</h2>
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-2">{template.kind}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={data.businessId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Agendas', cap(t.appointments)],
                  ['Atiendes', cap(t.clients)],
                  ['Equipo', cap(t.staffPlural)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-surface-2 px-2 py-3">
                    <p className="text-2xs text-ink-3">{k}</p>
                    <p className="truncate text-sm font-semibold text-accent-ink">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-ink-3">Equipo</p>
                <div className="flex flex-wrap gap-2">
                  {data.staff.map((p) => (
                    <span key={p.id} className="flex items-center gap-2 rounded-full bg-surface-2 py-1 pl-1 pr-3 text-ui">
                      <Avatar name={p.name} tone={p.tone} size={24} />
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-ink-3">Servicios</p>
                <div className="flex flex-col divide-y divide-line">
                  {data.services.slice(0, 4).map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                      <span className={`tone-${s.tone} flex items-center gap-2`}>
                        <span className="size-2 rounded-full" style={{ background: 'var(--tone-bar)' }} />
                        {s.name}
                      </span>
                      <span className="text-ink-3">
                        {duration(s.duration)} · {money(s.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="rounded-2xl bg-accent-soft px-4 py-3 text-ui text-accent-ink">
                <b className="font-semibold">Recordatorio:</b> “{template.reminderTip}”
              </p>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}

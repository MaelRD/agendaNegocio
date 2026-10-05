import { motion } from 'framer-motion'
import { Clock, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Field, Input, Toggle } from '../components/ui/primitives'
import { Sheet } from '../components/ui/Sheet'
import { addDaysKey, todayKey } from '../lib/date'
import { cx, duration, money, uid } from '../lib/format'
import type { Service, Tone } from '../lib/types'
import { useStore } from '../store/AppStore'

export default function Services() {
  const { data, saveService, toast } = useStore()
  const [editing, setEditing] = useState<Service | null>(null)

  const usage = useMemo(() => {
    const from = addDaysKey(todayKey(), -30)
    const m = new Map<string, number>()
    for (const a of data.appointments) if (a.date >= from && a.status !== 'cancelled') m.set(a.serviceId, (m.get(a.serviceId) ?? 0) + 1)
    return m
  }, [data.appointments])

  const categories = [...new Set(data.services.map((s) => s.category))]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Servicios</h1>
          <p className="text-[15px] text-ink-3">Lo que tus clientes pueden reservar. Los inactivos no aparecen en tu página pública.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setEditing({ id: `s${uid()}`, name: '', duration: 60, price: 500, category: categories[0] ?? 'General', active: true, tone: 1 })}
          className="self-start"
        >
          <Plus size={16} /> Nuevo servicio
        </Button>
      </div>

      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="mb-3 px-1 text-[13px] font-semibold uppercase tracking-wider text-ink-3">{cat}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.services
              .filter((s) => s.category === cat)
              .map((s, i) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: s.active ? 1 : 0.6, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`tone-${s.tone} group relative flex flex-col rounded-[28px] bg-surface p-5 shadow-soft`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl text-lg font-semibold" style={{ background: 'var(--tone-bg)', color: 'var(--tone-ink)' }}>
                      {s.name.charAt(0)}
                    </span>
                    <Toggle
                      on={s.active}
                      label={`Activar ${s.name}`}
                      onChange={() => {
                        saveService({ ...s, active: !s.active })
                        toast({ title: s.active ? 'Servicio desactivado' : 'Servicio activado', body: s.name, tone: 'info' })
                      }}
                    />
                  </div>
                  <p className="mt-4 font-semibold">{s.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-[13px] text-ink-3">
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {duration(s.duration)}
                    </span>
                    <span>·</span>
                    <span>{usage.get(s.id) ?? 0} reservas / mes</span>
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <p className="text-2xl font-semibold tabular-nums tracking-tight">{money(s.price)}</p>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(s)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100">
                      <Pencil size={14} /> Editar
                    </Button>
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
      ))}

      <ServiceEditor
        service={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSave={(s) => {
          const isNew = !data.services.some((x) => x.id === s.id)
          saveService(s)
          toast({ title: isNew ? 'Servicio creado' : 'Cambios guardados', body: s.name, tone: 'ok' })
          setEditing(null)
        }}
      />
    </div>
  )
}

function ServiceEditor({
  service,
  categories,
  onClose,
  onSave,
}: {
  service: Service | null
  categories: string[]
  onClose: () => void
  onSave: (s: Service) => void
}) {
  const [draft, setDraft] = useState<Service | null>(service)
  if (service && draft?.id !== service.id) setDraft(service)
  const d = draft ?? service
  const set = (patch: Partial<Service>) => d && setDraft({ ...d, ...patch })

  return (
    <Sheet
      open={!!service}
      onClose={onClose}
      title={service?.name ? 'Editar servicio' : 'Nuevo servicio'}
      width={460}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" disabled={!d?.name.trim()} onClick={() => d && onSave({ ...d, name: d.name.trim() })}>
            Guardar
          </Button>
        </div>
      }
    >
      {d && (
        <div className="flex flex-col gap-5">
          <Field label="Nombre">
            <Input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej. Manicure ruso" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duración (min)">
              <Input type="number" min={15} step={15} value={d.duration} onChange={(e) => set({ duration: Math.max(15, Number(e.target.value) || 15) })} />
            </Field>
            <Field label="Precio (MXN)">
              <Input type="number" min={0} step={50} value={d.price} onChange={(e) => set({ price: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
          </div>
          <Field label="Categoría">
            <Input list="cats" value={d.category} onChange={(e) => set({ category: e.target.value })} />
            <datalist id="cats">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-ink-2">Color en el calendario</span>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as Tone[]).map((tone) => (
                <button
                  key={tone}
                  onClick={() => set({ tone })}
                  aria-label={`Color ${tone}`}
                  className={cx(`tone-${tone} size-10 rounded-full transition`, d.tone === tone && 'ring-2 ring-accent ring-offset-2 ring-offset-surface')}
                  style={{ background: 'var(--tone-bar)' }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Disponible para reservar</p>
              <p className="text-xs text-ink-3">Visible en tu página pública</p>
            </div>
            <Toggle on={d.active} onChange={() => set({ active: !d.active })} label="Activo" />
          </div>
        </div>
      )}
    </Sheet>
  )
}

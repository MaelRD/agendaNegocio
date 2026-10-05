import { Code2, Database, RotateCcw, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Field, Input, Select } from '../components/ui/primitives'
import { pad } from '../lib/date'
import { useStore } from '../store/AppStore'

export default function Settings() {
  const { data, updateSettings, resetDemo, toast } = useStore()
  const [confirm, setConfirm] = useState(false)
  const hours = Array.from({ length: 15 }, (_, i) => i + 7)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="pt-2">
        <h1 className="text-[28px] font-semibold tracking-tight">Ajustes</h1>
        <p className="text-[15px] text-ink-3">Horario, contacto y datos de la demo.</p>
      </div>

      <Card className="flex flex-col gap-5 p-6">
        <h2 className="text-[15px] font-semibold">Horario de atención</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Abre">
            <Select value={data.settings.openHour} onChange={(e) => updateSettings({ openHour: Math.min(Number(e.target.value), data.settings.closeHour - 1) })}>
              {hours.map((h) => (
                <option key={h} value={h}>
                  {pad(h)}:00
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cierra">
            <Select value={data.settings.closeHour} onChange={(e) => updateSettings({ closeHour: Math.max(Number(e.target.value), data.settings.openHour + 1) })}>
              {hours.map((h) => (
                <option key={h} value={h}>
                  {pad(h)}:00
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="WhatsApp del negocio" hint="Número desde el que salen los mensajes automáticos.">
          <Input value={data.settings.phone} onChange={(e) => updateSettings({ phone: e.target.value })} inputMode="tel" />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <h2 className="text-[15px] font-semibold">Sobre esta demo</h2>
        {[
          [Database, 'Datos simulados', 'Todo se guarda en tu navegador (localStorage). Nada sale de tu equipo.'],
          [Smartphone, 'WhatsApp simulado', 'En un proyecto real se conecta a la API oficial de WhatsApp Business.'],
          [Code2, 'Hecho a medida', 'React, TypeScript, Tailwind y Framer Motion. Se adapta a cómo trabaja cada negocio.'],
        ].map(([Icon, title, body]) => {
          const I = Icon as typeof Database
          return (
            <div key={title as string} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-surface-2 text-ink-2">
                <I size={18} />
              </span>
              <div>
                <p className="text-sm font-medium">{title as string}</p>
                <p className="text-[13px] text-ink-3">{body as string}</p>
              </div>
            </div>
          )
        })}
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2 p-4">
          <p className="flex-1 text-sm text-ink-2">Restablece {data.settings.name} a sus datos de ejemplo.</p>
          {confirm ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                No
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  resetDemo()
                  setConfirm(false)
                  toast({ title: 'Demo restablecida', tone: 'info' })
                }}
              >
                Sí, restablecer
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirm(true)}>
              <RotateCcw size={14} /> Restablecer datos
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

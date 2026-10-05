import type { BusinessId, Service, Staff, Terms, Tone } from '../lib/types'

export interface BusinessTemplate {
  id: BusinessId
  kind: string
  name: string
  tagline: string
  hue: number
  emoji: string
  terms: Terms
  staff: Staff[]
  services: Service[]
  /** Average extra minutes left between appointments (lower = busier). */
  gap: number
  /** How a reminder ends — small touch that shows the copy adapts too. */
  reminderTip: string
}

const s = (
  id: string,
  name: string,
  duration: number,
  price: number,
  category: string,
  tone: Tone,
  active = true,
): Service => ({ id, name, duration, price, category, tone, active })

const p = (id: string, name: string, role: string, tone: Tone): Staff => ({ id, name, role, tone })

const T = (
  appointment: string,
  appointments: string,
  client: string,
  clients: string,
  staff: string,
  staffPlural: string,
): Terms => ({ appointment, appointments, client, clients, staff, staffPlural })

export const BUSINESSES: Record<BusinessId, BusinessTemplate> = {
  nails: {
    id: 'nails',
    kind: 'Estudio de uñas',
    name: 'Luma Studio',
    tagline: 'Uñas, manos y pies con calma',
    hue: 292,
    emoji: '💅',
    terms: T('cita', 'citas', 'clienta', 'clientas', 'manicurista', 'manicuristas'),
    staff: [p('andrea', 'Andrea', 'Nail artist', 1), p('fernanda', 'Fernanda', 'Manicurista', 2), p('mariana', 'Mariana', 'Pedicurista', 3)],
    services: [
      s('gel', 'Gel semipermanente', 60, 650, 'Manos', 1),
      s('mani', 'Manicure', 45, 400, 'Manos', 2),
      s('acril', 'Acrílico', 90, 850, 'Manos', 5),
      s('pedi', 'Pedicure spa', 60, 550, 'Pies', 3),
      s('art', 'Nail art', 30, 250, 'Extras', 4),
      s('retiro', 'Retiro de gel', 30, 200, 'Extras', 4),
    ],
    gap: 20,
    reminderTip: 'Llega con las uñas sin esmalte para aprovechar tu tiempo.',
  },
  dental: {
    id: 'dental',
    kind: 'Clínica dental',
    name: 'Clínica Dental Alba',
    tagline: 'Odontología integral',
    hue: 205,
    emoji: '🦷',
    terms: T('cita', 'citas', 'paciente', 'pacientes', 'doctor', 'doctores'),
    staff: [p('reyes', 'Dra. Sofía Reyes', 'Odontología general', 4), p('ortega', 'Dr. Luis Ortega', 'Endodoncia', 3), p('mendoza', 'Dra. Paula Mendoza', 'Ortodoncia', 1)],
    services: [
      s('limpieza', 'Limpieza dental', 45, 800, 'Prevención', 4),
      s('valoracion', 'Valoración', 30, 400, 'Prevención', 3),
      s('resina', 'Resina', 60, 1200, 'Restauración', 1),
      s('blanq', 'Blanqueamiento', 90, 3500, 'Estética', 5),
      s('endo', 'Endodoncia', 120, 4800, 'Especialidad', 2),
      s('orto', 'Ajuste de ortodoncia', 30, 700, 'Ortodoncia', 1),
    ],
    gap: 30,
    reminderTip: 'Si tomas algún medicamento, avísanos al llegar.',
  },
  tattoo: {
    id: 'tattoo',
    kind: 'Estudio de tatuajes',
    name: 'Tinta Norte',
    tagline: 'Tatuaje fino y blackwork',
    hue: 30,
    emoji: '🖋️',
    terms: T('sesión', 'sesiones', 'cliente', 'clientes', 'artista', 'artistas'),
    staff: [p('ivan', 'Iván', 'Blackwork', 2), p('renata', 'Renata', 'Fine line', 5), p('diego', 'Diego', 'Color', 4)],
    services: [
      s('consulta', 'Consulta de diseño', 30, 0, 'Diseño', 3),
      s('mini', 'Tatuaje pequeño', 60, 1200, 'Tatuaje', 2),
      s('mediano', 'Sesión mediana', 180, 3500, 'Tatuaje', 5),
      s('retoque', 'Retoque', 60, 600, 'Tatuaje', 4),
      s('piercing', 'Piercing', 30, 450, 'Piercing', 1),
    ],
    gap: 45,
    reminderTip: 'Come bien antes de tu sesión y evita el alcohol 24 h antes.',
  },
  psych: {
    id: 'psych',
    kind: 'Consultorio de psicología',
    name: 'Espacio Calma',
    tagline: 'Terapia individual y de pareja',
    hue: 160,
    emoji: '🌿',
    terms: T('sesión', 'sesiones', 'paciente', 'pacientes', 'terapeuta', 'terapeutas'),
    staff: [p('torres', 'Lic. Elena Torres', 'Terapia cognitivo-conductual', 3), p('ruiz', 'Mtro. Javier Ruiz', 'Terapia de pareja', 4)],
    services: [
      s('primera', 'Primera consulta', 60, 700, 'Inicio', 4),
      s('individual', 'Terapia individual', 50, 900, 'Terapia', 3),
      s('pareja', 'Terapia de pareja', 80, 1300, 'Terapia', 1),
      s('online', 'Sesión en línea', 50, 800, 'En línea', 5),
    ],
    gap: 40,
    reminderTip: 'Si es en línea, el enlace llegará 10 minutos antes.',
  },
  barber: {
    id: 'barber',
    kind: 'Barbería',
    name: 'Barbería Rivera',
    tagline: 'Cortes clásicos desde 1998',
    hue: 250,
    emoji: '💈',
    terms: T('cita', 'citas', 'cliente', 'clientes', 'barbero', 'barberos'),
    staff: [p('carlos', 'Carlos', 'Maestro barbero', 4), p('tono', 'Toño', 'Barbero', 2), p('mateo', 'Mateo', 'Barbero', 3)],
    services: [
      s('corte', 'Corte clásico', 40, 250, 'Cortes', 4),
      s('fade', 'Fade', 45, 300, 'Cortes', 1),
      s('combo', 'Corte + barba', 60, 380, 'Combos', 2),
      s('afeitado', 'Afeitado con toalla', 30, 200, 'Barba', 3),
      s('nino', 'Corte infantil', 30, 180, 'Cortes', 5),
    ],
    gap: 10,
    reminderTip: 'Si llegas 10 min tarde podríamos tener que reagendar.',
  },
  coach: {
    id: 'coach',
    kind: 'Coach independiente',
    name: 'Nora Vidal Coaching',
    tagline: 'Coaching de carrera y liderazgo',
    hue: 350,
    emoji: '✨',
    terms: T('sesión', 'sesiones', 'cliente', 'clientes', 'coach', 'coaches'),
    staff: [p('nora', 'Nora Vidal', 'Coach de liderazgo', 5)],
    services: [
      s('discovery', 'Llamada de descubrimiento', 30, 0, 'Inicio', 3),
      s('uno', 'Sesión 1:1', 60, 1500, 'Sesiones', 5),
      s('intensivo', 'Sesión intensiva', 120, 2800, 'Sesiones', 1),
      s('revision', 'Revisión de CV', 45, 900, 'Carrera', 4),
    ],
    gap: 60,
    reminderTip: 'Trae a la sesión una meta concreta para esta semana.',
  },
}

export const BUSINESS_LIST = Object.values(BUSINESSES)

export const HUES = [
  { hue: 292, name: 'Lavanda' },
  { hue: 265, name: 'Iris' },
  { hue: 205, name: 'Agua' },
  { hue: 160, name: 'Salvia' },
  { hue: 30, name: 'Terracota' },
  { hue: 350, name: 'Rosa' },
]

export const FIRST_NAMES = [
  'Andrea', 'Mariana', 'Fernanda', 'Valeria', 'Daniela', 'Sofía', 'Camila', 'Regina', 'Ximena', 'Paola',
  'Lucía', 'Renata', 'Carla', 'Natalia', 'Jimena', 'Alejandra', 'Diego', 'Santiago', 'Emiliano', 'Rodrigo',
  'Pablo', 'Javier', 'Luis', 'Héctor', 'Iñaki', 'Mauricio', 'Gabriela', 'Montserrat', 'Isabel', 'Ana Paula',
]

export const LAST_NAMES = [
  'Hernández', 'López', 'Ruiz', 'García', 'Martínez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Vargas',
  'Castillo', 'Morales', 'Ortiz', 'Jiménez', 'Navarro', 'Domínguez', 'Aguilar', 'Mendoza', 'Rojas', 'Salinas',
]

export const CUSTOMER_NOTES = [
  'Prefiere citas por la mañana.',
  'Le gustan los tonos nude.',
  'Alérgica al látex.',
  'Siempre llega 5 minutos antes.',
  'Pide recordatorio el mismo día.',
  'Viene recomendada por una amiga.',
  'Prefiere pagar con transferencia.',
  '',
  '',
]

# Agenda · demo de software a medida

Demo interactiva de un sistema de **agenda + reservas en línea + recordatorios por WhatsApp**, adaptable a distintos tipos de negocio (estudio de uñas, clínica dental, tatuajes, psicología, barbería, coach).

Sin backend: los datos son simulados y se guardan en `localStorage`.

## Stack
React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · Lucide · React Router

## Rutas
| Ruta | Qué es |
| --- | --- |
| `/` | Presentación de la demo |
| `/demo/dashboard` | Resumen del día, gráficas, próximas citas |
| `/demo/calendar` | Calendario semana/día por profesional |
| `/demo/appointments` | Lista de citas con filtros |
| `/demo/customers` | Mini CRM |
| `/demo/services` | Alta/edición/activación de servicios |
| `/demo/automations` | Automatizaciones de WhatsApp + simulador |
| `/demo/customize` | Cambiar tipo de negocio, nombre, color, tema |
| `/demo/settings` | Horario, WhatsApp del negocio, restablecer demo |
| `/book`, `/book/:business` | Página pública de reservas |

Las reservas hechas en `/book/:business` aparecen en el panel (también en vivo si está abierto en otra pestaña).

## Desarrollo
```bash
npm install
npm run dev
npm run build   # salida en dist/
```

## Netlify
`netlify.toml` ya define el build (`npm run build`, publica `dist/`) y el redirect SPA.

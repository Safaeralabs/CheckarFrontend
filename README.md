# Checkar CDA Frontend

Frontend construido con Vite + React para la experiencia web de Checkar CDA.

## Stack

- Vite
- React
- React Router
- Framer Motion
- Lucide React

## Enfoque UI

- Mobile-first
- Azul como eje visual de marca
- Layouts diferenciados para cliente, operacion y administracion
- Navegacion clara, jerarquia visual fuerte y superficies ligeras
- Base lista para conectar con la API Django REST

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`

## Acceso

La app intenta autenticarse contra:

- `POST /api/auth/login/`
- `POST /api/auth/register/`
- `POST /api/auth/logout/`
- `GET /api/auth/session/`

Si la API no esta disponible, puedes entrar con demos por rol desde la pantalla de acceso.

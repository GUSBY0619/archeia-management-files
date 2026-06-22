# ManagementFiles — Frontend

Cliente web para gestión de archivos construido con **React 19**, **Tailwind CSS** y **Radix UI**.

## Stack

- **React 19** — UI
- **CRACO** (Create React App Configuration Override) — build tool
- **Tailwind CSS 3** + `tailwindcss-animate` — estilos
- **Radix UI** — componentes headless (Dialog, Dropdown, Alert, etc.)
- **React Router 7** — navegación
- **TanStack Query** (React Query 5) — fetching y cache
- **Axios** — HTTP client
- **Zod** + **React Hook Form** — formularios y validación
- **Framer Motion** — animaciones
- **Recharts** — gráficos
- **Sonner** — toasts
- **SWR** — data fetching secundario
- **Lucide** — iconos

## Requisitos

- Node.js 18+ o 20+
- npm o yarn (el proyecto usa yarn según `packageManager`)

## Setup

```bash
cd frontend

# Con yarn (recomendado)
yarn install

# O con npm
npm install
```

## Configuración

Editar `.env` en la raíz de `frontend/`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | URL base del backend API | `http://localhost:8000` |

## Ejecutar

```bash
# Development server (hot reload)
yarn start
# o
npm start
```

Abre en `http://localhost:3000`.

## Build

```bash
yarn build
# o
npm run build
```

Genera el bundle optimizado en `build/`.

## Tests

```bash
yarn test
# o
npm test
```

## Estructura del proyecto

```
frontend/
├── public/                  # Archivos estáticos
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes base (shadcn/ui style)
│   │   │   ├── alert-dialog.jsx
│   │   │   ├── dialog.jsx
│   │   │   └── dropdown-menu.jsx
│   │   ├── FileManager.jsx        # Componente principal
│   │   ├── Sidebar.jsx            # Barra lateral
│   │   ├── Editor.jsx             # Editor de archivos
│   │   ├── CreateFileModal.jsx    # Modal crear archivo
│   │   ├── CreateFolderModal.jsx  # Modal crear carpeta
│   │   ├── RenameModal.jsx        # Modal renombrar
│   │   └── DeleteConfirmModal.jsx # Modal confirmar borrado
│   ├── hooks/
│   │   └── useDebounce.js         # Hook de debounce
│   ├── lib/
│   │   └── utils.js               # Utilidades
│   ├── App.js                     # Entry point de la app
│   ├── App.css
│   ├── index.js                   # Punto de entrada React
│   └── index.css                  # Estilos globales + variables CSS
├── craco.config.js           # Override de CRA
├── tailwind.config.js        # Configuración de Tailwind
├── postcss.config.js         # PostCSS (autoprefixer, tailwind)
└── package.json
```

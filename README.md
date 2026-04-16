# DragonFire Room Layout Planner

A standalone Next.js application for the DragonFire tool-cabinet 3D room layout planner.

## Getting Started

### Prerequisites
- Node.js >= 22 < 23
- Yarn 1.x

### Install dependencies

```bash
yarn install
```

### Environment variables

Copy `.env.local.example` to `.env.local` and fill in the required SendGrid credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
| Variable | Description |
|---|---|
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender address |
| `SENDGRID_DRAGONFIRE_QUOTE_TEMPLATE_ID` | Dynamic template ID for quote emails |
| `SENDGRID_DRAGONFIRE_QUOTE_BCC` | BCC address for quote emails (optional) |

### Run development server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) – the root redirects to the room layout planner automatically.

### Build for production

```bash
yarn build
yarn start
```

## Project Structure

```
src/
  pages/
    index.js                              – redirect to room-layout-planner
    dragonfire-tools/room-layout-planner/ – main planner page
    api/send-dragonfire-quote.js          – SendGrid quote-email API route
  components/
    canvas/DragonfireTools/               – Three.js / R3F canvas components
    dom/DragonfireTools/                  – React DOM overlay components
  data/DragonfireTools/                   – Cabinet data, snap logic, tutorial steps
  stores/
    useDragNDropStore.js                  – Dragonfire scene state (Zustand)
    useAnimationStore.jsx                 – Shared UI animation state (Zustand)
  styles/dom/DragonfireTools/             – SCSS modules for DOM components
public/
  models/dragonfire-tools/               – GLB cabinet & room models
  images/dragonfire-tools/               – Product images for sidebar
  envMaps/                               – HDR environment maps
```

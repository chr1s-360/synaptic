# Synaptic ⚡

> **Intelligent Emergency Healthcare Routing & Real-Time ED Intake Coordination**

Synaptic is a real-time healthcare navigation and emergency triage routing system. It addresses emergency department overcrowding by calculating the **true fastest path to care**—combining live traffic travel times and active ER wait queues—while connecting pre-arrival patient intake directly to hospital staff dashboards with zero PII exposure.

---

## Key Features

- **Dynamic Role Selector (`/`)**: Dual-portal entry point for care-seeking patients and hospital emergency department personnel.
- **Real-Time Emergency Hospital Router (`/patient-router`)**:
  - Live wait time calculations and traffic-aware travel durations (`Total Time = Drive Time + ER Wait`).
  - Interactive Leaflet/OpenStreetMap view with geocoded Ontario facilities and capacity metrics.
  - One-click anonymous pre-arrival notifications ("Notify hospital I'm coming") with triage acuity (Levels 1–5).
- **Hospital Emergency Department Portal (`/hospital-portal`)**:
  - Live inbound patient feed syncing every 5 seconds directly from Timescale Cloud DB.
  - Acuity-level breakdown (Minor to Critical Level 5 alerts), age demographics, and live travel ETA tracking.
  - Interactive status workflow: `Incoming` &rarr; `Arrived` &rarr; `Triaged` &rarr; `Dismissed`.
- **Specialist Directory (`/specialist-directory`)**:
  - Verified directory of board-certified Ontario specialists (Cardiology, ENT, Pediatrics, Orthopedics, etc.).
  - Searchable by specialty, spoken language, and immediate referral availability.
- **AI Healthcare Navigator**:
  - Context-aware clinical triage guidance powered by **Google Gemini**.
  - Provides personalized care plans, recommended transport (Drive vs. 911), and next-step actions.
- **Privacy by Design**:
  - Persists **zero** Personally Identifiable Information (no names, phone numbers, or emails) to the database.

---

## Architecture & Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo** | [Turborepo](https://turbo.build/) & [pnpm](https://pnpm.io/) | High-performance multi-package workspace management |
| **Frontend** | [Next.js 13](https://nextjs.org/) (App Router), React 18, TypeScript | SSR, responsive client dashboards, and Serverless API routes |
| **Backend API** | [Hono](https://hono.dev/) & `@hono/node-server` | Lightweight, fast backend service |
| **Database** | [Timescale Cloud](https://www.timescale.com/) (PostgreSQL) | High-reliability managed PostgreSQL for live tickets and provider data |
| **ORM** | [Prisma](https://www.prisma.io/) (v5.5) | Type-safe schema definition and client generation across packages |
| **AI Engine** | [Google Gemini API](https://ai.google.dev/) (`@google/genai`) | LLM-assisted clinical symptom navigation and triage recommendations |
| **Maps & Geospatial** | Leaflet, React-Leaflet, OpenStreetMap | Interactive facility mapping and routing distance calculations |
| **Design System** | [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) | Modern accessible UI with sleek dark healthcare theme |
| **Containerization** | [Docker](https://www.docker.com/) & Docker Compose | Multi-container local development orchestration |

---

## Monorepo Workspace Structure

```
synaptic/
├── apps/
│   ├── web/                    # Next.js frontend (patient router, hospital portal, API routes)
│   └── api/                    # Hono REST API service
├── packages/
│   ├── database/               # Shared Prisma schema, client, and DB utilities
│   ├── ui/                     # Shared shadcn/ui React components
│   ├── tsconfig/               # Shared TypeScript configurations
│   └── eslint-config-custom/   # Shared ESLint rules
├── services/
│   └── map-service/            # Python / Streamlit mapping microservice
├── docker-compose.yml          # Multi-container orchestration
└── turbo.json                  # Turborepo task pipeline
```

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker](https://www.docker.com/) (optional, for containerized local services)

### 2. Environment Variables

Create `.env` in the project root (as well as `apps/api/.env` and `packages/database/.env` if developing locally):

```properties
PORT=3001
JWT_SECRET=your-random-jwt-secret-string
DATABASE_URL="postgres://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Install Dependencies

```sh
pnpm install
```

### 4. Database Setup

Generate the Prisma Client and sync the schema to your database:

```sh
pnpm turbo db:generate
pnpm turbo db:push
```

### 5. Running in Development

Run all workspace applications simultaneously:

```sh
pnpm dev
```

- **Web Portal**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:3001](http://localhost:3001)

Or run individually:

```sh
pnpm --filter web dev    # Next.js Web App
pnpm --filter api dev    # Hono API
```

---

## Deployment (Vercel)

`apps/web` is optimized for deployment on **Vercel**:

1. Set the **Root Directory** to `apps/web` (or deploy from monorepo root with framework preset Next.js).
2. Configure Environment Variables in Vercel Project Settings:
   - `DATABASE_URL`: Your Timescale/PostgreSQL connection string.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
3. Build Command: `turbo run build` or `pnpm run build`.

---

## Acknowledgements & Credits

This project was built on top of the open-source [Hackathon Starter](https://github.com/Code42Cate/hackathon-starter) template by [@Code42Cate](https://github.com/Code42Cate), which in turn was adapted from [@dan5py's turborepo-shadcn-ui](https://github.com/dan5py/turborepo-shadcn-ui). We thank the original authors for establishing an efficient monorepo foundation!

---

## License

[MIT](LICENSE)
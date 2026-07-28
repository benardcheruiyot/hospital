# Enhancing Hospital Operations and Patient Experience Through Digital Solutions

A ready-to-run, full-stack implementation of the project proposal (Haron Kipkemoi Bett, Kenya
Methodist University) for an integrated digital hospital platform covering:

1. **Patient engagement** — appointment scheduling, secure messaging, viewing health information
2. **Online patient registration & intake**
3. **Telemedicine** — real-time virtual consultations (WebRTC)
4. **Analytics dashboard** — hospital performance KPIs

## Architecture

```
hospital-digital-platform/
├── backend/     # Node.js + Express + PostgreSQL REST API + Socket.IO
├── frontend/    # React (Vite) single-page application
└── docker-compose.yml
```

Frontend and backend are fully separated: the frontend only talks to the backend over HTTP
(REST) and WebSockets (Socket.IO), configured via `VITE_API_URL` / `VITE_SOCKET_URL`.

## Quick start (without Docker)

**1. Backend**

```bash
cd backend
cp .env.example .env      # set your Postgres credentials + JWT secret
npm install
npm run dev                # http://localhost:5000
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

Make sure a PostgreSQL server is running and the database named in `backend/.env` exists
(`createdb hospital_platform`). In development, the backend automatically creates tables from
the models on startup.

## Quick start (Docker)

```bash
docker compose up --build
```

This starts PostgreSQL, the backend API (port 5000), and the frontend dev server (port 5173).

## Default roles

Anyone can self-register as a **patient** or **doctor** from the Register page. The first admin
account should be created via the database seeder:

```bash
cd backend
npm run db:migrate   # only needed if you're using migrations instead of auto-sync
npm run db:seed
```

Seeded admin login: `admin@hospital-platform.local` / `ChangeMe123!`

## Mapping to the proposal's specific objectives

| Objective | Implementation |
|---|---|
| 1. Patient engagement platform (scheduling, messaging, health info) | `appointments`, `messages` modules (backend) + Appointments/Messages pages (frontend) |
| 2. Online registration & intake | `patients` module + Registration page |
| 3. Telemedicine | `telemedicine` module (Socket.IO signaling) + Telemedicine page (WebRTC) |
| 4. Analytics dashboard | `analytics` module + Analytics page (Recharts) |
| 5. Influence on patient experience | Supported by appointment status tracking & KPI reporting, to be evaluated during the study's data collection phase |

## Next steps for a production deployment

- Replace the automatic `sequelize.sync()` with proper migrations (`src/database/migrations`).
- Put the API behind HTTPS and a reverse proxy (e.g. Nginx) with a TURN server for WebRTC in
  restrictive network environments.
- Add automated tests (Jest/Supertest for the API, React Testing Library for the frontend).
- Integrate a real EHR system via the REST API layer, as described in the proposal's scope.

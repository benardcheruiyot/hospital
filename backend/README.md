# Hospital Digital Platform — Backend API

Node.js / Express / PostgreSQL REST + real-time API implementing the modules described in the
project proposal *"Enhancing Hospital Operations and Patient Experience through Digital
Solutions in Nairobi County, Kenya"*:

1. **Patient engagement** — appointment scheduling, secure messaging, viewing health information
2. **Digital registration / intake** — online patient registration and profile management
3. **Telemedicine** — WebRTC signaling (via Socket.IO) for virtual consultations
4. **Analytics dashboard** — KPIs for hospital performance monitoring

## Tech stack

- **Runtime:** Node.js 18+, Express 4
- **Database:** PostgreSQL via Sequelize ORM
- **Auth:** JWT (JSON Web Tokens), bcrypt password hashing
- **Real-time:** Socket.IO (messaging + WebRTC signaling)
- **Validation:** express-validator
- **Security:** helmet, cors, express-rate-limit

## Folder structure

```
backend/
├── src/
│   ├── config/          # DB + environment configuration
│   ├── controllers/     # Route handler logic
│   ├── database/
│   │   ├── migrations/  # Sequelize migrations (production schema changes)
│   │   └── seeders/     # Seed data (e.g. default admin account)
│   ├── middleware/       # auth, validation, error handling
│   ├── models/           # Sequelize models + associations
│   ├── routes/           # Express routers per resource
│   ├── services/         # Reusable business logic
│   ├── sockets/           # Socket.IO event handlers (chat, WebRTC signaling)
│   ├── utils/             # JWT helpers, ApiError
│   ├── app.js             # Express app config
│   └── server.js          # HTTP + Socket.IO bootstrap
├── .env.example
├── .sequelizerc
└── package.json
```

## Getting started

```bash
cd backend
cp .env.example .env      # fill in your DB credentials & JWT secret
npm install
createdb hospital_platform   # or use your preferred Postgres admin tool

npm run dev                # starts the API on http://localhost:5000
```

In development, `server.js` calls `sequelize.sync()` automatically so tables are created from the
models. For production, use migrations instead:

```bash
npm run db:migrate
npm run db:seed
```

Default seeded admin: `admin@hospital-platform.local` / `ChangeMe123!` — change this immediately
in any real deployment.

## API overview

| Area | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, current user |
| Patients | `/api/patients` | intake/registration profile |
| Doctors | `/api/doctors` | doctor directory |
| Appointments | `/api/appointments` | scheduling & status updates |
| Messages | `/api/messages` | secure patient–provider messaging |
| Telemedicine | `/api/telemedicine` | session lifecycle; live signaling over Socket.IO |
| Analytics | `/api/analytics` | KPI dashboard endpoints (admin/doctor only) |

All endpoints except `/api/auth/register` and `/api/auth/login` require an
`Authorization: Bearer <token>` header.

## Real-time events (Socket.IO)

Connect with `auth: { token: <jwt> }`.

- `message:new`, `message:typing` — secure messaging
- `telemedicine:join`, `telemedicine:signal`, `telemedicine:leave`,
  `telemedicine:peer-joined`, `telemedicine:peer-left` — WebRTC signaling for virtual
  consultations

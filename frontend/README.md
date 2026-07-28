# Hospital Digital Platform — Frontend

React (Vite) single-page app implementing the patient/provider-facing side of the platform:
appointment scheduling, patient registration/intake, secure messaging, telemedicine video
consultations, and an analytics dashboard.

## Folder structure

```
frontend/
├── src/
│   ├── components/     # Shared UI (AppShell layout, ProtectedRoute)
│   ├── context/         # AuthContext (JWT session state)
│   ├── hooks/           # useWebRTC (telemedicine signaling + peer connection)
│   ├── pages/           # One component per route/screen
│   ├── services/         # Axios API clients + Socket.IO client
│   ├── App.jsx            # Route definitions
│   ├── main.jsx           # React root + providers
│   └── index.css          # Global styles/design tokens
├── index.html
└── vite.config.js
```

## Getting started

```bash
cd frontend
cp .env.example .env     # point at your running backend
npm install
npm run dev              # http://localhost:5173
```

## Roles

The UI adapts navigation and available pages based on the logged-in user's role:

- **patient** — dashboard, registration/intake form, appointments, messages, telemedicine
- **doctor** — dashboard, appointments, messages, telemedicine, analytics
- **admin** — dashboard, patients directory, appointments, analytics

## Notes

- Video calls use the browser's native WebRTC APIs with a public STUN server; signaling goes
  through the backend's Socket.IO server (see `src/hooks/useWebRTC.js`).
- Charts are built with Recharts and are driven by the backend's `/api/analytics/*` endpoints.

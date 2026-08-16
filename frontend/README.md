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

## Google Sign-In (best practices)

- Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` to your OAuth 2.0 Client ID and `GOOGLE_CLIENT_ID` in `backend/.env` to the same value. Restart both frontend and backend after changes.
- The app uses the Google Identity Services SDK (script present in `index.html`). Initialization is centralized to avoid multiple `google.accounts.id.initialize()` calls — avoid re-initializing the SDK in multiple places.
-- Do not include any development bypass tokens in production. For local testing, use a real Google Client ID configured in both frontend and backend `.env` files.
- To test real end-to-end Google sign-in:

```bash
# frontend: set client id and start dev server
cd frontend
# edit .env: VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
npm run dev

# backend: set GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com and restart
cd ../backend
npm run dev
```

If you want me to wire your Client ID into both `.env` files and restart services, paste the client ID here and I'll apply it for you.

# Women Safety Transport System - Backend API

Node.js + Express + TypeScript + Socket.IO server powering real-time location monitoring, 0.5 km corridor geofencing, ML anomaly risk engine integration, discreet & hands-free SOS handling, trusted contacts, and authority dashboard sync.

## Endpoints

### Authentication
- `POST /api/auth/register` — Register user account
- `POST /api/auth/login` — Login user & receive JWT
- `GET /api/users/me` — Get user profile
- `PUT /api/users/me` — Update user profile

### Trusted Contacts
- `GET /api/contacts` — List trusted contacts
- `POST /api/contacts` — Add contact
- `PUT /api/contacts/:id` — Update contact
- `DELETE /api/contacts/:id` — Remove contact

### Journey & GPS Tracking
- `POST /api/trips` — Create new monitored journey
- `GET /api/trips` — Get user's journeys
- `GET /api/trips/:id` — Get journey details
- `POST /api/trips/:id/location` — Push GPS update (computes 6 ML features, geofence, and ML prediction)
- `POST /api/trips/:id/end` — Mark journey as completed

### SOS & Emergency
- `POST /api/sos` — Trigger discreet/shake/voice SOS
- `GET /api/sos/:id` — Get SOS event details
- `PUT /api/sos/:id/resolve` — Resolve emergency event

### Incidents & Safe Guidance
- `GET /api/incidents` — Incident history
- `GET /api/incidents/:id` — Incident breakdown with 6 ML features
- `GET /api/safe-locations` — Nearby verified safe spots with distance & walking ETA

### Authority Dashboard
- `GET /api/dashboard` — Overview metrics & active journeys
- `GET /api/dashboard/alerts` — Active emergency alerts
- `GET /api/dashboard/incidents` — Detailed incident records with ML telemetry

## How to Run

1. **Install Dependencies**:
```bash
npm install
```

2. **Seed Default Data**:
```bash
npm run seed
```

3. **Start Development Server**:
```bash
npm run dev
```
Server will run on `http://localhost:5000`.

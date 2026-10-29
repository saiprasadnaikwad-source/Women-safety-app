# Real-Time Public-Transport Safety System for Women

A full-stack mobile safety platform, Machine Learning anomaly detection engine, Express REST & Socket.IO backend, and Authority Control Dashboard engineered for real-time women's journey security.

---

## 🌟 Key System Capabilities

1. **Real-Time Public Transport Journey Monitoring**: Monitors travel along city buses, metro lines, local trains, auto rickshaws, and shared vehicles.
2. **0.5 km Corridor Geofencing**: Computes perpendicular distance from live GPS positions to expected route polyline. Triggers staged response upon breaching 500 meters.
3. **Machine Learning Anomaly Engine (Isolation Forest)**: Trains on 6,000+ realistic synthetic journey records using exact 6 feature vectors:
   - `distance_from_route_m`
   - `speed_kmh`
   - `stop_duration_min`
   - `direction_change_deg`
   - `journey_delay_min`
   - `distance_to_destination_km`
4. **Staged Response System**:
   - **Stage 1 (Minor Deviation >500m)**: Prompts user with *"Are you still safe?"* modal.
   - **Stage 2 (Persistent Deviation / Stop)**: Escalates risk score (60–80).
   - **Stage 3 (High-Risk Anomaly / SOS)**: Triggers emergency broadcast to contacts & dashboard.
5. **Discreet & Hands-Free SOS**:
   - One-tap 5-second cancelable countdown emergency trigger.
   - Accelerometer phone shake gesture trigger simulation.
   - Hands-free voice recognition wake phrase (*"Help me"* / *"Emergency"*).
6. **Trusted Contacts & Live Sharing**: Instant SMS notification simulation + Socket.IO live location tracking.
7. **Safe Location Guidance**: Verified nearby Police Stations, Hospitals, and 24/7 Transit Hubs with walking ETA and Google Maps directions.
8. **Discreet Evidence Capture**: Photo snapshot and audio recording controls with privacy policies.
9. **Authority Control Dashboard**: Live Leaflet city monitoring map, active emergency alerts table, and full 6-feature ML telemetry breakdown.

---

## 📁 Repository Structure

```text
women-safety-system/
│
├── mobile/            # React Native Expo & Web Mobile Application
│   ├── src/
│   │   ├── screens/   # HomeScreen, LiveJourneyScreen, StartJourneyScreen, etc.
│   │   ├── components/# SOSCountdownModal, MapComponent, etc.
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── backend/           # Node.js + Express + TypeScript + Socket.IO Backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/    # MongoDB Schemas + High-Performance Memory DB Fallback
│   │   ├── services/  # geofenceService, mlService, riskEngineService, seedService
│   │   ├── socket/    # Socket.IO Real-Time Handler
│   │   └── app.ts
│   └── package.json
│
├── ml-service/        # Python FastAPI Isolation Forest ML Service
│   ├── main.py        # FastAPI server (/predict endpoint)
│   ├── train_model.py # Synthetic dataset generator & model trainer
│   ├── dataset.csv    # 6,000 generated journey records
│   ├── isolation_forest.pkl
│   ├── scaler.pkl
│   └── requirements.txt
│
├── dashboard/         # Authority Monitoring Web Dashboard (React + Vite)
│   ├── src/
│   │   ├── components/ # MapComponent, AlertsTable, MLTelemetryPanel
│   │   └── App.tsx
│   └── package.json
│
├── README.md
├── .gitignore
└── .env.example
```

---

## ⚙️ Quick Start & Execution Commands

### 1. Python ML Microservice Setup (Port 8000)
```bash
cd ml-service
pip install -r requirements.txt
python train_model.py
uvicorn main:app --reload --port 8000
```

### 2. Node.js Express Backend Setup (Port 5000)
```bash
cd backend
npm install
npm run dev
```

### 3. Mobile Application (Port 3001)
```bash
cd mobile
npm install
npm run dev
```

### 4. Authority Control Dashboard (Port 3000)
```bash
cd dashboard
npm install
npm run dev
```

---

## 🚀 22-Step End-to-End Demo Flow

1. Open Mobile App on `http://localhost:3001`.
2. Complete 4-step safety onboarding.
3. Sign in using pre-filled demo credentials (`demo@example.com` / `Demo@123`).
4. View Home Screen showing *"Good evening Ishwari, You're safe"* and 2 trusted contacts.
5. Tap **Start Journey** and select Pune Station -> Hinjewadi IT Park (Bus).
6. Tap **Start Monitoring** to launch the interactive live route map.
7. Observe green status *"You're on expected route"* with 0.5 km corridor envelope.
8. Tap **Demo ML** button on top bar.
9. Select **Scenario 2: Route Corridor Breach (780m outside 0.5km)**.
10. Live map updates position outside corridor.
11. Backend passes 6 features to Python Isolation Forest microservice.
12. App displays Stage 1 prompt: *"Are you still safe?"*
13. Ignore safety prompt to allow risk escalation to **CRITICAL**.
14. Tap discreet **SOS** button or say *"Help me"*.
15. 5-second countdown timer initiates.
16. SOS triggers: trusted contacts receive simulated SMS alerts.
17. Live location sharing activates.
18. Open Authority Dashboard on `http://localhost:3000`.
19. Dashboard immediately receives live Socket.IO emergency alert with red pulsing marker.
20. Select alert to view full ML telemetry breakdown (distance: 780m, speed: 8.4 km/h, stop: 14m, direction: 124°, delay: 19m, risk: 82/100).
21. On mobile app, tap **Nearest Safe Locations** to view Shivajinagar Police Station (0.8 km) with walking ETA.
22. On Authority Dashboard, click **Resolve Alert** to mark incident resolved.

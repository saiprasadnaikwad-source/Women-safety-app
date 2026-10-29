# ML Anomaly Detection Service

Isolation Forest machine learning microservice for real-time women's transport journey anomaly detection.

## Features
- Scikit-Learn `IsolationForest` model trained on 6,000 synthetic realistic journey records.
- Standardized scaling via `StandardScaler`.
- Fast inference API powered by FastAPI and Uvicorn.
- Normalizes raw decision scores to 0–100 risk score and classifies into `LOW`, `MODERATE`, `HIGH`, or `CRITICAL`.

## The 6 ML Features
1. `distance_from_route_m`: Shortest distance from expected corridor (meters)
2. `speed_kmh`: Current vehicle/user travel speed (km/h)
3. `stop_duration_min`: Prolonged stop duration (minutes)
4. `direction_change_deg`: Travel direction change angle (degrees)
5. `journey_delay_min`: Deviation from expected ETA schedule (minutes)
6. `distance_to_destination_km`: Remaining distance to final destination (km)

## How to Run

1. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

2. **Train Model** (Generates dataset.csv & isolation_forest.pkl):
```bash
python train_model.py
```

3. **Start FastAPI Service** (Port 8000):
```bash
uvicorn main:app --reload --port 8000
```

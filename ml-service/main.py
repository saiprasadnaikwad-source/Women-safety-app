import os
import shutil
import tempfile
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
from number_plate import detect_number_plate

app = FastAPI(
    title="Women Safety Transport Anomaly Detection ML API",
    description="Isolation Forest ML service for real-time journey safety analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'isolation_forest.pkl')
scaler_path = os.path.join(script_dir, 'scaler.pkl')

# Load Model & Scaler
try:
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    print("Loaded Isolation Forest model & scaler successfully.")
except Exception as e:
    print(f"Warning: Model load error: {e}. Will attempt auto-training if missing.")
    model = None
    scaler = None

class PredictionRequest(BaseModel):
    distance_from_route_m: float = Field(..., example=720.0, description="Shortest distance from expected corridor in meters")
    speed_kmh: float = Field(..., example=8.5, description="Current speed in km/h")
    stop_duration_min: float = Field(..., example=12.0, description="Duration vehicle has been stopped in minutes")
    direction_change_deg: float = Field(..., example=110.0, description="Unusual direction change in degrees")
    journey_delay_min: float = Field(..., example=18.0, description="Delay compared to expected ETA in minutes")
    distance_to_destination_km: float = Field(..., example=8.4, description="Remaining distance to destination in km")

class PredictionResponse(BaseModel):
    prediction: int
    anomaly: bool
    anomaly_score: float
    risk_score: int
    risk_level: str
    feature_summary: dict

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Women Safety ML Anomaly Engine",
        "model_loaded": model is not None
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_anomaly(req: PredictionRequest):
    global model, scaler
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="ML model is not loaded. Run train_model.py first.")

    features = np.array([[
        req.distance_from_route_m,
        req.speed_kmh,
        req.stop_duration_min,
        req.direction_change_deg,
        req.journey_delay_min,
        req.distance_to_destination_km
    ]])

    try:
        features_scaled = scaler.transform(features)
        raw_pred = int(model.predict(features_scaled)[0]) # 1 = normal, -1 = anomaly
        decision_score = float(model.decision_function(features_scaled)[0])

        # Normalize raw decision score into anomaly score [0.0, 1.0]
        # Normal decision_function values range roughly from -0.3 to 0.3
        raw_anomaly_val = np.clip((0.3 - decision_score) / 0.6, 0.0, 1.0)
        
        # Base risk score 0 - 100
        base_risk = int(round(raw_anomaly_val * 100))

        # Enforce domain safety heuristics (0.5km Corridor rule)
        if req.distance_from_route_m > 500:
            geofence_extra = int(min(35, (req.distance_from_route_m - 500) / 25))
            final_risk = min(100, base_risk + geofence_extra + 15)
        else:
            final_risk = base_risk

        # Additional risk factor for severe stops with route delay
        if req.stop_duration_min > 10 and req.journey_delay_min > 10:
            final_risk = min(100, final_risk + 15)

        # Risk Classification
        if final_risk <= 30:
            risk_level = "LOW"
        elif final_risk <= 60:
            risk_level = "MODERATE"
        elif final_risk <= 80:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        is_anomaly = bool(raw_pred == -1 or final_risk >= 61)

        return PredictionResponse(
            prediction=raw_pred,
            anomaly=is_anomaly,
            anomaly_score=round(raw_anomaly_val, 4),
            risk_score=final_risk,
            risk_level=risk_level,
            feature_summary={
                "distance_from_route_m": req.distance_from_route_m,
                "speed_kmh": req.speed_kmh,
                "stop_duration_min": req.stop_duration_min,
                "direction_change_deg": req.direction_change_deg,
                "journey_delay_min": req.journey_delay_min,
                "distance_to_destination_km": req.distance_to_destination_km
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/detect-plate")
async def detect_plate(file: UploadFile = File(...)):
    """
    Vehicle License Plate Detection & OCR endpoint using FastALPR.
    Accepts multipart image upload and extracts vehicle registration number.
    """
    temp_file = None
    try:
        suffix = os.path.splitext(file.filename or "image.jpg")[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as buffer:
            temp_file = buffer.name
            shutil.copyfileobj(file.file, buffer)

        plates = detect_number_plate(temp_file)

        if plates and len(plates) > 0:
            best_plate = plates[0]
            return {
                "success": True,
                "plate_number": best_plate["plate_number"],
                "confidence": best_plate["confidence"],
                "bounding_box": best_plate.get("bounding_box"),
                "plates": plates
            }
        else:
            return {
                "success": False,
                "message": "No license plate detected in image.",
                "plate_number": "",
                "confidence": 0.0,
                "bounding_box": None,
                "plates": []
            }
    except Exception as e:
        print(f"License plate detection error: {e}")
        raise HTTPException(status_code=500, detail=f"OCR detection error: {str(e)}")
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)


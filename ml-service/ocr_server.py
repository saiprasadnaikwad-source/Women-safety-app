import os
import shutil
import tempfile
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from number_plate import detect_number_plate

app = FastAPI(
    title="SwaRaksha FastALPR Plate Recognition Service",
    description="License Plate Detection and OCR using FastALPR (YOLOv9 + CCT)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SwaRaksha FastALPR OCR Service"
    }

@app.post("/detect-plate")
async def detect_plate(file: UploadFile = File(...)):
    """
    Vehicle License Plate Detection & OCR endpoint using FastALPR.
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
    port = int(os.environ.get("OCR_PORT", 8001))
    print(f"Starting FastALPR OCR service on http://0.0.0.0:{port}...")
    uvicorn.run("ocr_server:app", host="0.0.0.0", port=port, reload=False)


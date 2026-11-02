import re
import os
import cv2
from fast_alpr import ALPR

# Lazy-loaded / singleton ALPR instance
_alpr_instance = None

def get_alpr():
    global _alpr_instance
    if _alpr_instance is None:
        _alpr_instance = ALPR(
            detector_model="yolo-v9-t-384-license-plate-end2end",
            ocr_model="cct-xs-v2-global-model"
        )
    return _alpr_instance

def detect_number_plate(image_path: str):
    """
    Detect license plates and perform OCR on the given image path.
    Returns a list of detected plates with alphanumeric numbers and confidence scores.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")

    alpr = get_alpr()
    results = alpr.predict(image_path)
    detected_plates = []

    for result in results:
        if result.ocr and result.ocr.text:
            raw_text = result.ocr.text
            clean_plate = re.sub(r'[^A-Za-z0-9]', '', raw_text).upper()
            
            # Extract bounding box if available
            bbox = None
            if hasattr(result, 'detection') and result.detection and hasattr(result.detection, 'bounding_box'):
                b = result.detection.bounding_box
                bbox = {
                    "x1": float(b.x1),
                    "y1": float(b.y1),
                    "x2": float(b.x2),
                    "y2": float(b.y2)
                }

            # FastALPR returns per-character confidence list or a single float
            if isinstance(result.ocr.confidence, (list, tuple)):
                conf = sum(result.ocr.confidence) / max(1, len(result.ocr.confidence)) if result.ocr.confidence else 0.0
            else:
                conf = float(result.ocr.confidence or 0.0)

            detected_plates.append({
                "number": clean_plate,
                "plate_number": clean_plate,
                "confidence": round(float(conf), 4),
                "bounding_box": bbox,
                "raw_text": raw_text
            })

    # Sort plates by highest confidence first
    detected_plates.sort(key=lambda x: x["confidence"], reverse=True)
    return detected_plates

if __name__ == "__main__":
    import sys
    test_img = sys.argv[1] if len(sys.argv) > 1 else "vehicle.jpg"
    print(f"Testing number plate detection on: {test_img}")
    if os.path.exists(test_img):
        plates = detect_number_plate(test_img)
        print("Detected plates:", plates)
    else:
        print(f"File '{test_img}' not found. Provide a valid vehicle image path.")

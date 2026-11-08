import json
import os
import sys
from ultralytics import YOLO

# Absolute path to the model weights file
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "yolov8n-cls.pt"
)


def run_inference(image_path: str) -> dict:
    """Validates local image path, runs YOLO classification, and builds output."""
    # 1. Verify model exists
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"YOLO model file not found at: {MODEL_PATH}")

    # 2. Verify local image exists
    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"Image file not found on PC: {image_path}")

    # 3. Load model and perform classification
    model = YOLO(MODEL_PATH)
    results = model(image_path, device="cpu", verbose=False)

    predictions = []
    for result in results:
        top1_index = result.probs.top1
        top1_confidence = float(result.probs.top1conf.item())
        class_name = result.names[top1_index]

        predictions.append({
            "class": class_name,
            "confidence": round(top1_confidence, 2),
            "confidencePercent": round(top1_confidence * 100, 2)
        })

    return {
        "success": True,
        "image": image_path,
        "predictions": predictions
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "No local image path provided in command arguments."
        }))
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        output = run_inference(image_path)
        print(json.dumps(output))
        sys.exit(0)
    except Exception as error:
        print(json.dumps({
            "success": False,
            "error": str(error)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
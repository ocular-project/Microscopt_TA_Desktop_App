import sys
from ultralytics import YOLO

MODEL_PATH = "yolov8n-cls.pt"

def main():
    image_path = sys.argv[1]

    model = YOLO(MODEL_PATH)

    results = model(
        image_path,
        device="cpu",
        verbose=False
    )

    for r in results:
        top1_index = r.probs.top1
        top1_confidence = r.probs.top1conf.item()
        class_name = r.names[top1_index]

        print(
            f"Prediction: {class_name} "
            f"({100 * top1_confidence:.2f}%)"
        )


if __name__ == "__main__":
    main()
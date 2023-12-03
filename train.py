from ultralytics import YOLO

def trainModel():
    model = YOLO('yolov8n.pt')
    save_dir = "runs/detect"
    result = model.train(
        epochs=100,
        data="C:/Users/User/Documents/GitHub/MindCue_train/datasets/all/data.yaml",
        project=save_dir,
        name="all",
        save_dir=save_dir)
    success = model.export(format='onnx', dynamic=True)

if __name__ == "__main__":
    trainModel()
from ultralytics import YOLO

model = YOLO("C:/Users/User/Documents/GitHub/MindCue_train/yolov8n.pt")
model.export(format="onnx")
from ultralytics import YOLO

model = YOLO("C:/Users/User/Documents/GitHub/MindCue_train/runs/detect/all2/weights/best.onnx")
results = model(source="https://www.wwlp.com/wp-content/uploads/sites/26/2023/02/fake-and-real-guns.jpg?w=900.jpeg", show=True, save=True)


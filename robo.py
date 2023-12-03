from roboflow import Roboflow

rf = Roboflow(api_key="j7S0akPVxGkQoDb5g36f")
project = rf.workspace("mindcue3").project("combo-dataset-3")

project.version(1).deploy(model_type="yolov8", model_path="C:/Users/User/Documents/GitHub/MindCue_train/runs/detect/all2/")
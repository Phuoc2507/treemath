import cv2
import os
import torch
import numpy as np
import sys
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog

sys.stdout.reconfigure(encoding='utf-8')

# Setup cấu hình
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_X_101_32x8d_FPN_3x.yaml"))
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 1
cfg.MODEL.WEIGHTS = "output/ResNext-101_fold_01.pth"
cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5
cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Loading model on {cfg.MODEL.DEVICE}...")
predictor = DefaultPredictor(cfg)

# Ảnh test (đã copy ra local)
image_path = "test_tree.jpg"
im = cv2.imread(image_path)

if im is None:
    print(f"Cannot read image from {image_path}")
    exit()

print("Running inference...")
outputs = predictor(im)

print(f"Found {len(outputs['instances'])} instances.")

# Vẽ kết quả
# Ép buộc tên class thành "Tree" (vì model train 1 class, nhưng metadata mặc định đang là COCO)
metadata = MetadataCatalog.get(cfg.DATASETS.TRAIN[0])
metadata.thing_classes = ["Tree"] # Override class lists

v = Visualizer(im[:, :, ::-1], metadata, scale=1.2)
out = v.draw_instance_predictions(outputs["instances"].to("cpu"))
result_img = out.get_image()[:, :, ::-1] # RGB -> BGR

# Lưu ảnh kết quả
output_filename = "ket_qua_test_detectron2.jpg"
cv2.imwrite(output_filename, result_img)
print(f"Saved result to: {os.path.abspath(output_filename)}")
print("Please open this image to verify!")

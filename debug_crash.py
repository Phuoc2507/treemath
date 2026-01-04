import cv2
import numpy as np
import torch
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo

# 1. SETUP MODEL
print("Loading Model Config...")
try:
    cfg = get_cfg()
    cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_X_101_32x8d_FPN_3x.yaml"))
    cfg.MODEL.ROI_HEADS.NUM_CLASSES = 1
    cfg.MODEL.WEIGHTS = "output/ResNext-101_fold_01.pth"
    cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5
    cfg.MODEL.DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    predictor = DefaultPredictor(cfg)
    print("Model loaded.")
except Exception as e:
    print(f"Model load failed: {e}")
    exit(1)

# 2. LOAD IMAGE
image_path = "test_tree.jpg"
img = cv2.imread(image_path)
if img is None:
    print(f"Cannot read {image_path}")
    exit(1)

h, w = img.shape[:2]
print(f"Image Size: {w}x{h}")

# 3. SIMULATE CROP
tx1, ty1, tx2, ty2 = 1, 13, 575, 1097 # Based on previous YOLO findings

print(f"Original Box: {tx1}, {ty1}, {tx2}, {ty2}")

# Logic Clamp & Fix
tx1 = int(max(0, min(tx1, w - 1)))
ty1 = int(max(0, min(ty1, h - 1)))
tx2 = int(max(tx1 + 1, min(tx2, w)))
ty2 = int(max(ty1 + 1, min(ty2, h)))

print(f"Clamped Box: {tx1}, {ty1}, {tx2}, {ty2}")
crop_w = tx2 - tx1
crop_h = ty2 - ty1
print(f"Crop Size: {crop_w}x{crop_h}")

# Cắt ảnh với ascontiguousarray
tree_crop_img = np.ascontiguousarray(img[ty1:ty2, tx1:tx2])

print(f"Crop Shape: {tree_crop_img.shape}")
print(f"Crop Is Contiguous: {tree_crop_img.flags['C_CONTIGUOUS']}")

# 4. RUN INFERENCE ON CROP
print("Running Detectron2 on Crop...")
try:
    outputs = predictor(tree_crop_img)
    print("Inference Success!")
    print(f"Instances found: {len(outputs['instances'])}")
    
    # Check mask
    if len(outputs['instances']) > 0:
        inst = outputs['instances'][0]
        if inst.has("pred_masks"):
            mask = inst.pred_masks.cpu().numpy()
            print(f"Mask Shape: {mask.shape}")
        else:
            print("No mask in output.")
            
except Exception as e:
    print(f"CRASHED: {e}")
    import traceback
    traceback.print_exc()

print("Debug Finished.")

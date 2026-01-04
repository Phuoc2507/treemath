import cv2
import numpy as np
from ultralytics import YOLO
import torch
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Tuple
import io
import json
import traceback

# --- CHECK DETECTRON2 ---
try:
    from detectron2.engine import DefaultPredictor
    from detectron2.config import get_cfg
    from detectron2 import model_zoo
    DETECTRON2_AVAILABLE = True
except ImportError:
    DETECTRON2_AVAILABLE = False
    print("⚠️ Detectron2 not installed. DBH feature will be disabled.")

# --- CONSTANTS ---
HUMAN_HEIGHT_CM = 170.0 
PERCEPTREE_MODEL_WEIGHTS = "output/ResNext-101_fold_01.pth" 
YOLO_PERSON_MODEL_PATH = 'yolov8n.pt'
YOLO_WORLD_MODEL_PATH = 'inference_pretrained/yolov8s-worldv2.pt'

# --- GLOBAL MODELS DICT ---
models: Dict[str, any] = {}

# --- LIFESPAN (MODEL LOADING) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- 🚀 STARTING SYSTEM ---")
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Device: {device}")

    # 1. Load YOLO Person
    try:
        models["yolo_person"] = YOLO(YOLO_PERSON_MODEL_PATH)
        models["yolo_person"].to(device)
        print("✅ YOLO Person Loaded.")
    except Exception as e:
        print(f"❌ Failed to load YOLO Person: {e}")

    # 2. Load YOLO Tree
    try:
        models["yolo_tree"] = YOLO(YOLO_WORLD_MODEL_PATH)
        models["yolo_tree"].set_classes(["tree"])
        models["yolo_tree"].to(device)
        print("✅ YOLO Tree Loaded.")
    except Exception as e:
        print(f"❌ Failed to load YOLO Tree: {e}")

    # 3. Load Detectron2 (PercepTree)
    if DETECTRON2_AVAILABLE:
        try:
            cfg = get_cfg()
            cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_X_101_32x8d_FPN_3x.yaml"))
            cfg.MODEL.ROI_HEADS.NUM_CLASSES = 1
            cfg.MODEL.WEIGHTS = PERCEPTREE_MODEL_WEIGHTS
            cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5
            cfg.MODEL.DEVICE = device
            
            models["perceptree"] = DefaultPredictor(cfg)
            print("✅ Detectron2 (PercepTree) Loaded.")
        except Exception as e:
            print(f"❌ Failed to load Detectron2: {e}")
            models["perceptree"] = None
    
    print("--- ✅ SYSTEM READY ---")
    yield
    models.clear()
    print("--- 🛑 SYSTEM SHUTDOWN ---")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CORE LOGIC: IMAGE ANALYSIS ---
def analyze_image(img_bytes: bytes, real_human_height: float, override_person_box=None, override_tree_box=None) -> dict:
    # 1. Decode Image
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image data.")
    
    h_img, w_img = img.shape[:2]
    
    results = {
        "tree_height_m": 0.0,
        "dbh_cm": 0.0,
        "boxes": {"person": None, "tree": None},
        "warnings": []
    }

    # 2. Find Person (Reference)
    scale_person_box = None
    if override_person_box:
        scale_person_box = np.array(override_person_box, dtype=int)
    elif "yolo_person" in models:
        # Detect person class=0
        res = models["yolo_person"](img, classes=[0], verbose=False)
        boxes = [b.xyxy[0].cpu().numpy().astype(int) for r in res for b in r.boxes]
        
        # Heuristic: Pick tallest person
        if boxes:
            scale_person_box = max(boxes, key=lambda b: b[3] - b[1])
        else:
            # Fallback: Assume person is 1/3 image height at bottom left (Safe fallback)
            dummy_h = h_img // 3
            scale_person_box = np.array([10, h_img - dummy_h, 10 + dummy_h//3, h_img], dtype=int)
            results["warnings"].append("Person not found. Using dummy box.")

    if scale_person_box is not None:
        results["boxes"]["person"] = scale_person_box.tolist()
        person_h_px = scale_person_box[3] - scale_person_box[1]
        scale_cm_per_px = real_human_height / person_h_px if person_h_px > 0 else 0
        ground_y = scale_person_box[3]
    else:
        return results # Cannot calculate anything without scale

    # 3. Find Tree (Target)
    best_tree_box = None
    if override_tree_box:
        best_tree_box = np.array(override_tree_box, dtype=int)
    elif "yolo_tree" in models:
        res = models["yolo_tree"].predict(img, verbose=False, conf=0.1)
        # Pick highest confidence tree
        all_boxes = []
        for r in res:
            for b in r.boxes:
                all_boxes.append((b.conf[0], b.xyxy[0].cpu().numpy().astype(int)))
        
        if all_boxes:
            best_tree_box = max(all_boxes, key=lambda x: x[0])[1]

    if best_tree_box is None:
        results["warnings"].append("Tree not found by YOLO.")
        return results
    
    results["boxes"]["tree"] = best_tree_box.tolist()
    
    # Calculate Tree Height
    tree_h_px = best_tree_box[3] - best_tree_box[1]
    results["tree_height_m"] = (tree_h_px * scale_cm_per_px) / 100.0

    # 4. MEASURE DBH (Using Detectron2)
    # Check Model
    if models.get("perceptree") is None:
        results["warnings"].append("Detectron2 not ready.")
        return results

    # Calculate Global Y for 1.3m Height
    pixel_1m3 = 130.0 / scale_cm_per_px
    dbh_y_global = int(ground_y - pixel_1m3)

    # --- SAFE CROP LOGIC ---
    tx1, ty1, tx2, ty2 = best_tree_box
    
    # Clamp coordinates to image bounds
    tx1 = int(max(0, min(tx1, w_img - 1)))
    ty1 = int(max(0, min(ty1, h_img - 1)))
    tx2 = int(max(tx1 + 1, min(tx2, w_img)))
    ty2 = int(max(ty1 + 1, min(ty2, h_img)))

    crop_w = tx2 - tx1
    crop_h = ty2 - ty1

    # Check minimum size for ResNet/FPN (32px stride)
    if crop_w < 32 or crop_h < 32:
        results["warnings"].append(f"Tree too small/far ({crop_w}x{crop_h}px) for Detectron2.")
        return results

    # *** CRITICAL FIX: Make memory contiguous ***
    tree_crop = np.ascontiguousarray(img[ty1:ty2, tx1:tx2])

    try:
        # INFERENCE
        d2_out = models["perceptree"](tree_crop)
        instances = d2_out["instances"]
        
        if len(instances) == 0:
            results["warnings"].append("Detectron2 found no trunk in the crop.")
            return results

        # Process the best instance (highest score)
        # Note: Detectron2 sorts by score by default
        best_inst = instances[0]
        
        # Calculate Local Y in Crop coordinates
        local_y = dbh_y_global - ty1
        
        final_width_px = 0.0

        if best_inst.has("pred_masks"):
            # Mask is a boolean matrix of shape (H_crop, W_crop)
            mask = best_inst.pred_masks[0].cpu().numpy()
            mask_h, mask_w = mask.shape
            
            # Clamp local_y within mask bounds
            safe_y = int(max(0, min(local_y, mask_h - 1)))
            
            # Take a small slice around the measuring point to handle noise
            slice_half_h = 2 
            y_start = max(0, safe_y - slice_half_h)
            y_end = min(mask_h, safe_y + slice_half_h + 1)
            
            # Extract slice
            mask_slice = mask[y_start:y_end, :] # Shape (h_slice, W)
            
            # Find widths for each row in slice
            widths = []
            for row in mask_slice:
                pixels = np.where(row)[0] # Indices of True values
                if len(pixels) > 0:
                    w = pixels[-1] - pixels[0] + 1 # +1 because width includes both ends
                    widths.append(w)
            
            if widths:
                final_width_px = sum(widths) / len(widths)
                print(f"✅ DBH from Mask: {final_width_px:.2f}px")
            else:
                # Fallback: If slice is empty (gap in mask), use BBox
                print("⚠️ Gap in mask at 1.3m, falling back to BBox.")
                box = best_inst.pred_boxes[0].tensor.cpu().numpy()[0]
                final_width_px = box[2] - box[0]
        else:
             # Fallback: No mask, use BBox
             print("⚠️ No mask output, falling back to BBox.")
             box = best_inst.pred_boxes[0].tensor.cpu().numpy()[0]
             final_width_px = box[2] - box[0]

        results["dbh_cm"] = final_width_px * scale_cm_per_px

    except Exception as e:
        print(f"❌ Detectron2 Error: {e}")
        traceback.print_exc()
        results["warnings"].append(f"Detectron2 failed: {str(e)}")

    return results

# --- ROUTES ---
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    person_box: str = Form(None),
    tree_box: str = Form(None),
    person_height: float = Form(170.0) # Nhận chiều cao người từ Client (mặc định 170cm)
):
    try:
        content = await file.read()
        p_box = json.loads(person_box) if person_box else None
        t_box = json.loads(tree_box) if tree_box else None
        
        # Truyền chiều cao người vào hàm phân tích
        return analyze_image(content, person_height, p_box, t_box)
    except Exception as e:
        print(f"❌ Server Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"status": "ok", "message": "PercepTree API is running."}
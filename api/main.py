import cv2
import numpy as np
from ultralytics import YOLO
import torch
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import io
import json

# --- DETECTRON2 IMPORTS (OPTIONAL) ---
try:
    from detectron2.engine import DefaultPredictor
    from detectron2.config import get_cfg
    from detectron2 import model_zoo
    DETECTRON2_AVAILABLE = True
except ImportError:
    DETECTRON2_AVAILABLE = False
    print("⚠️ Detectron2 không được cài đặt. Tính năng đo đường kính thân cây (DBH) sẽ bị vô hiệu hóa.")

# ================= CẤU HÌNH =================
HUMAN_HEIGHT_CM = 170.0 
# Paths are relative to the project root
PERCEPTREE_MODEL_WEIGHTS = "output/X-101_RGB_60k.pth" 
YOLO_PERSON_MODEL_PATH = 'yolov8n.pt'
YOLO_WORLD_MODEL_PATH = 'inference_pretrained/yolov8s-worldv2.pt'
# ============================================

# Dictionary to hold the loaded models
models: Dict[str, any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models on startup
    print("⏳ Đang khởi tạo và tải các mô hình AI...")
    
    # Check device availability
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"🖥️ Đang chạy trên thiết bị: {device.upper()}")

    # 1. LOAD YOLO (Để tìm người & tính tỷ lệ)
    try:
        # Load model explicitly to the correct device
        models["yolo_person"] = YOLO(YOLO_PERSON_MODEL_PATH)
        models["yolo_person"].to(device) # Force move to device
        # Ultralytics models usually auto-detect, but we can log it
        print(f"✅ Đã tải Model YOLO phát hiện người (trên {models['yolo_person'].device}).")
    except Exception as e:
         print(f"❌ Lỗi tải YOLO Person: {e}")

    # 2. LOAD YOLO WORLD (Để tìm toàn bộ cây)
    try:
        yolo_world = YOLO(YOLO_WORLD_MODEL_PATH)
        yolo_world.set_classes(["tree"])
        models["yolo_tree"] = yolo_world
        models["yolo_tree"].to(device) # Force move to device
        print(f"✅ Đã tải Model YOLO World phát hiện cây (trên {models['yolo_tree'].device}).")
    except Exception as e:
        print(f"❌ Lỗi tải YOLO World: {e}")

    # 3. LOAD PERCEPTREE (DETECTRON2)
    if DETECTRON2_AVAILABLE:
        try:
            cfg = get_cfg()
            cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_X_101_32x8d_FPN_3x.yaml"))
            cfg.MODEL.ROI_HEADS.NUM_CLASSES = 1
            cfg.MODEL.WEIGHTS = PERCEPTREE_MODEL_WEIGHTS
            cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5
            
            # Use GPU if available
            cfg.MODEL.DEVICE = device
            print(f"🚀 Đang sử dụng {device.upper()} cho Detectron2")

            models["perceptree"] = DefaultPredictor(cfg)
            print("✅ Đã tải Model PercepTree (Detectron2).")
        except Exception as e:
            print(f"❌ Lỗi khi tải Model PercepTree: {e}")
            models["perceptree"] = None
    else:
        models["perceptree"] = None
        
    print("✅✅✅ Hệ thống đã sẵn sàng! ✅✅✅")
    yield
    # Clean up models on shutdown
    models.clear()
    print("✅ Đã dọn dẹp mô hình.")


app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def analyze_image(img_bytes: bytes, real_human_height: float, override_person_box: list = None, override_tree_box: list = None) -> dict:
    # Decode the image from bytes
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Không thể đọc file ảnh. Định dạng có thể không hợp lệ.")
    h_img, w_img, _ = img.shape

    # --- Initialize results ---
    results = {
        "tree_height_m": 0.0,
        "dbh_cm": 0.0,
        "boxes": {
            "person": None,
            "tree": None
        },
        "warnings": []
    }

    # --- BƯỚC 1: XÁC ĐỊNH BOX CỦA NGƯỜI ---
    scale_person_box = None
    if override_person_box is not None and len(override_person_box) == 4:
        scale_person_box = np.array(override_person_box, dtype=int)
    elif "yolo_person" in models:
        # Chạy model tìm người
        person_results = models["yolo_person"](img, classes=[0], verbose=False)
        all_people_boxes = [box.xyxy[0].cpu().numpy().astype(int) for r in person_results for box in r.boxes]
        
        best_human_h = 0
        if not all_people_boxes:
            # Default fallback
            best_human_h = h_img / 3
            scale_person_box = np.array([10, h_img - int(best_human_h), 100, h_img], dtype=int)
            results["warnings"].append("Không tìm thấy người. Đang sử dụng hộp giả định.")
        else:
            for p_box in all_people_boxes:
                h = p_box[3] - p_box[1]
                if h > best_human_h:
                    best_human_h = h
                    scale_person_box = p_box

    # --- BƯỚC 2: XÁC ĐỊNH BOX CỦA CÂY ---
    best_full_tree_box = None
    if override_tree_box is not None and len(override_tree_box) == 4:
        best_full_tree_box = np.array(override_tree_box, dtype=int)
    elif "yolo_tree" in models:
        # Chạy model tìm cây
        full_tree_results = models["yolo_tree"].predict(img, verbose=False, conf=0.1)
        best_tree_confidence = -1.0
        for res in full_tree_results:
            for box in res.boxes:
                if box.conf[0] > best_tree_confidence:
                    best_tree_confidence = box.conf[0]
                    best_full_tree_box = box.xyxy[0].cpu().numpy().astype(int)

    # Save found/used boxes to results
    if scale_person_box is not None:
        results["boxes"]["person"] = scale_person_box.tolist()
    if best_full_tree_box is not None:
        results["boxes"]["tree"] = best_full_tree_box.tolist()

    # --- Kiểm tra dữ liệu trước khi tính toán ---
    if best_full_tree_box is None:
        return results

    person_height_px = scale_person_box[3] - scale_person_box[1] if scale_person_box is not None else 0
    if person_height_px == 0:
         return results

    # --- BƯỚC 3: TÍNH TOÁN CHIỀU CAO ---
    ground_y = scale_person_box[3]
    scale_cm_per_px = real_human_height / person_height_px
    results["tree_height_m"] = ((best_full_tree_box[3] - best_full_tree_box[1]) * scale_cm_per_px) / 100.0

    # --- BƯỚC 4: TÌM THÂN CÂY VÀ TÍNH DBH (Dùng OpenCV thay thế Detectron2) ---
    pixel_1m3 = 130.0 / scale_cm_per_px
    dbh_y_global = int(ground_y - pixel_1m3)
    
    # Lấy vùng ảnh quanh độ cao 1.3m (DBH)
    slice_height = 50 # Lấy một lát cắt nhỏ cao 50px
    slice_y1 = max(0, dbh_y_global - slice_height // 2)
    slice_y2 = min(h_img, dbh_y_global + slice_height // 2)
    
    # Giới hạn vùng tìm kiếm theo chiều ngang trong box của cây
    slice_x1 = max(0, best_full_tree_box[0])
    slice_x2 = min(w_img, best_full_tree_box[2])
    
    cropped_slice_img = img[slice_y1:slice_y2, slice_x1:slice_x2]

    if cropped_slice_img.size > 0:
        # 1. Chuyển sang ảnh xám & làm mờ nhẹ
        gray = cv2.cvtColor(cropped_slice_img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # 2. Dùng Canny để tìm biên cạnh
        edges = cv2.Canny(blurred, 50, 150)

        # 3. Tìm các đường bao (contours)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 4. Tìm contour lớn nhất nằm ở giữa ảnh (giả định là thân cây)
        center_x = cropped_slice_img.shape[1] // 2
        best_cnt = None
        max_area = 0
        
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            # Lọc nhiễu: Thân cây phải có chiều cao tương đối so với lát cắt
            if h > slice_height * 0.5: 
                # Ưu tiên contour nằm gần giữa box cây
                dist_to_center = abs((x + w//2) - center_x)
                if dist_to_center < cropped_slice_img.shape[1] * 0.3: # Chỉ lấy trong khoảng 30% giữa
                    if w * h > max_area:
                        max_area = w * h
                        best_cnt = cnt
        
        if best_cnt is not None:
            x, y, w, h = cv2.boundingRect(best_cnt)
            avg_width_px = w # Lấy chiều rộng của hình bao
            
            # Tính ra cm
            if avg_width_px > 0:
                results["dbh_cm"] = avg_width_px * scale_cm_per_px
        else:
             results["warnings"].append("Không tìm thấy thân cây rõ ràng tại vị trí 1.3m.")

    return results

@app.get("/")
async def root():
    return {"message": "Welcome to the PercepTree API."}

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    person_box: str = Form(None),
    tree_box: str = Form(None) 
):
    try:
        img_bytes = await file.read()
        p_box = json.loads(person_box) if person_box else None
        t_box = json.loads(tree_box) if tree_box else None

        analysis_results = analyze_image(
            img_bytes, 
            real_human_height=HUMAN_HEIGHT_CM,
            override_person_box=p_box,
            override_tree_box=t_box
        )
        return analysis_results
    except Exception as e:
        print(f"Error prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích: {str(e)}")
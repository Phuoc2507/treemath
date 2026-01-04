# SỔ TAY VẬN HÀNH HỆ THỐNG AI (YOLO + DETECTRON2)

**Cập nhật lần cuối:** 04/01/2026
**Trạng thái hệ thống:** Đã ổn định (Fixed Errno 22, Node.js Portable integrated).

---

## I. CẤU TRÚC HỆ THỐNG
Hệ thống gồm 3 thành phần chạy song song trên 3 cửa sổ Terminal:
1.  **Backend (Python):** Chạy trí tuệ nhân tạo, xử lý ảnh.
2.  **Tunnel (Ngrok):** Đưa Backend ra Internet để App điện thoại gọi được.
3.  **Frontend (ReactJS):** Giao diện web người dùng.

---

## II. QUY TRÌNH BA CỬA SỔ (THE 3-TERMINAL WORKFLOW)

Để vận hành, hãy mở **3 cửa sổ PowerShell (Terminal)** riêng biệt và làm theo thứ tự.

### 🖥️ CỬA SỔ 1: BACKEND AI (Cốt lõi)

**1. Khởi động:**
```powershell
cd D:\treemath-main\treemath-main
.\venv\Scripts\activate
$env:PIP_CACHE_DIR = "D:\treemath-main\treemath-main\pip_cache_temp"
uvicorn api.main:app --reload --port 8000
```

**2. Dấu hiệu thành công:**
*   Xuất hiện dòng: `✅ Detectron2 (PercepTree) Loaded.`
*   Xuất hiện dòng: `Uvicorn running on http://127.0.0.1:8000`

**3. 🛠️ XỬ LÝ LỖI THƯỜNG GẶP:**
*   **Lỗi: `[Errno 10048] Only one usage of each socket address...`**
    *   *Nguyên nhân:* Port 8000 đang bị chiếm do một cửa sổ Backend khác chưa tắt hẳn.
    *   *Cách sửa:* Tìm và đóng các cửa sổ Terminal cũ. Nếu không được, chạy lệnh: `taskkill /F /IM python.exe` rồi chạy lại từ bước activate.
*   **Lỗi: `UnauthorizedAccess / running scripts is disabled`**
    *   *Nguyên nhân:* Windows chặn chạy script bảo mật.
    *   *Cách sửa:* Chạy lệnh: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` (Chọn Y khi được hỏi), sau đó chạy lại lệnh activate.
*   **Lỗi: `ModuleNotFoundError`**
    *   *Nguyên nhân:* Quên chạy lệnh `.\venv\Scripts\activate`.
*   **Lỗi: `CUDA out of memory`**
    *   *Nguyên nhân:* Hết RAM GPU.
    *   *Cách sửa:* Tắt bớt các ứng dụng chiếm GPU (Game, Chrome tabs nặng) rồi khởi động lại.

---

### 🌐 CỬA SỔ 2: NGROK (Kết nối)

**1. Khởi động:**
```powershell
cd D:\treemath-main\treemath-main
.\ngrok\ngrok.exe http 8000
```

**2. Thao tác bắt buộc:**
*   Copy dòng **Forwarding** (ví dụ: `https://abcd-1234.ngrok-free.app`).
*   **Dán URL mới vào Config của Frontend**: Mở file `src/config/api.ts` (hoặc nơi bạn lưu config API) và cập nhật đường dẫn.

**3. 🛠️ XỬ LÝ LỖI THƯỜNG GẶP:**
*   **Lỗi: `Session duration exceeded` (Sau khoảng 2 tiếng)**
    *   *Nguyên nhân:* Bản Ngrok Free giới hạn thời gian mỗi phiên.
    *   *Cách sửa:* Tắt Ngrok (Ctrl+C) và chạy lại lệnh khởi động. **Lưu ý: URL sẽ thay đổi, phải cập nhật lại Frontend.**
*   **Lỗi: `ERR_NGROK_334 / is already online`**
    *   *Nguyên nhân:* Có một cửa sổ Ngrok khác đang chạy ngầm.
    *   *Cách sửa:* Chạy lệnh `taskkill /F /IM ngrok.exe /T` để đóng tất cả Ngrok cũ, sau đó chạy lại.
*   **Lỗi: `ERR_NGROK_302` hoặc `502 Bad Gateway` khi vào web**
    *   *Nguyên nhân:* Cửa sổ 1 (Backend) chưa bật hoặc bị tắt.
    *   *Cách sửa:* Kiểm tra lại Cửa sổ 1 xem có đang chạy không.

---

### 🎨 CỬA SỔ 3: FRONTEND (Giao diện Web)

**1. Khởi động:**
```powershell
cd D:\treemath-main\treemath-main
# Lệnh này để dùng Node.js có sẵn trong thư mục, không cần cài vào máy
$env:PATH = "D:\treemath-main\treemath-main\node-v18.18.0-win-x64;" + $env:PATH
npm run dev
```

**2. Truy cập:**
*   Mở trình duyệt: `http://localhost:8080` (Xem Terminal để biết port chính xác).

**3. 🛠️ XỬ LÝ LỖI THƯỜNG GẶP:**
*   **Lỗi: `The term 'npm' is not recognized`**
    *   *Nguyên nhân:* Quên chạy lệnh `$env:PATH = ...` trước khi chạy npm. Lệnh này chỉ có tác dụng trong cửa sổ hiện tại.
*   **Lỗi trên Web: `Failed to fetch` hoặc `Network Error`**
    *   *Nguyên nhân:* URL Ngrok trong code Frontend bị cũ, hoặc Ngrok chưa bật.
    *   *Cách sửa:* Xem lại Cửa sổ 2, lấy URL mới và cập nhật vào code Frontend.
*   **Lỗi trên Web: `Server Error 500`**
    *   *Nguyên nhân:* Backend gặp lỗi khi xử lý ảnh.
    *   *Cách sửa:* Quay lại **Cửa sổ 1**, xem log lỗi chi tiết (dòng màu đỏ) để biết tại sao (ví dụ: ảnh quá mờ, không tìm thấy file...).

---

## III. GHI CHÚ KỸ THUẬT (DÀNH CHO DEV)

### Về Mô hình AI
*   **YOLO Person:** Dùng để tham chiếu tỷ lệ (Pixel -> Mét).
*   **YOLO Tree:** Dùng để crop vùng cây sơ bộ.
*   **Detectron2 (ResNext-101):** Dùng để phân đoạn (segment) chính xác thân cây và đo chiều rộng (DBH).
    *   *Lưu ý:* Code đã được tối ưu (`np.ascontiguousarray`) để tránh lỗi bộ nhớ. Không tự ý sửa logic crop ảnh trong `api/main.py`.

### Về Node.js Portable
*   Dự án sử dụng bản Node.js giải nén tại chỗ (`node-v18.18.0-win-x64`) để tránh xung đột với các phiên bản Node khác trên máy.
*   Nếu cần cài thêm thư viện: `$env:PATH = "D:\treemath-main\treemath-main\node-v18.18.0-win-x64;" + $env:PATH; npm install <tên-thư-viện>`.

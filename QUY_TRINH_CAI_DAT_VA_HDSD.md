# NHẬT KÝ CÀI ĐẶT & HƯỚNG DẪN VẬN HÀNH HỆ THỐNG AI (YOLO + DETECTRON2)

**Ngày tạo:** 02/01/2026  
**Môi trường:** Windows 10/11, GPU NVIDIA, Visual Studio 2022.

---

## I. TỔNG HỢP QUÁ TRÌNH KHẮC PHỤC LỖI (TROUBLESHOOTING LOG)

Dưới đây là tóm tắt các vấn đề kỹ thuật đã gặp phải và cách giải quyết để chạy được Detectron2 trên Windows với Visual Studio mới nhất.

### 1. Kích hoạt GPU cho YOLO & PyTorch
*   **Vấn đề:** Mặc định dự án chạy trên CPU, tốc độ xử lý chậm. PyTorch cài sẵn là phiên bản CPU.
*   **Giải pháp:** 
    *   Gỡ bỏ PyTorch cũ.
    *   Cài đặt lại PyTorch hỗ trợ CUDA 12.1:
        ```bash
        pip install torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu121
        ```
    *   Cập nhật code `api/main.py` để ép mô hình dùng thiết bị `cuda`.

### 2. Cài đặt Detectron2 trên Windows (Phần khó nhất)
Detectron2 không hỗ trợ chính thức Windows, yêu cầu tự biên dịch (compile) mã nguồn C++.

*   **Lỗi 1:** `ModuleNotFoundError: No module named 'Cython'`, `invalid command 'bdist_wheel'`.
    *   **Sửa:** Cài thủ công các thư viện build: `pip install Cython wheel`.
*   **Lỗi 2:** Xung đột phiên bản Visual Studio (VS 2022) và CUDA 12.1.
    *   Báo lỗi: `#error: -- unsupported Microsoft Visual Studio version!` trong file `host_config.h`.
    *   **Sửa:** Chỉnh sửa file `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1\include\crt\host_config.h`. Comment out dòng báo lỗi (khoảng dòng 153).
*   **Lỗi 3:** Lỗi thư viện chuẩn C++ (STL).
    *   Báo lỗi: `error STL1002: Unexpected compiler version` trong file `yvals_core.h`.
    *   **Sửa:** Chỉnh sửa file `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\...\include\yvals_core.h`. Comment out dòng `static_assert` hoặc `_EMIT_STL_ERROR`.
*   **Thao tác cài đặt cuối cùng thành công:**
    *   Sử dụng nhánh hỗ trợ Windows của `ivanpp`:
        ```bash
        pip install git+https://github.com/ivanpp/detectron2.git --no-build-isolation
        ```

### 3. Lỗi Runtime sau khi cài đặt
*   **Vấn đề:** `AttributeError: module 'PIL.Image' has no attribute 'LINEAR'`.
*   **Nguyên nhân:** Detectron2 bản cũ không tương thích với Pillow (PIL) bản mới nhất (10.x+).
*   **Giải pháp:** Hạ cấp Pillow:
    ```bash
    pip install pillow==9.5.0
    ```

---

## II. CẤU HÌNH ỔN ĐỊNH HIỆN TẠI

Nếu cần cài lại máy, hãy đảm bảo cài đúng các phiên bản này để tránh xung đột:

*   **Python:** 3.10
*   **CUDA Toolkit:** 12.1 (Mặc định đi theo PyTorch)
*   **PyTorch:** 2.1.0 (cu121)
*   **Detectron2:** 0.6 (biên dịch từ source `ivanpp`)
*   **Pillow:** 9.5.0

---

## III. HƯỚNG DẪN VẬN HÀNH CHUẨN (BEST PRACTICES)

Để hệ thống chạy mượt mà, hãy luôn mở 2 cửa sổ PowerShell (Terminal) riêng biệt.

### Cửa sổ 1: Bật Backend AI (Chạy trên GPU)
Đây là "bộ não" xử lý hình ảnh.

1.  Truy cập thư mục dự án:
    ```powershell
    cd E:\mathstem
    ```
2.  Kích hoạt môi trường ảo:
    ```powershell
    .\venv\Scripts\activate
    ```
3.  Khởi động Server (chế độ reload để tự cập nhật khi sửa code):
    ```powershell
    uvicorn api.main:app --reload --port 8000
    ```
    *Dấu hiệu thành công: Nhìn thấy dòng `✅ Đã tải Model PercepTree (Detectron2)` và `Uvicorn running on http://127.0.0.1:8000`.*

### Cửa sổ 2: Bật Ngrok (Public ra Internet)
Đây là "cánh cổng" để App điện thoại kết nối vào máy tính.

1.  Chạy lệnh:
    ```powershell
    .\ngrok\ngrok-v3-stable-windows-amd64\ngrok.exe http 8000
    ```
2.  **QUAN TRỌNG:** Copy dòng **Forwarding** (có dạng `https://xxxx.ngrok-free.app`) dán vào cấu hình API của App Mobile/Web Frontend.

**Lưu ý:** Mỗi lần tắt ngrok bật lại, địa chỉ URL sẽ thay đổi (trừ khi bạn dùng bản trả phí). Hãy nhớ cập nhật lại URL cho App.

---
---

## PHỤ LỤC: PHÂN TÍCH VÀ BÀI HỌC KINH NGHIỆM TỪ SỰ CỐ CÀI ĐẶT DETECTRON2

Phần này phân tích chi tiết quá trình xử lý sự cố cài đặt `Detectron2` theo các tiêu chí đã nêu, giúp chúng ta rút ra bài học và chuẩn bị tốt hơn cho tương lai.

### 1. Phân tích nguyên nhân gốc (Root Cause Analysis)

Nguyên nhân gốc rễ của toàn bộ quá trình gặp lỗi là **sự xung đột phiên bản phức tạp và đa tầng** giữa các công cụ phát triển cần thiết để biên dịch và chạy `Detectron2` trên môi trường Windows hiện đại. `Detectron2` không chính thức hỗ trợ Windows, buộc chúng ta phải biên dịch từ mã nguồn, điều này đã làm lộ ra các vấn đề sâu sắc:

*   **Xung đột "Catch-22" của Trình biên dịch C++ và CUDA:**
    *   **`CUDA Toolkit 12.1`** (được cài đặt thông qua PyTorch) là phiên bản cũ hơn so với các bản cập nhật gần đây của **`Visual Studio 2022`**. Điều này gây ra lỗi kiểm tra phiên bản trong file `host_config.h` của CUDA.
    *   Đồng thời, **Thư viện chuẩn C++ (STL) của `Visual Studio 2022`** (sau khi đã cập nhật) lại quá mới và yêu cầu `CUDA 12.4` trở lên, gây ra lỗi kiểm tra phiên bản trong file `yvals_core.h` của Visual Studio. Hai thành phần này tạo ra một vòng lặp phụ thuộc không thể tự giải quyết.

*   **Xung đột môi trường Build của `pip`:** Cơ chế "build isolation" mặc định của `pip` khi cài đặt các gói từ mã nguồn đã tạo ra một môi trường build tạm thời "quá sạch", thiếu các công cụ cần thiết như `Cython` và `wheel`, mặc dù chúng đã được cài đặt trong môi trường ảo chính (`venv`).

*   **Xung đột tương thích thư viện Runtime:** Phiên bản `detectron2` mà chúng ta cuối cùng cài đặt được là một phiên bản cũ hơn (v0.5-v0.6) và nó không tương thích với các thay đổi API trong phiên bản mới nhất của thư viện `Pillow` (v10+), đặc biệt là việc đổi tên từ `Image.LINEAR` sang `Image.BILINEAR`.

### 2. Triển khai giải pháp (Solution Implementation)

Chúng ta đã áp dụng một chuỗi các giải pháp cụ thể và có tính chiến lược để vượt qua từng rào cản:

*   **Chuẩn bị môi trường build:**
    *   Cài đặt các gói biên dịch thiết yếu vào môi trường ảo chính: `pip install Cython wheel`.
    *   Hạ cấp và cố định phiên bản PyTorch: Gỡ bỏ `PyTorch 2.5.1` và cài đặt `torch==2.1.0` (cùng các phiên bản `torchvision==0.16.0` và `torchaudio==2.1.0` tương ứng) hỗ trợ CUDA 12.1. Phiên bản này được biết là có tính ổn định và tương thích tốt hơn với các bản build `detectron2` của cộng đồng.

*   **"Vá lỗi" hệ thống (System Patching):** Đây là các can thiệp trực tiếp và thủ công vào các file cấu hình của hệ thống:
    *   **Sửa lỗi CUDA:** Hướng dẫn người dùng chỉnh sửa file `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1\include\crt\host_config.h` để **comment out (vô hiệu hóa)** dòng `#error` kiểm tra phiên bản Visual Studio.
    *   **Sửa lỗi Visual Studio STL:** Hướng dẫn người dùng chỉnh sửa file `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\...\include\yvals_core.h` để **comment out** dòng `_EMIT_STL_ERROR` hoặc `static_assert` kiểm tra phiên bản CUDA.

*   **Thực thi cài đặt `detectron2`:**
    *   Sử dụng lệnh cài đặt từ một nhánh `git` được cộng đồng phát triển để hỗ trợ Windows: `pip install git+https://github.com/ivanpp/detectron2.git`.
    *   Thêm cờ `--no-build-isolation` vào lệnh `pip install` để buộc `pip` sử dụng các gói đã được cài đặt sẵn trong môi trường ảo, thay vì tạo một môi trường build tạm thời không có đầy đủ phụ thuộc.

*   **Khắc phục lỗi runtime:**
    *   Sau khi `detectron2` đã cài đặt, phát hiện lỗi `AttributeError` do xung đột với `Pillow`.
    *   Hạ cấp thư viện `Pillow` về phiên bản tương thích: `pip install Pillow==9.5.0`.

### 3. Kiểm thử hồi quy (Regression Testing)

Chúng ta đã thực hiện kiểm thử sau mỗi giai đoạn triển khai giải pháp để xác nhận lỗi đã được khắc phục và không phát sinh vấn đề mới:

*   **Sau mỗi bước cài đặt phụ thuộc (Cython, wheel):** Kiểm tra bằng cách thử lại lệnh cài đặt `pycocotools`.
*   **Sau khi sửa file hệ thống CUDA và Visual Studio:** Chạy lại lệnh cài đặt `detectron2` và theo dõi quá trình biên dịch để đảm bảo không còn lỗi liên quan đến phiên bản trình biên dịch/CUDA.
*   **Sau khi cài đặt `detectron2` hoàn tất:** Chạy một lệnh Python đơn giản (`python -c "import detectron2"`) để kiểm tra thư viện có thể được nạp vào bộ nhớ mà không gặp lỗi không. Bước này đã giúp phát hiện ra lỗi `Pillow`.
*   **Kiểm thử cuối cùng:** Khởi động server `uvicorn` của FastAPI và quan sát log đầu ra để xác nhận rằng cả `YOLO` và `Detectron2` đều được tải thành công lên `cuda:0` mà không có cảnh báo vô hiệu hóa, chứng tỏ toàn bộ hệ thống AI đã hoạt động đúng như mong đợi.

### 4. Cập nhật tài liệu (Documentation Update)

Việc cập nhật tài liệu đã được thực hiện một cách tỉ mỉ:

*   Tạo mới file `QUY_TRINH_CAI_DAT_VA_HDSD.md` để ghi lại hướng dẫn vận hành chuẩn và cấu hình ổn định.
*   Bổ sung thêm một `PHỤ LỤC` chi tiết vào file này, mô tả lại từng lỗi gặp phải, nguyên nhân gốc rễ, và các giải pháp cụ thể đã áp dụng. Tài liệu này đóng vai trò như một bản ghi "post-mortem" đầy đủ, cung cấp kiến thức và kinh nghiệm quý báu cho việc thiết lập môi trường trong tương lai.

### 5. Giám sát liên tục (Continuous Monitoring)

Các bài học kinh nghiệm và lưu ý cho việc giám sát liên tục để duy trì sự ổn định của môi trường:

*   **Cảnh giác với cập nhật tự động:** Môi trường phát triển trên Windows, đặc biệt với các thư viện AI phụ thuộc vào trình biên dịch C++ và CUDA, rất dễ bị phá vỡ bởi các bản cập nhật tự động của Visual Studio hoặc NVIDIA Driver. Cần hết sức thận trọng khi cập nhật bất kỳ thành phần nào.
*   **Đóng băng (Pin) các phiên bản thư viện:** Bài học quan trọng nhất là phải luôn ghi lại và cố định chính xác phiên bản của tất cả các thư viện đã được kiểm nghiệm là hoạt động ổn định. Để thực hiện điều này, tôi sẽ tạo một file `requirements.txt` mới chứa tất cả các phiên bản đã cố định. Khi cần cài đặt lại môi trường, chỉ cần sử dụng lệnh `pip install -r requirements.txt`.
*   **Ưu tiên môi trường được hỗ trợ chính thức:** Để có sự ổn định lâu dài và ít gặp rắc rối nhất, nên cân nhắc chuyển sang sử dụng các môi trường được hỗ trợ chính thức cho AI/ML như **Windows Subsystem for Linux (WSL2)** hoặc **Docker**. Các môi trường này cung cấp sự cô lập tốt hơn và tuân thủ chặt chẽ hơn với các khuyến nghị cài đặt của các thư viện lớn như PyTorch và Detectron2.

---

Bây giờ tôi sẽ tiến hành cập nhật file `QUY_TRINH_CAI_DAT_VA_HDSD.md` với bản tổng kết đầy đủ này. Sau đó, tôi sẽ thực hiện kế hoạch `PIN DEPENDENCIES` bằng cách tạo file `requirements.txt`.


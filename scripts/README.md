# 🌳 PerceptTree - Script Tự động Cập nhật Ngrok URL

Script này giúp tự động khởi động ngrok và cập nhật URL vào Supabase secret, giúp bạn không cần làm thủ công mỗi lần ngrok restart.

## 📋 Yêu cầu

### 1. Cài đặt ngrok
- Tải từ: https://ngrok.com/download
- Đăng ký tài khoản miễn phí và lấy authtoken
- Cấu hình authtoken:
  ```bash
  ngrok config add-authtoken YOUR_TOKEN
  ```

### 2. Cài đặt Supabase CLI
```bash
npm install -g supabase
```

### 3. Đăng nhập Supabase CLI
```bash
supabase login
```
Lệnh này sẽ mở trình duyệt để bạn đăng nhập vào Supabase.

### 4. (Chỉ Linux/Mac) Cài đặt jq
```bash
# Mac
brew install jq

# Ubuntu/Debian
sudo apt install jq

# Fedora
sudo dnf install jq
```

## 🚀 Cách sử dụng

### Windows (PowerShell)
```powershell
# Mở PowerShell và chạy
.\start-ngrok.ps1
```

### Linux/Mac (Bash)
```bash
# Cấp quyền chạy (chỉ cần 1 lần)
chmod +x start-ngrok.sh

# Chạy script
./start-ngrok.sh
```

## 🔄 Quy trình hoạt động

1. **Tắt ngrok cũ** (nếu có)
2. **Khởi động ngrok** trên cổng 8000
3. **Đợi 5 giây** để ngrok khởi động
4. **Lấy URL HTTPS** từ ngrok API local
5. **Cập nhật secret** `TREE_ANALYSIS_UPSTREAM_URL` trong Supabase

## ⚠️ Lưu ý quan trọng

- **Python API phải đang chạy** trên cổng 8000 trước khi chạy script
- **Chỉ cần chạy script này 1 lần** mỗi khi bạn restart ngrok
- Script sẽ **tự động tắt ngrok cũ** trước khi khởi động mới
- Edge Function sẽ **tự động dùng URL mới** sau khi secret được cập nhật

## 🐛 Xử lý lỗi

### Lỗi "supabase: command not found"
```bash
npm install -g supabase
```

### Lỗi "You must be logged in"
```bash
supabase login
```

### Lỗi "Không tìm thấy URL ngrok"
- Kiểm tra ngrok đã cài đặt và cấu hình authtoken chưa
- Thử chạy `ngrok http 8000` thủ công để xem có lỗi gì không

### Lỗi kết nối ngrok API
- Đảm bảo không có firewall chặn port 4040
- Thử mở `http://127.0.0.1:4040` trong trình duyệt

## 📝 Thông tin kỹ thuật

- **Secret name:** `TREE_ANALYSIS_UPSTREAM_URL`
- **Supabase Project ID:** `vijsarilxqwghzyaygcm`
- **Ngrok local API:** `http://127.0.0.1:4040/api/tunnels`
- **Default port:** 8000

## 🔗 Liên kết hữu ích

- [Ngrok Documentation](https://ngrok.com/docs)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)

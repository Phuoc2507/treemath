# CÁCH KẾT NỐI SUPABASE VỚI MÁY TÍNH CỦA BẠN (QUA NGROK)

Mỗi lần bạn tắt/bật lại Ngrok, URL sẽ thay đổi. Bạn cần cập nhật URL mới này lên Supabase để App trên Lovable hoạt động.

### Cách 1: Dùng Dashboard (Dễ nhất cho người không chuyên)
1.  Truy cập Dashboard dự án Supabase của bạn.
2.  Vào phần **Settings** (bánh răng) -> **Edge Functions**.
3.  Tìm biến môi trường (Secrets) có tên **`PERCEPTREE_API_URL`** (hoặc `BACKEND_URL` tùy lúc setup).
4.  Nhấn Edit và dán URL Ngrok mới vào (Ví dụ: `https://abcd-1234.ngrok-free.app`). **Lưu ý: Không có dấu `/` ở cuối.**
5.  Lưu lại. App sẽ hoạt động ngay lập tức.

### Cách 2: Dùng CLI (Nếu đã cài Supabase CLI)
Chạy lệnh sau trong terminal:
```bash
supabase secrets set PERCEPTREE_API_URL=https://your-new-ngrok-url.ngrok-free.app
```

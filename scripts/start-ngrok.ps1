# Script tự động khởi động ngrok và cập nhật Supabase secret
# Yêu cầu: ngrok, supabase CLI đã được cài đặt và đăng nhập

# Cổng Python API đang chạy
$PORT = 8000

# Tên secret trong Supabase
$SECRET_NAME = "TREE_ANALYSIS_UPSTREAM_URL"

# Supabase Project ID
$PROJECT_REF = "vijsarilxqwghzyaygcm"

Write-Host ""
Write-Host "🌳 PerceptTree - Ngrok Auto-Setup Script" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Kiểm tra ngrok đã cài chưa
try {
    $null = Get-Command ngrok -ErrorAction Stop
} catch {
    Write-Host "❌ ngrok chưa được cài đặt." -ForegroundColor Red
    Write-Host "   Tải từ: https://ngrok.com/download" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra supabase CLI đã cài chưa
try {
    $null = Get-Command supabase -ErrorAction Stop
} catch {
    Write-Host "❌ Supabase CLI chưa được cài đặt." -ForegroundColor Red
    Write-Host "   Chạy: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Tắt ngrok cũ nếu có
Write-Host "🔄 Đang tắt ngrok cũ (nếu có)..." -ForegroundColor Cyan
Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Khởi động ngrok ở background
Write-Host "🚀 Đang khởi động ngrok trên cổng $PORT..." -ForegroundColor Cyan
Start-Process ngrok -ArgumentList "http $PORT" -WindowStyle Hidden

# Đợi ngrok khởi động
Write-Host "⏳ Đợi ngrok khởi động..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Lấy URL từ ngrok local API
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -Method Get -ErrorAction Stop
    $NGROK_URL = ($response.tunnels | Where-Object { $_.proto -eq "https" }).public_url
} catch {
    Write-Host "❌ Không thể kết nối tới ngrok API." -ForegroundColor Red
    Write-Host "   Kiểm tra:" -ForegroundColor Yellow
    Write-Host "   1. ngrok đã chạy chưa?" -ForegroundColor Yellow
    Write-Host "   2. Có lỗi gì trong cửa sổ ngrok không?" -ForegroundColor Yellow
    exit 1
}

if ([string]::IsNullOrEmpty($NGROK_URL)) {
    Write-Host "❌ Không tìm thấy URL ngrok HTTPS." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Ngrok URL: $NGROK_URL" -ForegroundColor Green

# Cập nhật secret trong Supabase
Write-Host "📤 Đang cập nhật secret $SECRET_NAME..." -ForegroundColor Cyan
$result = & supabase secrets set "${SECRET_NAME}=${NGROK_URL}" --project-ref $PROJECT_REF 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "✅ THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "🔗 URL mới: $NGROK_URL" -ForegroundColor Yellow
    Write-Host "🌐 Edge Function sẽ tự động dùng URL mới" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Lỗi khi cập nhật secret:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Hãy chạy 'supabase login' trước rồi thử lại." -ForegroundColor Yellow
}

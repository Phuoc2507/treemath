#!/bin/bash
# Script tự động khởi động ngrok và cập nhật Supabase secret
# Yêu cầu: ngrok, jq, supabase CLI đã được cài đặt và đăng nhập

# Cổng Python API đang chạy
PORT=8000

# Tên secret trong Supabase
SECRET_NAME="TREE_ANALYSIS_UPSTREAM_URL"

# Supabase Project ID
PROJECT_REF="vijsarilxqwghzyaygcm"

echo "🌳 PerceptTree - Ngrok Auto-Setup Script"
echo "========================================="

# Kiểm tra ngrok đã cài chưa
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok chưa được cài đặt. Hãy cài đặt từ https://ngrok.com/download"
    exit 1
fi

# Kiểm tra supabase CLI đã cài chưa
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI chưa được cài đặt. Chạy: npm install -g supabase"
    exit 1
fi

# Kiểm tra jq đã cài chưa
if ! command -v jq &> /dev/null; then
    echo "❌ jq chưa được cài đặt. Cài đặt:"
    echo "   - Mac: brew install jq"
    echo "   - Ubuntu: sudo apt install jq"
    exit 1
fi

# Tắt ngrok cũ nếu có
echo "🔄 Đang tắt ngrok cũ (nếu có)..."
pkill -f ngrok 2>/dev/null
sleep 2

# Khởi động ngrok ở background
echo "🚀 Đang khởi động ngrok trên cổng $PORT..."
ngrok http $PORT > /dev/null &

# Đợi ngrok khởi động
echo "⏳ Đợi ngrok khởi động..."
sleep 5

# Lấy URL từ ngrok local API
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[] | select(.proto=="https") | .public_url')

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" == "null" ]; then
    echo "❌ Không tìm thấy URL ngrok. Kiểm tra:"
    echo "   1. ngrok đã chạy chưa?"
    echo "   2. Có lỗi gì trong terminal ngrok không?"
    exit 1
fi

echo "✅ Ngrok URL: $NGROK_URL"

# Cập nhật secret trong Supabase
echo "📤 Đang cập nhật secret $SECRET_NAME..."
supabase secrets set "$SECRET_NAME=$NGROK_URL" --project-ref "$PROJECT_REF"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ THÀNH CÔNG!"
    echo "🔗 URL mới: $NGROK_URL"
    echo "🌐 Edge Function sẽ tự động dùng URL mới"
    echo "========================================="
else
    echo ""
    echo "❌ Lỗi khi cập nhật secret."
    echo "💡 Hãy chạy 'supabase login' trước rồi thử lại."
fi

import requests
import sys

try:
    # Ngrok cung cấp API local tại cổng 4040 để kiểm tra trạng thái
    response = requests.get("http://127.0.0.1:4040/api/tunnels")
    if response.status_code == 200:
        data = response.json()
        tunnels = data.get("tunnels", [])
        if tunnels:
            print("✅ Ngrok đang CHẠY.")
            for t in tunnels:
                if t.get("proto") == "https":
                    print(f"🔗 Public URL: {t.get('public_url')}")
        else:
            print("⚠️ Ngrok đang chạy nhưng chưa có tunnel nào được mở.")
    else:
        print("⚠️ Không thể kết nối tới API của Ngrok.")
except Exception as e:
    print("❌ Ngrok KHÔNG chạy (hoặc không truy cập được API local).")

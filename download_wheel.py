import requests
import os

# Link tải Wheel Detectron2 cho Windows + Python 3.10 + GPU (được build bởi cộng đồng)
# URL này là url thường dùng, nếu chết tôi sẽ thay url khác
url = "https://github.com/ivanpp/detectron2/releases/download/v0.6/detectron2-0.6-cp310-cp310-win_amd64.whl"
file_name = "detectron2-0.6-cp310-cp310-win_amd64.whl"

print(f"Downloading {url}...")
try:
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(file_name, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"✅ Downloaded {file_name} successfully.")
except Exception as e:
    print(f"❌ Failed to download: {e}")

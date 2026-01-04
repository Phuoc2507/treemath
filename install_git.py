import requests
import zipfile
import io
import os

# Link tải MinGit (bản rất nhẹ của Git cho Windows)
url = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/MinGit-2.43.0-64-bit.zip"
print(f"Downloading MinGit from {url}...")

r = requests.get(url)
z = zipfile.ZipFile(io.BytesIO(r.content))

print("Extracting to MinGit folder...")
# Tạo folder MinGit nếu chưa có
if not os.path.exists("MinGit"):
    os.makedirs("MinGit")

z.extractall("MinGit")

print("✅ MinGit installed to ./MinGit")

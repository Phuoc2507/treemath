import requests
import zipfile
import io
import os

url = "https://nodejs.org/dist/v18.18.0/node-v18.18.0-win-x64.zip"
print(f"Downloading Node.js from {url}...")

r = requests.get(url)
z = zipfile.ZipFile(io.BytesIO(r.content))

print("Extracting...")
z.extractall(".")

# Rename for easier access
if os.path.exists("nodejs"):
    import shutil
    shutil.rmtree("nodejs")

os.rename("node-v18.18.0-win-x64", "nodejs")
print("✅ Node.js installed to ./nodejs")

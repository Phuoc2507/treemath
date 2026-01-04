import requests, zipfile, io, os

# Download CLIP zip
url = "https://github.com/ultralytics/CLIP/archive/refs/heads/main.zip"
print(f"Downloading {url}...")
r = requests.get(url)
z = zipfile.ZipFile(io.BytesIO(r.content))
print("Extracting...")
z.extractall("libs_source_clip")
print("Done. Source is in libs_source_clip/CLIP-main")

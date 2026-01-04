import requests, zipfile, io, os

# Download Detectron2 zip from ivanpp repo
url = "https://github.com/ivanpp/detectron2/archive/master.zip"
print(f"Downloading {url}...")
r = requests.get(url) 
z = zipfile.ZipFile(io.BytesIO(r.content))
print("Extracting...")
z.extractall("libs_source")
print("Done. Source is in libs_source/detectron2-master")

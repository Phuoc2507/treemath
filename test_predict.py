import requests
import os
import sys

# Set output encoding to utf-8 just in case
sys.stdout.reconfigure(encoding='utf-8')

image_path = r"D:\ảnh Tree-lm\Messenger_creation_C8D2BCE4-9108-4CBB-9159-EE91056A0E87.jpeg"
url = "http://127.0.0.1:8000/predict"

print(f"Sending image {os.path.basename(image_path)} to {url}...")

try:
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        print("SUCCESS! JSON Response:")
        print(response.json())
    else:
        print(f"FAILED: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"Error: {e}")

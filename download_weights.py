import requests
import os

url = "https://dl.fbaipublicfiles.com/detectron2/COCO-InstanceSegmentation/mask_rcnn_X_101_32x8d_FPN_3x/139653917/model_final_2d9806.pkl"
output_path = r"D:\treemath-main\treemath-main\output\X-101_RGB_60k.pth"

print(f"Downloading model form {url}...")
r = requests.get(url, stream=True)
with open(output_path, 'wb') as f:
    for chunk in r.iter_content(chunk_size=1024*1024):
        if chunk:
            f.write(chunk)
print(f"Downloaded to {output_path}")

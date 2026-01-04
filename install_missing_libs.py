import requests, zipfile, io, os, subprocess, sys

def install_component(url, name, folder_name):
    print(f"--- Processing {name} ---")
    extract_root = os.path.abspath("temp_install")
    os.makedirs(extract_root, exist_ok=True)
    
    print(f"Downloading {url}...")
    try:
        r = requests.get(url)
        r.raise_for_status()
        z = zipfile.ZipFile(io.BytesIO(r.content))
        z.extractall(extract_root)
        
        # Determine the extracted folder name
        # It usually is repo-branch, e.g., CLIP-main
        extracted_dirs = [d for d in os.listdir(extract_root) if os.path.isdir(os.path.join(extract_root, d)) and name.lower() in d.lower()]
        # Sort by creation time to get the latest if multiple
        extracted_dirs.sort(key=lambda x: os.path.getmtime(os.path.join(extract_root, x)), reverse=True)
        
        if not extracted_dirs:
            print(f"Could not find extracted directory for {name}")
            return False

        target_dir = os.path.join(extract_root, extracted_dirs[0])
        print(f"Installing from {target_dir}...")
        
        # Install
        subprocess.check_call([sys.executable, "-m", "pip", "install", ".", "--no-build-isolation"], cwd=target_dir)
        print(f"Successfully installed {name}")
        return True
    except Exception as e:
        print(f"Failed to install {name}: {e}")
        return False

# 1. CLIP
install_component("https://github.com/ultralytics/CLIP/archive/refs/heads/main.zip", "CLIP", "CLIP-main")

# 2. Detectron2 (ivanpp)
# Note: ivanpp/detectron2/archive/main.zip might be correct
install_component("https://github.com/ivanpp/detectron2/archive/master.zip", "detectron2", "detectron2-master")

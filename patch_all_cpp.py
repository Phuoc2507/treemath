import os

def patch_cpp(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        new_content = content.replace("#if defined(WITH_CUDA) || defined(WITH_HIP)", "#if 0")
        new_content = new_content.replace("#ifdef WITH_CUDA", "#if 0")
        
        # Đặc biệt: Handle trường hợp file vision.cpp gọi extern
        # Trong file .cpp, các hàm cuda thường được gọi trong block if (dets.is_cuda()) { ... }
        # Nếu ta disable define WITH_CUDA, block đó sẽ bị mờ đi (coi như không biên dịch)
        # -> Linker sẽ không tìm hàm đó nữa -> Fix được lỗi Linker
        
        if new_content != content:
            print(f"Patching {filepath}...")
            with open(filepath, 'w') as f:
                f.write(new_content)
        else:
            # print(f"Skipping {filepath}")
            pass
    except Exception as e:
        print(f"Error {filepath}: {e}")

root_dir = r"D:\treemath-main\treemath-main\libs_source\detectron2-master\detectron2\layers\csrc"

print(f"Scanning {root_dir}...")
for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".cpp") or file.endswith(".h"):
            filepath = os.path.join(subdir, file)
            patch_cpp(filepath)

print("Finished patching all sources.")

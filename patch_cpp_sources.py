import os

def patch_cpp(filepath):
    print(f"Patching {filepath}...")
    if not os.path.exists(filepath):
        print("Not found")
        return

    with open(filepath, 'r') as f:
        content = f.read()

    # Disable CUDA calls by undefining WITH_CUDA locally or replacing logic
    # The easiest way is to replace "#if defined(WITH_CUDA) || defined(WITH_HIP)" with "#if 0"
    # This will simulate that CUDA is NOT available during compilation of these files
    
    new_content = content.replace("#if defined(WITH_CUDA) || defined(WITH_HIP)", "#if 0")
    
    # Also handle simpler checks
    new_content = new_content.replace("#ifdef WITH_CUDA", "#if 0")

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print("Patched successfully")
    else:
        print("No changes needed")

base_dir = r"D:\treemath-main\treemath-main\libs_source\detectron2-master\detectron2\layers\csrc"

files_to_patch = [
    os.path.join(base_dir, "nms_rotated", "nms_rotated.cpp"),
    os.path.join(base_dir, "box_iou_rotated", "box_iou_rotated.cpp"),
    os.path.join(base_dir, "ROIAlignRotated", "ROIAlignRotated.cpp"),
    os.path.join(base_dir, "deformable", "deform_conv.cpp"),
    os.path.join(base_dir, "cocoeval", "cocoeval.cpp"), # check if needed
    os.path.join(base_dir, "vision.cpp") # check global macros
]

for fp in files_to_patch:
    patch_cpp(fp)

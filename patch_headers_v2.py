import os

def patch_file(filepath, target_string):
    print(f"Checking {filepath}...")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        
        modified = False
        new_lines = []
        for line in lines:
            # Check if line contains the target string
            if target_string in line:
                # Check if it is already commented out
                if line.strip().startswith("//") or line.strip().startswith("/*"):
                    print(f"Line already patched: {line.strip()[:50]}...")
                    new_lines.append(line)
                else:
                    print(f"Patching line: {line.strip()[:50]}...")
                    new_lines.append(f"// {line}") # Comment out the line
                    modified = True
            else:
                new_lines.append(line)
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            print(f"Successfully patched {filepath}")
        else:
            print(f"Nothing to patch in {filepath}")

    except Exception as e:
        print(f"Error patching {filepath}: {e}")

# Patch 1: CUDA host_config.h
cuda_path = r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1\include\crt\host_config.h"
# Accurate string from file view
patch_file(cuda_path, "#error -- unsupported Microsoft Visual Studio version!")

# Patch 2: Visual Studio yvals_core.h
vs_path = r"C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Tools\MSVC\14.50.35717\include\yvals_core.h"
# Patch for STL error
patch_file(vs_path, "STL1002: Unexpected compiler version")

$ErrorActionPreference = "Stop"

# --- CẤU HÌNH QUAN TRỌNG: CHUYỂN CACHE SANG Ổ D ---
# Tạo thư mục cache trên ổ D để không làm đầy ổ C
$cacheDir = "$PSScriptRoot\pip_cache_temp"
if (-not (Test-Path $cacheDir)) { New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null }
$env:PIP_CACHE_DIR = $cacheDir

Write-Host "STARTING SETUP (Cache moved to: $cacheDir)..." -ForegroundColor Cyan

# 1. FIND PYTHON 3.10
try {
    $check = py -3.10 --version 2>&1
    Write-Host "Using: $check" -ForegroundColor Green
}
catch {
    Write-Error "Python 3.10 not found. Please install it."
    exit 1
}

# 2. RECREATE VENV (Clean slate)
if (Test-Path "venv") {
    Write-Host "Removing old venv..."
    Remove-Item -Path "venv" -Recurse -Force
}

Write-Host "Creating new venv..."
py -3.10 -m venv venv
if ($LASTEXITCODE -ne 0) { throw "Failed to create venv." }

$pip = ".\venv\Scripts\pip.exe"

# 3. UPGRADE PIP
Write-Host "Upgrading pip..."
& $pip install --upgrade pip setuptools wheel Cython

# 4. INSTALL TORCH (Heavy file -> Will now use D: drive for caching)
Write-Host "Installing PyTorch 2.1.0 (CUDA 12.1)..."
Write-Host "Downloading large file (>2GB), please wait..."
& $pip install torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cu121

# 5. INSTALL REQUIREMENTS
Write-Host "Installing requirements..."
& $pip install fastapi uvicorn python-multipart opencv-python ultralytics
try {
    & $pip install -r requirements.txt
}
catch {
    Write-Warning "Some git-based packages failed. Continuing..."
}

# 6. DETECTRON2
Write-Host "Attempting Detectron2 install..."
if (-not (& $pip show detectron2)) {
    try {
        & $pip install git+https://github.com/ivanpp/detectron2.git --no-build-isolation
    }
    catch {
        Write-Warning "Detectron2 skipped."
    }
}

# 7. NGROK
if (-not (Test-Path "ngrok\ngrok.exe")) {
    Write-Host "Checking Ngrok..."
    $url = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    Invoke-WebRequest -Uri $url -OutFile "ngrok.zip"
    Expand-Archive "ngrok.zip" -DestinationPath "ngrok" -Force
    Remove-Item "ngrok.zip"
}

# CLEANUP CACHE
Write-Host "Cleaning up temp cache on D:..."
Remove-Item -Path $cacheDir -Recurse -Force

Write-Host "SETUP COMPLETE!" -ForegroundColor Cyan
Write-Host "Run these commands in two separate terminals:"
Write-Host "1: .\venv\Scripts\activate; uvicorn api.main:app --reload --port 8000"
Write-Host "2: .\ngrok\ngrok.exe http 8000"

@echo off
set /p REPO_URL="Nhap Link GitHub cua ban (Vi du: https://github.com/user/repo.git): "

echo --- Configuring Remote ---
set PATH=%~dp0MinGit\cmd;%PATH%

git remote add origin %REPO_URL%
git branch -M main

echo --- Pushing Code ---
git push -u origin main

pause

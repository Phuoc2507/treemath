@echo off
echo --- Git Push Automation ---

echo 0. Setting up Portable Git...
set PATH=%~dp0MinGit\cmd;%PATH%
git --version

echo 1. Initializing if needed...
if not exist .git (
    echo Initializing new Git repo...
    git init
    echo Please create a new repository on GitHub.com and then run:
    echo git remote add origin ^<YOUR_REPO_URL^>
)

echo 2. Checking Status...
git status

echo 3. Adding all files...
git add .

echo 4. Committing changes...
git commit -m "Initial Commit: Complete AI System with Backend, Node.js Frontend, and Docs"

echo 5. Pushing (Only works if remote is configured)...
git push -u origin main

echo --- Done! ---
pause

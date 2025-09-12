@echo off
REM QuantTrade Platform - GitHub Deployment Script for Windows

echo 🚀 Starting deployment to GitHub...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Initialize git if not already done
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
    git branch -M main
)

REM Configure git user (replace with your details)
echo 👤 Configuring git user...
git config user.name "Technifies"
git config user.email "technifies@example.com"

REM Add all files
echo 📁 Staging all files...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "Complete QuantTrade Platform v4 - React frontend, Node.js backend, Python Backtrader service, Real-time WebSocket, Risk management, Dhan API integration, Complete deployment configuration"

REM Add remote origin
echo 🔗 Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/Technifies/QuantTradePlatform-v4.git

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo ✅ Successfully deployed to GitHub!
    echo 🌐 Repository: https://github.com/Technifies/QuantTradePlatform-v4
) else (
    echo ❌ Push failed. You may need to:
    echo 1. Create the repository on GitHub first
    echo 2. Set up SSH keys or use personal access token
    echo 3. Check your internet connection
)

echo 🎉 Deployment script complete!
pause
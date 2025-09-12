@echo off
REM Quantitative Trading Platform - Git Deployment Script for Windows

echo 🚀 Starting deployment to GitHub...

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
)

REM Add remote origin
echo 🔗 Adding GitHub remote...
git remote add origin https://github.com/Technifies/QuantTradingBolt-v2.git 2>nul

REM Stage all files
echo 📁 Staging all files...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "Initial project setup with complete quantitative trading platform"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -u origin main

echo ✅ Successfully deployed to GitHub!
echo 🌐 Repository: https://github.com/Technifies/QuantTradingBolt-v2
echo 🎉 Deployment complete!

pause
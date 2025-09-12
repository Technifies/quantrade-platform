#!/bin/bash

# QuantTrade Platform - GitHub Deployment Script
echo "🚀 Starting deployment to GitHub..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -M main
fi

# Configure git user (replace with your details)
echo "👤 Configuring git user..."
git config user.name "Technifies"
git config user.email "technifies@example.com"

# Add all files
echo "📁 Staging all files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "Complete QuantTrade Platform v4

    🚀 Features:
    - React 18 frontend with TypeScript and Tailwind CSS
    - Node.js backend with Express and PostgreSQL
    - Python Backtrader service for backtesting
    - Real-time WebSocket communication
    - Comprehensive risk management system
    - Dhan API integration for live trading
    - Complete deployment configuration
    - Comprehensive documentation

    📊 Components:
    - Authentication system with JWT
    - Strategy builder and backtesting
    - Live trading with signal generation
    - Portfolio and risk management
    - Real-time market data integration
    - Responsive UI with modern design

    🛠️ Tech Stack:
    - Frontend: React, TypeScript, Tailwind CSS
    - Backend: Node.js, Express, PostgreSQL
    - Python: FastAPI, Backtrader
    - Deployment: Render, Netlify ready"
fi

# Add remote origin (you may need to change this URL)
echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Technifies/QuantTradePlatform-v4.git

# Try to push
echo "🚀 Pushing to GitHub..."
if git push -u origin main; then
    echo "✅ Successfully deployed to GitHub!"
    echo "🌐 Repository: https://github.com/Technifies/QuantTradePlatform-v4"
else
    echo "❌ Push failed. You may need to:"
    echo "1. Create the repository on GitHub first"
    echo "2. Set up SSH keys or use personal access token"
    echo "3. Check your internet connection"
    echo ""
    echo "🔑 For SSH setup:"
    echo "ssh-keygen -t ed25519 -C 'technifies@example.com'"
    echo "eval \"\$(ssh-agent -s)\""
    echo "ssh-add ~/.ssh/id_ed25519"
    echo "cat ~/.ssh/id_ed25519.pub  # Copy this to GitHub"
    echo "git remote set-url origin git@github.com:Technifies/QuantTradePlatform-v4.git"
    echo "git push -u origin main"
fi

echo "🎉 Deployment script complete!"
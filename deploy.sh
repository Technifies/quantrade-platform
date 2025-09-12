#!/bin/bash

# Quantitative Trading Platform - Git Deployment Script
echo "🚀 Starting deployment to GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add remote origin if it doesn't exist
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/Technifies/QuantTradingBolt-v2.git
fi

# Stage all files
echo "📁 Staging all files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "Initial project setup with complete quantitative trading platform

    Features:
    - Complete React frontend with TypeScript
    - Node.js backend with Express and PostgreSQL
    - Python Backtrader service for backtesting
    - Real-time WebSocket communication
    - Comprehensive risk management system
    - Dhan API integration for live trading
    - Complete deployment configuration
    - Comprehensive documentation"

    # Push to GitHub
    echo "🚀 Pushing to GitHub..."
    git push -u origin main

    echo "✅ Successfully deployed to GitHub!"
    echo "🌐 Repository: https://github.com/Technifies/QuantTradingBolt-v2"
fi

echo "🎉 Deployment complete!"
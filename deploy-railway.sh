#!/bin/bash

# =============================================================================
# RAILWAY DEPLOYMENT SCRIPT
# =============================================================================
# Run this script to deploy to Railway via CLI
# Install Railway CLI first: npm i -g @railway/cli

set -e

echo "🚀 Starting Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI not found!"
    echo "📦 Install it with: npm i -g @railway/cli"
    exit 1
fi

# Login check
echo "🔐 Checking Railway authentication..."
railway whoami || {
    echo "⚠️  Not logged in. Running login..."
    railway login
}

# Link to project (if not already linked)
if [ ! -f "railway.json" ]; then
    echo "🔗 Linking to Railway project..."
    railway link
fi

# Show current environment
echo "📊 Current Railway environment:"
railway status

# Deploy
echo "🚢 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment initiated!"
echo "📊 Check status: railway status"
echo "📝 View logs: railway logs"
echo "🌐 Open app: railway open"

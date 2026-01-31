#!/bin/bash

# DerDieDas File Upload Service Startup Script

echo "🚀 Starting DerDieDas File Upload Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Start the server
echo "✅ Starting server on http://localhost:8000"
echo "📖 API docs: http://localhost:8000/docs"
echo ""
python main.py

#!/bin/bash
# Start Python AI Service

echo "Starting KYC AI Scoring Service..."

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Start service
echo "Starting service on port 8001..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload


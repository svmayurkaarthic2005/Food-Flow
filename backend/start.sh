#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Start the server
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📚 API docs available at http://localhost:8000/docs"
uvicorn main:app --reload --port 8000 --host 0.0.0.0

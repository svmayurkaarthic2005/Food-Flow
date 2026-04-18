@echo off
echo Starting FastAPI server...

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start the server
echo Server starting on http://localhost:8000
echo API docs available at http://localhost:8000/docs
uvicorn main:app --reload --port 8000 --host 0.0.0.0

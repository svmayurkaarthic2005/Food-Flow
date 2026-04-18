@echo off
echo Setting up FastAPI Backend...

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Generate Prisma client
echo Generating Prisma client...
prisma generate

REM Copy env file
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo Please update .env with your configuration
)

echo Setup complete!
echo.
echo To start the server:
echo   venv\Scripts\activate
echo   uvicorn main:app --reload --port 8000

pause

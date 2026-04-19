@echo off
echo ========================================
echo Fixing Driver Signup Issue
echo ========================================
echo.

cd frontend

echo Step 1: Stopping any running processes...
echo Please stop your dev server (Ctrl+C) if it's running
pause

echo.
echo Step 2: Pushing schema to database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo Error pushing schema to database
    pause
    exit /b 1
)

echo.
echo Step 3: Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Error generating Prisma client
    pause
    exit /b 1
)

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Now you can:
echo 1. Start your dev server: npm run dev
echo 2. Go to http://localhost:3000/signup
echo 3. Select "Delivery Driver"
echo 4. Create your account
echo.
pause

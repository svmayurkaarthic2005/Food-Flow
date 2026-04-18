@echo off
REM ML Tests Runner Script (Windows)
REM Runs all ML tests with coverage reporting

echo 🧪 Running ML Tests...
echo =======================

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Run all tests
echo.
echo 📦 Running all ML tests...
pytest tests/ml/ -v

REM Run with coverage
echo.
echo 📊 Running tests with coverage...
pytest tests/ml/ --cov=app/ml --cov-report=term-missing --cov-report=html

REM Run specific test files
echo.
echo 🎯 Test Summary:
echo ----------------
pytest tests/ml/test_recommender.py -v --tb=line
pytest tests/ml/test_spoilage_scorer.py -v --tb=line
pytest tests/ml/test_trust_scorer.py -v --tb=line
pytest tests/ml/test_recommendation_api.py -v --tb=line

REM Generate coverage report
echo.
echo 📈 Coverage Report:
echo -------------------
pytest tests/ml/ --cov=app/ml --cov-report=term

echo.
echo ✅ Tests complete! Coverage report available in htmlcov/index.html
pause

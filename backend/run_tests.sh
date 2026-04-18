#!/bin/bash
# ML Tests Runner Script
# Runs all ML tests with coverage reporting

echo "🧪 Running ML Tests..."
echo "======================="

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run all tests
echo ""
echo "📦 Running all ML tests..."
pytest tests/ml/ -v

# Run with coverage
echo ""
echo "📊 Running tests with coverage..."
pytest tests/ml/ --cov=app/ml --cov-report=term-missing --cov-report=html

# Run specific test files
echo ""
echo "🎯 Test Summary:"
echo "----------------"
pytest tests/ml/test_recommender.py -v --tb=line
pytest tests/ml/test_spoilage_scorer.py -v --tb=line
pytest tests/ml/test_trust_scorer.py -v --tb=line
pytest tests/ml/test_recommendation_api.py -v --tb=line

# Generate coverage report
echo ""
echo "📈 Coverage Report:"
echo "-------------------"
pytest tests/ml/ --cov=app/ml --cov-report=term

echo ""
echo "✅ Tests complete! Coverage report available in htmlcov/index.html"

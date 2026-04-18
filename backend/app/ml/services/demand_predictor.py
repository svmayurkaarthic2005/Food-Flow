"""
Demand Predictor
Forecasts food demand by district and category using Linear Regression
"""

import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import List, Optional, Tuple
from pathlib import Path

from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from prisma import Prisma

from app.ml.schemas.ml_schemas import DemandForecast


# Model paths
MODEL_DIR = Path(__file__).parent.parent / "models"
MODEL_PATH = MODEL_DIR / "demand_regressor.pkl"
ENCODER_PATH = MODEL_DIR / "demand_encoders.pkl"


def ensure_model_dir():
    """Ensure model directory exists."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


async def fetch_training_data(db: Prisma, days_back: int = 90) -> pd.DataFrame:
    """
    Fetch historical claims data for training.
    
    Args:
        db: Prisma client instance
        days_back: Number of days to look back
        
    Returns:
        DataFrame with columns: district, category, day_of_week, claim_count
    """
    cutoff_date = datetime.now() - timedelta(days=days_back)
    
    # Fetch claims with listing data
    claims = await db.claim.find_many(
        where={
            'claimedAt': {
                'gte': cutoff_date
            }
        },
        include={
            'listing': True
        }
    )
    
    if not claims:
        return pd.DataFrame(columns=['district', 'category', 'day_of_week', 'claim_count'])
    
    # Convert to DataFrame
    data = []
    for claim in claims:
        if claim.listing:
            data.append({
                'district': claim.listing.district,
                'category': claim.listing.category,
                'claimed_at': claim.claimedAt,
                'day_of_week': claim.claimedAt.weekday()  # 0=Monday, 6=Sunday
            })
    
    df = pd.DataFrame(data)
    
    if df.empty:
        return pd.DataFrame(columns=['district', 'category', 'day_of_week', 'claim_count'])
    
    # Group by district, category, day_of_week and count claims
    grouped = df.groupby(['district', 'category', 'day_of_week']).size().reset_index(name='claim_count')
    
    return grouped


def train_demand_model(df: pd.DataFrame) -> Tuple[LinearRegression, dict, float]:
    """
    Train Linear Regression model for demand prediction.
    
    Args:
        df: Training data with columns: district, category, day_of_week, claim_count
        
    Returns:
        Tuple of (model, encoders_dict, residual_std)
    """
    if df.empty or len(df) < 10:
        raise ValueError("Insufficient training data (need at least 10 samples)")
    
    # Encode categorical variables
    district_encoder = LabelEncoder()
    category_encoder = LabelEncoder()
    
    df['district_encoded'] = district_encoder.fit_transform(df['district'])
    df['category_encoded'] = category_encoder.fit_transform(df['category'])
    
    # Prepare features and target
    X = df[['district_encoded', 'category_encoded', 'day_of_week']].values
    y = df['claim_count'].values
    
    # Train model
    model = LinearRegression()
    model.fit(X, y)
    
    # Calculate residual standard deviation for confidence intervals
    predictions = model.predict(X)
    residuals = y - predictions
    residual_std = np.std(residuals)
    
    # Store encoders
    encoders = {
        'district': district_encoder,
        'category': category_encoder
    }
    
    return model, encoders, residual_std


def save_model(model: LinearRegression, encoders: dict, residual_std: float):
    """
    Save trained model and encoders to disk.
    
    Args:
        model: Trained LinearRegression model
        encoders: Dictionary of LabelEncoders
        residual_std: Residual standard deviation
    """
    ensure_model_dir()
    
    # Save model
    joblib.dump(model, MODEL_PATH)
    
    # Save encoders and residual_std
    joblib.dump({
        'encoders': encoders,
        'residual_std': residual_std
    }, ENCODER_PATH)


def load_model() -> Tuple[Optional[LinearRegression], Optional[dict], Optional[float]]:
    """
    Load trained model and encoders from disk.
    
    Returns:
        Tuple of (model, encoders_dict, residual_std) or (None, None, None) if not found
    """
    if not MODEL_PATH.exists() or not ENCODER_PATH.exists():
        return None, None, None
    
    try:
        model = joblib.load(MODEL_PATH)
        encoder_data = joblib.load(ENCODER_PATH)
        encoders = encoder_data['encoders']
        residual_std = encoder_data['residual_std']
        return model, encoders, residual_std
    except Exception as e:
        print(f"Error loading model: {e}")
        return None, None, None


async def train_or_load_model(db: Prisma, force_retrain: bool = False) -> Tuple[LinearRegression, dict, float]:
    """
    Load existing model or train new one if not found.
    
    Args:
        db: Prisma client instance
        force_retrain: Force retraining even if model exists
        
    Returns:
        Tuple of (model, encoders_dict, residual_std)
    """
    # Try to load existing model
    if not force_retrain:
        model, encoders, residual_std = load_model()
        if model is not None:
            return model, encoders, residual_std
    
    # Train new model
    print("Training new demand prediction model...")
    df = await fetch_training_data(db)
    
    if df.empty or len(df) < 10:
        raise ValueError("Insufficient historical data to train model (need at least 10 samples)")
    
    model, encoders, residual_std = train_demand_model(df)
    save_model(model, encoders, residual_std)
    
    print(f"Model trained successfully with {len(df)} samples")
    return model, encoders, residual_std


async def predict_demand(
    district: str,
    category: str,
    db: Prisma,
    days_ahead: int = 7
) -> List[DemandForecast]:
    """
    Predict demand for a district and category over the next N days.
    
    Args:
        district: District name
        category: Food category
        db: Prisma client instance
        days_ahead: Number of days to forecast
        
    Returns:
        List of DemandForecast objects with predictions and confidence intervals
    """
    # Load or train model
    try:
        model, encoders, residual_std = await train_or_load_model(db)
    except ValueError as e:
        # Return empty forecasts if insufficient data
        print(f"Cannot predict demand: {e}")
        return []
    
    # Check if district and category are in training data
    district_encoder = encoders['district']
    category_encoder = encoders['category']
    
    try:
        district_encoded = district_encoder.transform([district])[0]
        category_encoded = category_encoder.transform([category])[0]
    except ValueError:
        # District or category not in training data
        print(f"District '{district}' or category '{category}' not in training data")
        return []
    
    # Generate predictions for next N days
    forecasts = []
    today = date.today()
    
    # Confidence interval multiplier (90% confidence = 1.645 * std)
    ci_multiplier = 1.645
    
    for day_offset in range(days_ahead):
        forecast_date = today + timedelta(days=day_offset)
        day_of_week = forecast_date.weekday()
        
        # Prepare features
        X = np.array([[district_encoded, category_encoded, day_of_week]])
        
        # Predict
        predicted_demand = model.predict(X)[0]
        
        # Ensure non-negative
        predicted_demand = max(0, predicted_demand)
        
        # Calculate confidence intervals
        margin = ci_multiplier * residual_std
        low_ci = max(0, predicted_demand - margin)
        high_ci = predicted_demand + margin
        
        forecasts.append(DemandForecast(
            date=forecast_date,
            category=category,
            predicted=int(round(predicted_demand)),
            low=int(round(low_ci)),
            high=int(round(high_ci))
        ))
    
    return forecasts


async def retrain_model(db: Prisma) -> dict:
    """
    Force retrain the demand prediction model.
    
    Args:
        db: Prisma client instance
        
    Returns:
        Dictionary with training statistics
    """
    try:
        df = await fetch_training_data(db)
        
        if df.empty or len(df) < 10:
            return {
                "success": False,
                "message": "Insufficient training data",
                "samples": len(df)
            }
        
        model, encoders, residual_std = train_demand_model(df)
        save_model(model, encoders, residual_std)
        
        return {
            "success": True,
            "message": "Model retrained successfully",
            "samples": len(df),
            "residual_std": float(residual_std)
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Training failed: {str(e)}",
            "samples": 0
        }

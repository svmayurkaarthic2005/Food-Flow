"""
Unit Tests for Nightly Background Jobs
Tests job execution, error handling, and logging
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from backend.app.jobs.nightly import (
    refresh_demand_forecasts,
    refresh_trust_scores,
    run_nightly_jobs,
    scheduler
)


# ============================================================================
# REFRESH DEMAND FORECASTS TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_refresh_demand_forecasts_success():
    """Test successful demand forecast refresh."""
    mock_db = Mock()
    
    # Mock retrain_model
    with patch('backend.app.jobs.nightly.retrain_model') as mock_retrain:
        mock_retrain.return_value = {
            "success": True,
            "samples": 100,
            "message": "Success"
        }
        
        # Mock find_many for listings
        mock_db.foodlisting.find_many = AsyncMock(return_value=[
            Mock(district="Downtown", category="Bakery"),
            Mock(district="Downtown", category="Dairy")
        ])
        
        # Mock predict_demand
        with patch('backend.app.jobs.nightly.predict_demand') as mock_predict:
            mock_forecast = Mock()
            mock_forecast.date = datetime.now().date()
            mock_forecast.predicted = 25
            mock_forecast.low = 18
            mock_forecast.high = 32
            
            mock_predict.return_value = [mock_forecast]
            
            # Mock upsert
            mock_db.demandforecast.upsert = AsyncMock(return_value=Mock())
            
            # Run refresh
            result = await refresh_demand_forecasts(mock_db)
            
            # Assertions
            assert result["success"] is True
            assert result["rows_written"] > 0
            assert "duration_ms" in result


@pytest.mark.asyncio
async def test_refresh_demand_forecasts_retrain_failure():
    """Test demand forecast refresh when model retraining fails."""
    mock_db = Mock()
    
    # Mock retrain_model failure
    with patch('backend.app.jobs.nightly.retrain_model') as mock_retrain:
        mock_retrain.return_value = {
            "success": False,
            "message": "Insufficient training data",
            "samples": 5
        }
        
        # Run refresh
        result = await refresh_demand_forecasts(mock_db)
        
        # Assertions
        assert result["success"] is False
        assert result["rows_written"] == 0
        assert "error" in result


@pytest.mark.asyncio
async def test_refresh_demand_forecasts_partial_failure():
    """Test demand forecast refresh with partial failures."""
    mock_db = Mock()
    
    # Mock retrain_model success
    with patch('backend.app.jobs.nightly.retrain_model') as mock_retrain:
        mock_retrain.return_value = {
            "success": True,
            "samples": 100
        }
        
        # Mock find_many for listings
        mock_db.foodlisting.find_many = AsyncMock(return_value=[
            Mock(district="Downtown", category="Bakery"),
            Mock(district="Uptown", category="Dairy")
        ])
        
        # Mock predict_demand - one succeeds, one fails
        with patch('backend.app.jobs.nightly.predict_demand') as mock_predict:
            def predict_side_effect(district, category, db, days_ahead):
                if district == "Downtown":
                    mock_forecast = Mock()
                    mock_forecast.date = datetime.now().date()
                    mock_forecast.predicted = 25
                    mock_forecast.low = 18
                    mock_forecast.high = 32
                    return [mock_forecast]
                else:
                    raise Exception("Prediction failed")
            
            mock_predict.side_effect = predict_side_effect
            
            # Mock upsert
            mock_db.demandforecast.upsert = AsyncMock(return_value=Mock())
            
            # Run refresh
            result = await refresh_demand_forecasts(mock_db)
            
            # Assertions
            assert result["success"] is True
            assert result["rows_written"] > 0
            assert result["errors"] is not None


# ============================================================================
# REFRESH TRUST SCORES TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_refresh_trust_scores_success():
    """Test successful trust score refresh."""
    mock_db = Mock()
    
    # Mock batch_update_trust_scores
    with patch('backend.app.jobs.nightly.batch_update_trust_scores') as mock_batch:
        mock_batch.return_value = {
            "total": 10,
            "updated": 10,
            "skipped": 0
        }
        
        # Run refresh
        result = await refresh_trust_scores(mock_db)
        
        # Assertions
        assert result["success"] is True
        assert result["rows_written"] == 10
        assert result["total"] == 10
        assert result["skipped"] == 0
        assert "duration_ms" in result


@pytest.mark.asyncio
async def test_refresh_trust_scores_partial_failure():
    """Test trust score refresh with some failures."""
    mock_db = Mock()
    
    # Mock batch_update_trust_scores with some skipped
    with patch('backend.app.jobs.nightly.batch_update_trust_scores') as mock_batch:
        mock_batch.return_value = {
            "total": 10,
            "updated": 8,
            "skipped": 2
        }
        
        # Run refresh
        result = await refresh_trust_scores(mock_db)
        
        # Assertions
        assert result["success"] is True
        assert result["rows_written"] == 8
        assert result["skipped"] == 2


@pytest.mark.asyncio
async def test_refresh_trust_scores_failure():
    """Test trust score refresh failure."""
    mock_db = Mock()
    
    # Mock batch_update_trust_scores failure
    with patch('backend.app.jobs.nightly.batch_update_trust_scores') as mock_batch:
        mock_batch.side_effect = Exception("Database error")
        
        # Run refresh
        result = await refresh_trust_scores(mock_db)
        
        # Assertions
        assert result["success"] is False
        assert result["rows_written"] == 0
        assert "error" in result


# ============================================================================
# RUN NIGHTLY JOBS TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_run_nightly_jobs_success():
    """Test successful nightly job execution."""
    # Mock Prisma
    with patch('backend.app.jobs.nightly.Prisma') as mock_prisma_class:
        mock_db = Mock()
        mock_db.connect = AsyncMock()
        mock_db.disconnect = AsyncMock()
        mock_prisma_class.return_value = mock_db
        
        # Mock refresh functions
        with patch('backend.app.jobs.nightly.refresh_demand_forecasts') as mock_demand:
            with patch('backend.app.jobs.nightly.refresh_trust_scores') as mock_trust:
                mock_demand.return_value = {
                    "success": True,
                    "rows_written": 50,
                    "duration_ms": 1000
                }
                
                mock_trust.return_value = {
                    "success": True,
                    "rows_written": 10,
                    "duration_ms": 500
                }
                
                # Run job
                result = await run_nightly_jobs()
                
                # Assertions
                assert result["event"] == "nightly_job"
                assert result["status"] == "success"
                assert result["demand_rows"] == 50
                assert result["trust_rows"] == 10
                assert "duration_ms" in result
                assert "errors" not in result


@pytest.mark.asyncio
async def test_run_nightly_jobs_partial_failure():
    """Test nightly job with one task failing."""
    # Mock Prisma
    with patch('backend.app.jobs.nightly.Prisma') as mock_prisma_class:
        mock_db = Mock()
        mock_db.connect = AsyncMock()
        mock_db.disconnect = AsyncMock()
        mock_prisma_class.return_value = mock_db
        
        # Mock refresh functions - demand fails, trust succeeds
        with patch('backend.app.jobs.nightly.refresh_demand_forecasts') as mock_demand:
            with patch('backend.app.jobs.nightly.refresh_trust_scores') as mock_trust:
                mock_demand.return_value = {
                    "success": False,
                    "rows_written": 0,
                    "duration_ms": 100,
                    "error": "Model training failed"
                }
                
                mock_trust.return_value = {
                    "success": True,
                    "rows_written": 10,
                    "duration_ms": 500
                }
                
                # Run job
                result = await run_nightly_jobs()
                
                # Assertions
                assert result["event"] == "nightly_job"
                assert result["status"] == "failed"
                assert result["demand_rows"] == 0
                assert result["trust_rows"] == 10
                assert "errors" in result
                assert len(result["errors"]) > 0


@pytest.mark.asyncio
async def test_run_nightly_jobs_both_fail():
    """Test nightly job with both tasks failing."""
    # Mock Prisma
    with patch('backend.app.jobs.nightly.Prisma') as mock_prisma_class:
        mock_db = Mock()
        mock_db.connect = AsyncMock()
        mock_db.disconnect = AsyncMock()
        mock_prisma_class.return_value = mock_db
        
        # Mock refresh functions - both fail
        with patch('backend.app.jobs.nightly.refresh_demand_forecasts') as mock_demand:
            with patch('backend.app.jobs.nightly.refresh_trust_scores') as mock_trust:
                mock_demand.return_value = {
                    "success": False,
                    "rows_written": 0,
                    "duration_ms": 100,
                    "error": "Demand error"
                }
                
                mock_trust.return_value = {
                    "success": False,
                    "rows_written": 0,
                    "duration_ms": 100,
                    "error": "Trust error"
                }
                
                # Run job
                result = await run_nightly_jobs()
                
                # Assertions
                assert result["event"] == "nightly_job"
                assert result["status"] == "failed"
                assert result["demand_rows"] == 0
                assert result["trust_rows"] == 0
                assert "errors" in result
                assert len(result["errors"]) == 2


@pytest.mark.asyncio
async def test_run_nightly_jobs_crash_handling():
    """Test that job handles crashes gracefully."""
    # Mock Prisma
    with patch('backend.app.jobs.nightly.Prisma') as mock_prisma_class:
        mock_db = Mock()
        mock_db.connect = AsyncMock()
        mock_db.disconnect = AsyncMock()
        mock_prisma_class.return_value = mock_db
        
        # Mock refresh functions - demand crashes
        with patch('backend.app.jobs.nightly.refresh_demand_forecasts') as mock_demand:
            with patch('backend.app.jobs.nightly.refresh_trust_scores') as mock_trust:
                mock_demand.side_effect = Exception("Unexpected crash")
                
                mock_trust.return_value = {
                    "success": True,
                    "rows_written": 10,
                    "duration_ms": 500
                }
                
                # Run job - should not crash
                result = await run_nightly_jobs()
                
                # Assertions
                assert result["event"] == "nightly_job"
                assert result["status"] == "failed"
                assert result["trust_rows"] == 10  # Trust still ran
                assert "errors" in result


@pytest.mark.asyncio
async def test_run_nightly_jobs_db_disconnect():
    """Test that database is always disconnected."""
    # Mock Prisma
    with patch('backend.app.jobs.nightly.Prisma') as mock_prisma_class:
        mock_db = Mock()
        mock_db.connect = AsyncMock()
        mock_db.disconnect = AsyncMock()
        mock_prisma_class.return_value = mock_db
        
        # Mock refresh functions
        with patch('backend.app.jobs.nightly.refresh_demand_forecasts') as mock_demand:
            with patch('backend.app.jobs.nightly.refresh_trust_scores') as mock_trust:
                mock_demand.side_effect = Exception("Error")
                mock_trust.side_effect = Exception("Error")
                
                # Run job
                await run_nightly_jobs()
                
                # Assert disconnect was called
                mock_db.disconnect.assert_called_once()


# ============================================================================
# SCHEDULER TESTS
# ============================================================================

def test_scheduler_exists():
    """Test that scheduler is created."""
    assert scheduler is not None


def test_scheduler_has_job():
    """Test that nightly job is registered."""
    jobs = scheduler.get_jobs()
    job_ids = [job.id for job in jobs]
    assert "nightly_ml_job" in job_ids


def test_scheduler_job_config():
    """Test that job is configured correctly."""
    job = scheduler.get_job("nightly_ml_job")
    assert job is not None
    assert job.name == "Nightly ML Data Refresh"
    assert job.max_instances == 1
    assert job.coalesce is True


# ============================================================================
# LOGGING TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_logging_structure():
    """Test that log output has correct structure."""
    # Mock Prisma
    with patch('backend.app.jobs.nightly.Prisma') as mock_prisma_class:
        mock_db = Mock()
        mock_db.connect = AsyncMock()
        mock_db.disconnect = AsyncMock()
        mock_prisma_class.return_value = mock_db
        
        # Mock refresh functions
        with patch('backend.app.jobs.nightly.refresh_demand_forecasts') as mock_demand:
            with patch('backend.app.jobs.nightly.refresh_trust_scores') as mock_trust:
                mock_demand.return_value = {
                    "success": True,
                    "rows_written": 50,
                    "duration_ms": 1000
                }
                
                mock_trust.return_value = {
                    "success": True,
                    "rows_written": 10,
                    "duration_ms": 500
                }
                
                # Run job
                result = await run_nightly_jobs()
                
                # Check log structure
                assert "event" in result
                assert "status" in result
                assert "duration_ms" in result
                assert "demand_rows" in result
                assert "trust_rows" in result
                assert "timestamp" in result
                
                # Check values
                assert result["event"] == "nightly_job"
                assert result["status"] in ["success", "failed"]
                assert isinstance(result["duration_ms"], int)
                assert isinstance(result["demand_rows"], int)
                assert isinstance(result["trust_rows"], int)


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

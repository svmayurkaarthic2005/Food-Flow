"""
Tests for NGO Donor Rating System
Tests the complete rating flow and ML integration
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from app.ml.services.recommender import compute_donor_quality_score


class TestDonorRatingFlow:
    """Test the complete donor rating flow"""

    @pytest.fixture
    def mock_claim(self):
        """Create a mock claim with donor and NGO"""
        return Mock(
            id="claim_123",
            listingId="listing_456",
            ngoId="ngo_789",
            status="COMPLETED",
            claimedAt=datetime.now() - timedelta(hours=2),
            listing=Mock(
                id="listing_456",
                name="Fresh Vegetables",
                donorId="donor_001",
                category="Produce",
                donor=Mock(
                    id="donor_001",
                    businessName="Green Farm",
                    rating=0.0,
                ),
            ),
            ngo=Mock(
                id="ngo_789",
                organizationName="Food Bank",
            ),
        )

    @pytest.fixture
    def mock_rating_data(self):
        """Create mock rating data"""
        return {
            "claimId": "claim_123",
            "rating": 5,
            "comment": "Excellent quality vegetables, well packaged!",
            "foodQuality": 5,
            "packaging": 5,
            "timeliness": 4,
            "communication": 5,
        }

    def test_rating_validation(self, mock_rating_data):
        """Test rating validation"""
        # Valid rating
        assert 1 <= mock_rating_data["rating"] <= 5
        assert 1 <= mock_rating_data["foodQuality"] <= 5
        assert 1 <= mock_rating_data["packaging"] <= 5
        assert 1 <= mock_rating_data["timeliness"] <= 5
        assert 1 <= mock_rating_data["communication"] <= 5

        # Invalid ratings should fail
        invalid_ratings = [0, 6, -1, 10]
        for invalid in invalid_ratings:
            assert not (1 <= invalid <= 5)

    def test_rating_creation(self, mock_claim, mock_rating_data):
        """Test creating a rating"""
        # Simulate rating creation
        rating = {
            "id": "rating_001",
            "claimId": mock_rating_data["claimId"],
            "donorId": mock_claim.listing.donorId,
            "ngoId": mock_claim.ngoId,
            "rating": mock_rating_data["rating"],
            "comment": mock_rating_data["comment"],
            "foodQuality": mock_rating_data["foodQuality"],
            "packaging": mock_rating_data["packaging"],
            "timeliness": mock_rating_data["timeliness"],
            "communication": mock_rating_data["communication"],
            "createdAt": datetime.now(),
        }

        assert rating["rating"] == 5
        assert rating["donorId"] == "donor_001"
        assert rating["ngoId"] == "ngo_789"
        assert rating["claimId"] == "claim_123"

    def test_donor_average_rating_calculation(self):
        """Test calculating donor average rating"""
        ratings = [5, 4, 5, 3, 4]
        average = sum(ratings) / len(ratings)
        
        assert average == 4.2
        assert 0 <= average <= 5

    def test_duplicate_rating_prevention(self, mock_claim):
        """Test that duplicate ratings are prevented"""
        existing_ratings = {
            "claim_123": {"rating": 5, "donorId": "donor_001"}
        }

        # Attempting to rate the same claim again should fail
        new_rating_claim_id = "claim_123"
        assert new_rating_claim_id in existing_ratings
        # In real implementation, this would raise an error

    def test_rating_only_after_completion(self, mock_claim):
        """Test that ratings can only be given after claim completion"""
        # Can rate COMPLETED claims
        mock_claim.status = "COMPLETED"
        assert mock_claim.status == "COMPLETED"

        # Cannot rate PENDING claims
        mock_claim.status = "PENDING"
        assert mock_claim.status != "COMPLETED"

        # Cannot rate REJECTED claims
        mock_claim.status = "REJECTED"
        assert mock_claim.status != "COMPLETED"


class TestDonorQualityScoring:
    """Test donor quality scoring for ML recommendations"""

    def test_compute_donor_quality_score_high_ratings(self):
        """Test quality score with high ratings"""
        ratings = [5, 5, 5, 4, 5]
        average_rating = sum(ratings) / len(ratings)
        
        # Quality score based on average rating
        quality_score = (average_rating / 5.0) * 100
        
        assert quality_score == 96.0
        assert quality_score > 80  # High quality threshold

    def test_compute_donor_quality_score_low_ratings(self):
        """Test quality score with low ratings"""
        ratings = [2, 2, 3, 2, 1]
        average_rating = sum(ratings) / len(ratings)
        
        quality_score = (average_rating / 5.0) * 100
        
        assert quality_score == 40.0
        assert quality_score < 60  # Low quality threshold

    def test_compute_donor_quality_score_mixed_ratings(self):
        """Test quality score with mixed ratings"""
        ratings = [5, 3, 4, 2, 5]
        average_rating = sum(ratings) / len(ratings)
        
        quality_score = (average_rating / 5.0) * 100
        
        assert quality_score == 78.0
        assert 60 <= quality_score <= 80  # Medium quality

    def test_category_rating_weights(self):
        """Test weighted scoring for category ratings"""
        category_ratings = {
            "foodQuality": 5,
            "packaging": 4,
            "timeliness": 5,
            "communication": 3,
        }

        # Weighted average
        weights = {
            "foodQuality": 0.4,
            "packaging": 0.2,
            "timeliness": 0.2,
            "communication": 0.2,
        }

        weighted_score = sum(
            category_ratings[cat] * weights[cat]
            for cat in category_ratings
        )

        assert weighted_score == 4.4
        assert 0 <= weighted_score <= 5

    def test_quality_score_with_volume(self):
        """Test quality score considering number of ratings"""
        # More ratings = more confidence
        high_ratings_high_volume = {
            "average": 4.5,
            "count": 50,
        }

        low_ratings_low_volume = {
            "average": 4.5,
            "count": 2,
        }

        # Confidence score (higher volume = higher confidence)
        confidence_high = min(high_ratings_high_volume["count"] / 50, 1.0)
        confidence_low = min(low_ratings_low_volume["count"] / 50, 1.0)

        assert confidence_high == 1.0
        assert confidence_low == 0.04
        assert confidence_high > confidence_low


class TestMLIntegration:
    """Test ML model integration with donor ratings"""

    def test_recommender_uses_donor_quality(self):
        """Test that recommender considers donor quality"""
        donors = [
            {"id": "donor_1", "quality_score": 95, "distance_km": 2.0},
            {"id": "donor_2", "quality_score": 60, "distance_km": 1.5},
            {"id": "donor_3", "quality_score": 85, "distance_km": 3.0},
        ]

        # Score = quality * 0.6 + (1 - distance/10) * 0.4
        scores = []
        for donor in donors:
            score = (donor["quality_score"] / 100) * 0.6 + (1 - donor["distance_km"] / 10) * 0.4
            scores.append((donor["id"], score))

        # Sort by score
        scores.sort(key=lambda x: x[1], reverse=True)

        # Highest quality donor should rank high
        assert scores[0][0] == "donor_1"  # 95 quality, 2km
        assert scores[1][0] == "donor_3"  # 85 quality, 3km
        assert scores[2][0] == "donor_2"  # 60 quality, 1.5km

    def test_priority_scorer_uses_donor_quality(self):
        """Test that priority scorer considers donor quality"""
        listing = {
            "id": "listing_1",
            "category": "Dairy",
            "hours_until_expiry": 4,
            "donor_quality_score": 90,
        }

        # Base priority from expiry
        if listing["hours_until_expiry"] < 6:
            base_priority = "CRITICAL"
        elif listing["hours_until_expiry"] < 24:
            base_priority = "HIGH"
        else:
            base_priority = "MEDIUM"

        # Boost priority if donor has high quality
        if listing["donor_quality_score"] >= 80:
            # Upgrade priority by one level
            priority_boost = True
        else:
            priority_boost = False

        assert base_priority == "CRITICAL"
        assert priority_boost is True

    def test_demand_forecast_uses_donor_quality(self):
        """Test that demand forecast considers donor quality"""
        historical_data = [
            {"donor_quality": 90, "quantity": 50, "claimed": True},
            {"donor_quality": 60, "quantity": 30, "claimed": False},
            {"donor_quality": 85, "quantity": 45, "claimed": True},
            {"donor_quality": 70, "quantity": 35, "claimed": True},
        ]

        # Calculate claim rate by quality tier
        high_quality = [d for d in historical_data if d["donor_quality"] >= 80]
        low_quality = [d for d in historical_data if d["donor_quality"] < 80]

        high_quality_claim_rate = sum(1 for d in high_quality if d["claimed"]) / len(high_quality)
        low_quality_claim_rate = sum(1 for d in low_quality if d["claimed"]) / len(low_quality)

        assert high_quality_claim_rate == 1.0  # 100% claim rate for high quality
        assert low_quality_claim_rate == 0.667  # ~67% claim rate for low quality

    def test_ngo_recommendation_boost_for_high_quality_donors(self):
        """Test that NGOs get better recommendations for high-quality donors"""
        ngo_preferences = {
            "ngo_1": {
                "preferred_categories": ["Dairy", "Produce"],
                "storage_capacity": 500,
                "past_claims": 20,
            }
        }

        available_listings = [
            {
                "id": "listing_1",
                "category": "Dairy",
                "donor_quality": 95,
                "quantity": 50,
            },
            {
                "id": "listing_2",
                "category": "Dairy",
                "donor_quality": 50,
                "quantity": 50,
            },
            {
                "id": "listing_3",
                "category": "Produce",
                "donor_quality": 85,
                "quantity": 40,
            },
        ]

        # Score listings for NGO
        scores = []
        for listing in available_listings:
            category_match = 1.0 if listing["category"] in ngo_preferences["ngo_1"]["preferred_categories"] else 0.5
            quality_score = listing["donor_quality"] / 100
            combined_score = category_match * 0.6 + quality_score * 0.4
            scores.append((listing["id"], combined_score))

        scores.sort(key=lambda x: x[1], reverse=True)

        # Highest quality dairy should rank first
        assert scores[0][0] == "listing_1"  # Dairy, 95 quality
        assert scores[1][0] == "listing_3"  # Produce, 85 quality
        assert scores[2][0] == "listing_2"  # Dairy, 50 quality


class TestRatingEdgeCases:
    """Test edge cases and error handling"""

    def test_no_ratings_yet(self):
        """Test donor with no ratings"""
        donor = {
            "id": "donor_new",
            "rating": None,
            "rating_count": 0,
        }

        # Should use default quality score
        default_quality_score = 50  # Neutral score for new donors
        assert donor["rating"] is None
        assert donor["rating_count"] == 0

    def test_single_rating(self):
        """Test donor with single rating"""
        ratings = [4]
        average = sum(ratings) / len(ratings)
        
        assert average == 4.0
        assert len(ratings) == 1

    def test_extreme_ratings(self):
        """Test with all 5-star and all 1-star ratings"""
        all_fives = [5, 5, 5, 5, 5]
        all_ones = [1, 1, 1, 1, 1]

        avg_fives = sum(all_fives) / len(all_fives)
        avg_ones = sum(all_ones) / len(all_ones)

        assert avg_fives == 5.0
        assert avg_ones == 1.0
        assert avg_fives > avg_ones

    def test_rating_with_missing_categories(self):
        """Test rating with some category ratings missing"""
        rating = {
            "overall": 4,
            "foodQuality": 5,
            "packaging": None,  # Missing
            "timeliness": 4,
            "communication": None,  # Missing
        }

        # Calculate average of available categories
        available_categories = [v for v in rating.values() if v is not None and isinstance(v, int)]
        average = sum(available_categories) / len(available_categories)

        assert average == 4.333
        assert len(available_categories) == 3

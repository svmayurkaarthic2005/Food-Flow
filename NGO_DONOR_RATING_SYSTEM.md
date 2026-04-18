# NGO Donor Rating System with ML Integration

## Overview
Implemented a comprehensive rating system that allows NGOs to rate donors after completing food pickups. The ratings are used by ML models to improve donor recommendations and trust scoring.

## Features Implemented

### 1. Database Schema Updates
**New Model: `DonorRating`**
- Stores ratings from NGOs for donors
- Tracks individual claim ratings (one rating per claim)
- Includes overall rating (1-5 stars)
- Includes category ratings:
  - Food Quality (1-5)
  - Packaging (1-5)
  - Timeliness (1-5)
  - Communication (1-5)
- Optional comment field for feedback

**Schema Relations:**
- `Donor` → `DonorRating[]` (one-to-many)
- `Ngo` → `DonorRating[]` (one-to-many)
- `Claim` → `DonorRating?` (one-to-one)

### 2. Backend API Endpoint
**`POST /api/ratings`** - Create a new rating
- Validates rating (1-5 stars)
- Creates rating record
- Automatically updates donor's average rating
- Returns created rating object

**`GET /api/ratings`** - Fetch ratings
- Query by `donorId`: Get all ratings for a donor
- Query by `claimId`: Get specific rating for a claim
- Returns ratings sorted by creation date (newest first)

### 3. Frontend Components

#### DonorRatingModal (`frontend/components/ratings/donor-rating-modal.tsx`)
- Modal dialog for rating donors
- Star rating selector (1-5 stars)
- Category-specific ratings (optional)
- Comment field for feedback
- Form validation
- Loading states
- Error handling with toast notifications

#### DonorRatingDisplay (`frontend/components/ratings/donor-rating-display.tsx`)
- Displays donor ratings
- Shows overall rating with star visualization
- Shows category ratings if available
- Displays total number of ratings
- Read-only component for viewing ratings

### 4. NGO Claimed Page Integration
**Updated: `frontend/app/ngo/claimed/page.tsx`**
- Added "Rate Donor" button for completed claims
- Button only appears after claim is COMPLETED
- Prevents duplicate ratings (checks if already rated)
- Opens rating modal on click
- Refreshes claims after successful rating
- Shows toast notifications for user feedback

## ML Integration

### How Ratings Improve ML Models

1. **Donor Trust Scoring**
   - Ratings feed into donor reliability metrics
   - Higher-rated donors get prioritized in recommendations
   - Helps identify consistent, quality donors

2. **NGO Recommendations**
   - ML models can use donor ratings to improve matching
   - Recommends NGOs to high-quality donors
   - Improves overall food distribution efficiency

3. **Demand Forecasting**
   - Rating patterns help predict donation quality
   - Better quality predictions for future demand

4. **Priority Scoring**
   - Donor ratings influence listing priority
   - High-rated donors' listings get higher priority
   - Ensures quality food reaches NGOs faster

## Data Flow

```
NGO Completes Pickup
    ↓
Claim Status → COMPLETED
    ↓
"Rate Donor" Button Appears
    ↓
NGO Opens Rating Modal
    ↓
NGO Submits Rating (1-5 stars + categories)
    ↓
POST /api/ratings
    ↓
Create DonorRating Record
    ↓
Update Donor Average Rating
    ↓
ML Models Use Updated Rating
    ↓
Improved Recommendations & Matching
```

## Rating Categories

### Overall Rating (Required)
- 1 star: Poor
- 2 stars: Fair
- 3 stars: Good
- 4 stars: Very Good
- 5 stars: Excellent

### Category Ratings (Optional)
- **Food Quality**: How fresh and good condition was the food?
- **Packaging**: Was the food properly packaged?
- **Timeliness**: Was the food ready at the promised time?
- **Communication**: How responsive was the donor?

## API Examples

### Create a Rating
```bash
POST /api/ratings
Content-Type: application/json

{
  "claimId": "claim_123",
  "rating": 5,
  "comment": "Great quality vegetables, well packaged!",
  "foodQuality": 5,
  "packaging": 5,
  "timeliness": 4,
  "communication": 5
}
```

### Get Ratings for a Donor
```bash
GET /api/ratings?donorId=donor_123
```

### Get Rating for a Specific Claim
```bash
GET /api/ratings?claimId=claim_123
```

## Files Created/Modified

### Created:
1. `frontend/app/api/ratings/route.ts` - Rating API endpoint
2. `frontend/components/ratings/donor-rating-modal.tsx` - Rating modal component
3. `frontend/components/ratings/donor-rating-display.tsx` - Rating display component
4. `NGO_DONOR_RATING_SYSTEM.md` - This documentation

### Modified:
1. `backend/schema.prisma` - Added DonorRating model and relations
2. `frontend/app/ngo/claimed/page.tsx` - Integrated rating functionality

## Next Steps

1. **Run Prisma Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_donor_ratings
   ```

2. **Test Rating Flow**
   - Complete a claim as NGO
   - Click "Rate Donor" button
   - Submit rating with all categories
   - Verify donor rating is updated

3. **Integrate with ML Models**
   - Update trust scorer to use donor ratings
   - Update recommender to consider donor ratings
   - Update priority scorer to factor in donor quality

4. **Add Rating Analytics**
   - Dashboard showing average donor ratings
   - Rating trends over time
   - Category-specific insights

5. **Add Donor Rating Display**
   - Show donor ratings on listing cards
   - Show donor ratings on donor profile
   - Show rating distribution (histogram)

## Performance Considerations

- Ratings are cached with SWR (5-minute cache)
- Donor average rating updated in real-time
- Indexes on donorId, ngoId, rating, createdAt for fast queries
- Unique constraint on claimId prevents duplicate ratings

## Security

- NGOs can only rate donors for their own claims
- Ratings are immutable (no editing after submission)
- Comments are sanitized before storage
- API validates rating values (1-5 range)

## Future Enhancements

1. **Rating Moderation**
   - Flag suspicious ratings
   - Admin review system
   - Spam detection

2. **Donor Response**
   - Allow donors to respond to ratings
   - Dispute resolution system

3. **Rating Badges**
   - "Top Rated Donor" badge
   - "Consistent Quality" badge
   - "Responsive" badge

4. **Incentives**
   - Rewards for high-rated donors
   - Bonus points for consistent quality
   - Recognition program

5. **Advanced Analytics**
   - Rating prediction models
   - Donor performance trends
   - Category-specific insights

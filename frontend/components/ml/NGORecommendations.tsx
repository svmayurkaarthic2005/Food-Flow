/**
 * NGO Recommendations Component
 * Displays top NGO recommendations for a listing
 */
'use client';

import { useRecommendations } from '@/hooks/useRecommendations';
import { getScoreColor, formatDistance, getConfidenceMessage } from '@/utils/ml-helpers';
import { motion } from 'framer-motion';
import { Building2, MapPin, TrendingUp, AlertCircle } from 'lucide-react';

interface NGORecommendationsProps {
  listingId: string;
  topN?: number;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}

export function NGORecommendations({ listingId, topN = 3 }: NGORecommendationsProps) {
  const { recommendations, isLoading, isError } = useRecommendations({ listingId, topN });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Recommended NGOs</h3>
        <div className="space-y-3">
          {[...Array(topN)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Failed to load recommendations</h3>
            <p className="text-sm text-red-600 mt-1">
              {isError.info?.detail || 'Please try again later'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No recommendations available</h3>
        <p className="text-sm text-gray-600">
          No NGOs found within range for this listing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Recommended NGOs</h3>
      <div className="space-y-3">
        {recommendations.map((ngo, index) => {
          const scoreColors = getScoreColor(ngo.score);
          const confidenceMessage = getConfidenceMessage(ngo.score);

          return (
            <motion.div
              key={ngo.ngo_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">{ngo.name}</h4>
                  </div>
                  {ngo.trust_label && (
                    <span className="text-xs text-gray-600">
                      Trust: {ngo.trust_label}
                      {ngo.trust_score !== null && ` (${ngo.trust_score})`}
                    </span>
                  )}
                </div>
                
                {/* Score Badge */}
                <div className="relative group">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${scoreColors.bg} ${scoreColors.text} ${scoreColors.border}`}
                  >
                    {ngo.score}
                  </span>
                  
                  {/* Tooltip for low confidence */}
                  {confidenceMessage && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {confidenceMessage}
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{formatDistance(ngo.distance_km)} away</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Match Score: {ngo.score}/100</span>
                </div>
              </div>

              {/* Rank Badge */}
              {index === 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    🏆 Top Recommendation
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

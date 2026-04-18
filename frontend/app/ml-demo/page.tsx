/**
 * ML Components Demo Page
 * Demonstrates all ML-powered UI components
 */
'use client';

import { useState } from 'react';
import {
  NGORecommendations,
  PriorityBadge,
  HungerHeatmap,
  DemandChart,
  RouteMap,
} from '@/components/ml';
import { useRoute } from '@/hooks/useRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MLDemoPage() {
  const [listingId, setListingId] = useState('1');
  const [selectedDistrict, setSelectedDistrict] = useState('Downtown');
  const { route, isLoading, optimizeRoute } = useRoute();

  // Sample districts
  const districts = ['Downtown', 'Uptown', 'Midtown', 'Suburbs'];

  // Handle route optimization
  const handleOptimizeRoute = async () => {
    try {
      await optimizeRoute({
        listing_ids: [1, 2, 3],
        depot: { lat: 40.7580, lng: -73.9855 },
      });
    } catch (error) {
      console.error('Failed to optimize route:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ML Components Demo</h1>
          <p className="text-gray-600">
            Explore ML-powered features for the FoodFlow platform
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="priority">Priority</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="demand">Demand</TabsTrigger>
            <TabsTrigger value="route">Route</TabsTrigger>
          </TabsList>

          {/* NGO Recommendations */}
          <TabsContent value="recommendations" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                NGO Recommendations Demo
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing ID
                </label>
                <Input
                  type="text"
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  placeholder="Enter listing ID"
                  className="max-w-xs"
                />
              </div>
              <NGORecommendations listingId={listingId} topN={3} />
            </div>
          </TabsContent>

          {/* Priority Badge */}
          <TabsContent value="priority" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Priority Badge Demo</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">CRITICAL</h3>
                  <PriorityBadge priority="CRITICAL" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">HIGH</h3>
                  <PriorityBadge priority="HIGH" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">MEDIUM</h3>
                  <PriorityBadge priority="MEDIUM" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">LOW</h3>
                  <PriorityBadge priority="LOW" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Heatmap */}
          <TabsContent value="heatmap" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Hunger Heatmap Demo</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <HungerHeatmap district={selectedDistrict || undefined} />
            </div>
          </TabsContent>

          {/* Demand Chart */}
          <TabsContent value="demand" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Demand Forecast Demo</h2>
              <DemandChart districts={districts} defaultDistrict="Downtown" days={7} />
            </div>
          </TabsContent>

          {/* Route Map */}
          <TabsContent value="route" className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Optimization Demo</h2>
              <div className="mb-4">
                <Button onClick={handleOptimizeRoute} disabled={isLoading}>
                  {isLoading ? 'Optimizing...' : 'Optimize Sample Route'}
                </Button>
              </div>
              {route && (
                <RouteMap
                  orderedStops={route.stops}
                  depot={{ lat: 40.7580, lng: -73.9855 }}
                />
              )}
              {!route && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-gray-600">Click the button above to optimize a sample route</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

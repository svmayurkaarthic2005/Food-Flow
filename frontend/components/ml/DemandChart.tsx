/**
 * Demand Chart Component
 * Displays demand forecast with confidence intervals
 */
'use client';

import { useState } from 'react';
import { useDemandForecast } from '@/hooks/useDemandForecast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ErrorBar,
} from 'recharts';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';

interface DemandChartProps {
  districts: string[];
  defaultDistrict?: string;
  days?: number;
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}

export function DemandChart({ districts, defaultDistrict, days = 7 }: DemandChartProps) {
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict || districts[0] || null);
  const { forecasts, isLoading, isError } = useDemandForecast({
    district: selectedDistrict,
    days,
  });

  // Transform data for Recharts
  const chartData = forecasts?.map((forecast) => ({
    date: new Date(forecast.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    predicted: forecast.predicted,
    errorRange: [forecast.low, forecast.high],
    category: forecast.category,
  })) || [];

  // Loading state
  if (isLoading) {
    return <SkeletonChart />;
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Failed to load demand forecast</h3>
            <p className="text-sm text-red-600 mt-1">
              {isError.info?.detail || 'Please try again later'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No forecast data available</h3>
        <p className="text-sm text-gray-600">
          No demand forecasts found for {selectedDistrict}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Demand Forecast</h3>
        </div>

        {/* District Dropdown */}
        <select
          value={selectedDistrict || ''}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Demand', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '4px' }}
            formatter={(value: any, name: string) => {
              if (name === 'predicted') {
                return [value, 'Predicted Demand'];
              }
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => {
              if (value === 'predicted') return 'Predicted Demand';
              return value;
            }}
          />
          <Bar dataKey="predicted" fill="#3b82f6" radius={[4, 4, 0, 0]}>
            <ErrorBar
              dataKey="errorRange"
              width={4}
              strokeWidth={2}
              stroke="#6b7280"
              direction="y"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Predicted Demand</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-gray-600"></div>
            <span>90% Confidence Interval</span>
          </div>
        </div>
      </div>
    </div>
  );
}

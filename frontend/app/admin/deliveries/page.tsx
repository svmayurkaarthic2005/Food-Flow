'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MapPin, Truck } from 'lucide-react';

interface Delivery {
  id: string;
  status: string;
  itemName: string;
  donorName: string;
  ngoName: string;
  driverName: string;
  estimatedArrival?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  createdAt: string;
}

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await fetch('/api/admin/deliveries');
        if (!response.ok) {
          throw new Error('Failed to fetch deliveries');
        }
        const data = await response.json();
        setDeliveries(data.deliveries);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching deliveries');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDeliveries = deliveries.filter((d) =>
    filter === 'ALL' ? true : d.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Deliveries</h1>
          <p className="text-gray-600">Monitor all deliveries across the platform</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredDeliveries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No deliveries found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDeliveries.map((delivery) => (
              <Link
                key={delivery.id}
                href={`/ngo/tracking?id=${delivery.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      {/* Item */}
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                          Item
                        </p>
                        <p className="font-medium text-sm">{delivery.itemName}</p>
                      </div>

                      {/* From */}
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                          From
                        </p>
                        <p className="text-sm">{delivery.donorName}</p>
                      </div>

                      {/* To */}
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                          To
                        </p>
                        <p className="text-sm">{delivery.ngoName}</p>
                      </div>

                      {/* Driver */}
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                          Driver
                        </p>
                        <p className="text-sm">{delivery.driverName}</p>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                          Status
                        </p>
                        <Badge className={getStatusColor(delivery.status)}>
                          {delivery.status}
                        </Badge>
                      </div>

                      {/* ETA */}
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">
                          ETA
                        </p>
                        {delivery.estimatedArrival ? (
                          <p className="text-sm">
                            {new Date(delivery.estimatedArrival).toLocaleTimeString()}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">N/A</p>
                        )}
                      </div>
                    </div>

                    {/* Location indicator */}
                    {delivery.currentLocation && (
                      <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-blue-600">
                        <MapPin className="h-4 w-4" />
                        <span>
                          Live: {delivery.currentLocation.latitude.toFixed(4)}, {delivery.currentLocation.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

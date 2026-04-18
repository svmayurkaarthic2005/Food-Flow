'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Truck, MapPin, Sparkles, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Claim {
  id: string;
  listing: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    donor: {
      businessName: string;
    };
  };
  ngo: {
    organizationName: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  status: string;
  claimedAt: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  activeDeliveries: number;
  totalDeliveries: number;
  rating: number;
  distance?: number;
  score?: number;
}

interface MLRecommendation {
  driverId: string;
  score: number;
  reasons: string[];
}

export default function AssignDriverPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [mlRecommendations, setMlRecommendations] = useState<MLRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [loadingML, setLoadingML] = useState(false);

  useEffect(() => {
    fetchAcceptedClaims();
    fetchAvailableDrivers();
  }, []);

  const fetchAcceptedClaims = async () => {
    try {
      const response = await fetch('/api/admin/claims?status=ACCEPTED&noDelivery=true');
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const getMLRecommendations = async (claimId: string) => {
    setLoadingML(true);
    try {
      const response = await fetch(`/api/admin/recommend-driver?claimId=${claimId}`);
      if (response.ok) {
        const data = await response.json();
        setMlRecommendations(data.recommendations || []);
        
        // Update drivers with ML scores and distances
        setDrivers(prevDrivers => 
          prevDrivers.map(driver => {
            const detail = data.details?.find((d: any) => d.driverId === driver.id);
            return detail ? { 
              ...driver, 
              score: detail.score,
              distance: detail.distance 
            } : driver;
          })
        );
      }
    } catch (error) {
      console.error('Error getting ML recommendations:', error);
    } finally {
      setLoadingML(false);
    }
  };

  const handleClaimSelect = (claimId: string) => {
    setSelectedClaim(claimId);
    setSelectedDriver(null);
    getMLRecommendations(claimId);
  };

  const handleAssignDriver = async () => {
    if (!selectedClaim || !selectedDriver) {
      toast({
        title: 'Error',
        description: 'Please select both a claim and a driver',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch('/api/admin/assign-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: selectedClaim,
          driverId: selectedDriver,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign driver');
      }

      toast({
        title: 'Success',
        description: 'Driver assigned successfully! Notifications sent to all parties.',
      });

      // Refresh data
      fetchAcceptedClaims();
      setSelectedClaim(null);
      setSelectedDriver(null);
      setMlRecommendations([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign driver',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const selectedClaimData = claims.find(c => c.id === selectedClaim);
  const selectedDriverData = drivers.find(d => d.id === selectedDriver);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Assign Driver to Delivery</h1>
          <p className="text-gray-600">Select a claim and assign the best driver using ML recommendations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claims List */}
          <Card>
            <CardHeader>
              <CardTitle>Accepted Claims (No Driver)</CardTitle>
            </CardHeader>
            <CardContent>
              {claims.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No claims waiting for driver assignment</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {claims.map((claim) => (
                    <div
                      key={claim.id}
                      onClick={() => handleClaimSelect(claim.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedClaim === claim.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{claim.listing.name}</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {claim.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>From: {claim.listing.donor.businessName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>To: {claim.ngo.organizationName}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Claimed: {new Date(claim.claimedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drivers List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Available Drivers</span>
                {loadingML && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>AI Analyzing...</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedClaim ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a claim first to see driver recommendations</p>
                </div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No drivers available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {drivers
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((driver) => {
                      const recommendation = mlRecommendations.find(r => r.driverId === driver.id);
                      return (
                        <div
                          key={driver.id}
                          onClick={() => setSelectedDriver(driver.id)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedDriver === driver.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          } ${
                            recommendation && recommendation.score > 0.7
                              ? 'ring-2 ring-green-500/20'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{driver.name}</h3>
                              <p className="text-sm text-gray-600">{driver.email}</p>
                            </div>
                            {recommendation && (
                              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                <Sparkles className="h-3 w-3" />
                                {(recommendation.score * 100).toFixed(0)}% Match
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div>
                              <span className="font-semibold">Active:</span> {driver.activeDeliveries}
                            </div>
                            <div>
                              <span className="font-semibold">Total:</span> {driver.totalDeliveries}
                            </div>
                            {driver.distance && (
                              <div className="col-span-2">
                                <span className="font-semibold">Distance:</span> {driver.distance.toFixed(1)} km
                              </div>
                            )}
                          </div>

                          {recommendation && recommendation.reasons.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-semibold text-gray-700 mb-1">AI Reasons:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {recommendation.reasons.map((reason, idx) => (
                                  <li key={idx}>• {reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignment Summary */}
        {selectedClaim && selectedDriver && (
          <Card className="mt-6 border-primary">
            <CardHeader>
              <CardTitle>Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Delivery Details</h3>
                  <p className="text-sm"><span className="font-semibold">Item:</span> {selectedClaimData?.listing.name}</p>
                  <p className="text-sm"><span className="font-semibold">From:</span> {selectedClaimData?.listing.donor.businessName}</p>
                  <p className="text-sm"><span className="font-semibold">To:</span> {selectedClaimData?.ngo.organizationName}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Assigned Driver</h3>
                  <p className="text-sm"><span className="font-semibold">Name:</span> {selectedDriverData?.name}</p>
                  <p className="text-sm"><span className="font-semibold">Email:</span> {selectedDriverData?.email}</p>
                  <p className="text-sm"><span className="font-semibold">Active Deliveries:</span> {selectedDriverData?.activeDeliveries}</p>
                </div>
              </div>
              
              <Button
                onClick={handleAssignDriver}
                disabled={assigning}
                className="w-full"
                size="lg"
              >
                {assigning ? 'Assigning Driver...' : 'Confirm Assignment & Send Notifications'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

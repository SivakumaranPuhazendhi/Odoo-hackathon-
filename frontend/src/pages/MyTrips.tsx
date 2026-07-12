import { useState, useEffect } from 'react';

interface Trip {
  id: number;
  status: string;
  cargoWeightKg: number;
  createdAt: string;
  vehicle: { licensePlate: string; make: string; model: string };
}

interface Driver {
  id: number;
  licenseNumber: string;
  status: string;
  trips: Trip[];
}

export default function MyTrips() {
  const [driverData, setDriverData] = useState<Driver | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/driver/me');
      if (!res.ok) throw new Error('Failed to load trips');
      const data = await res.json();
      setDriverData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleCompleteTrip = async (tripId: number) => {
    if (!window.confirm('Are you sure you want to mark this trip as completed?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/trips/${tripId}/complete`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete trip');
      }
      fetchDriverData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!driverData) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Trips</h2>
        <p className="text-muted-foreground">Manage your currently assigned and past trips.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {driverData.trips.map(trip => (
          <div key={trip.id} className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Trip #{trip.id}</h3>
                  <span className="text-sm text-muted-foreground">{new Date(trip.createdAt).toLocaleString()}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${trip.status === 'Completed' ? 'bg-green-500/10 text-green-500' : trip.status === 'Dispatched' ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}`}>
                  {trip.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Vehicle:</span> {trip.vehicle.licensePlate} ({trip.vehicle.make} {trip.vehicle.model})</p>
                <p><span className="font-medium">Cargo:</span> {trip.cargoWeightKg} kg</p>
              </div>
            </div>
            
            {trip.status === 'Dispatched' && (
              <div className="mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => handleCompleteTrip(trip.id)}
                  className="w-full bg-green-500 text-white hover:bg-green-600 font-medium py-2 rounded-md transition-colors"
                >
                  Mark Completed
                </button>
              </div>
            )}
          </div>
        ))}
        {driverData.trips.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            You have no assigned trips.
          </div>
        )}
      </div>
    </div>
  );
}

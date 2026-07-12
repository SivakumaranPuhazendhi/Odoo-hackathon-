import { useState, useEffect } from 'react';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  licensePlate: string;
  status: string;
  maxCapacityKg: number;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/vehicles')
      .then(r => r.json())
      .then(setVehicles)
      .catch(console.error);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-500/10 text-green-500';
      case 'On Trip': return 'bg-blue-500/10 text-blue-500';
      case 'In Shop': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">Manage your fleet.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium">Add Vehicle</button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4">License Plate</th>
              <th className="px-6 py-4">Max Capacity</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium">{v.make} {v.model}</td>
                <td className="px-6 py-4">{v.licensePlate}</td>
                <td className="px-6 py-4">{v.maxCapacityKg} kg</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(v.status)}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-primary hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

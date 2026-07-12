import { useState, useEffect } from 'react';

interface Vehicle { id: number; licensePlate: string; status: string; }

export default function Maintenance() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/vehicles')
      .then(r => r.json())
      .then(setVehicles)
      .catch(console.error);
  }, []);

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:3001/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: Number(selectedVehicle),
          description,
          cost: Number(cost)
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log maintenance');
      }

      setSuccess('Maintenance logged and vehicle moved to In Shop status.');
      setSelectedVehicle('');
      setDescription('');
      setCost('');
      
      // Refresh status
      const vRes = await fetch('http://localhost:3001/api/vehicles');
      setVehicles(await vRes.json());
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Log Maintenance</h2>
        <p className="text-muted-foreground">Log a repair, which auto-locks the vehicle out of dispatch.</p>
      </div>

      <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
        <form onSubmit={handleMaintenance} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">{error}</div>}
          {success && <div className="p-3 bg-green-500/10 text-green-500 text-sm rounded-md border border-green-500/20">{success}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Vehicle</label>
            <select 
              required
              className="w-full p-2 rounded-md border border-input bg-background"
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.licensePlate} ({v.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Issue Description</label>
            <input 
              required
              type="text"
              className="w-full p-2 rounded-md border border-input bg-background"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Brake pad replacement"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cost ($)</label>
            <input 
              required
              type="number"
              min="0"
              className="w-full p-2 rounded-md border border-input bg-background"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="e.g., 250"
            />
          </div>

          <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2 rounded-md transition-colors">
            Log Maintenance & Lock Vehicle
          </button>
        </form>
      </div>
    </div>
  );
}

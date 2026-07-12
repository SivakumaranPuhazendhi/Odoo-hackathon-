import { useState, useEffect } from 'react';

interface Vehicle { id: number; licensePlate: string; status: string; maxCapacityKg: number; }
interface Driver { id: number; user: { name: string }; licenseNumber: string; status: string; }

export default function Trips() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Copilot State
  const [copilotText, setCopilotText] = useState('');
  const [copilotMsg, setCopilotMsg] = useState<{text: string, type: 'error'|'success'|'info'} | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/vehicles')
      .then(r => r.json())
      .then(setVehicles)
      .catch(console.error);
      
    fetch('http://localhost:3001/api/drivers')
      .then(r => r.json())
      .then(setDrivers)
      .catch(console.error);
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:3001/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: Number(selectedVehicle),
          driverId: Number(selectedDriver),
          cargoWeightKg: Number(cargoWeight)
        })
      });

      const data = await res.json();
      
      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.errors?.join(', ') || 'Dispatch failed');
      }

      setSuccess(`Trip dispatched successfully! Risk Score: ${data.trip?.riskScore}`);
      setSelectedVehicle('');
      setSelectedDriver('');
      setCargoWeight('');
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCopilotMsg({ text: 'Processing...', type: 'info' });
    try {
      const res = await fetch('http://localhost:3001/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: copilotText })
      });
      const data = await res.json();
      if (data.needsClarification) {
        setCopilotMsg({ text: data.needsClarification, type: 'error' });
      } else if (!data.success) {
        setCopilotMsg({ text: data.explanation, type: 'error' });
      } else {
        setCopilotMsg({ text: data.explanation, type: 'success' });
        setCopilotText('');
      }
    } catch (err: any) {
      setCopilotMsg({ text: 'Error connecting to Copilot', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dispatch Trip</h2>
        <p className="text-muted-foreground">Assign a driver and vehicle for a new trip.</p>
      </div>

      {/* AI Copilot Box */}
      <div className="p-6 rounded-xl border border-primary/30 bg-primary/5 shadow-sm">
        <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
          ✨ AI Dispatch Copilot
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Try: "Dispatch VAN-05 with Alex, carrying 1500kg"</p>
        <form onSubmit={handleCopilot} className="flex gap-2">
          <input 
            type="text"
            className="flex-1 p-2 rounded-md border border-input bg-background"
            value={copilotText}
            onChange={e => setCopilotText(e.target.value)}
            placeholder="Type your instruction..."
            required
          />
          <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium">
            Ask Copilot
          </button>
        </form>
        {copilotMsg && (
          <div className={`mt-3 p-3 rounded-md text-sm border ${copilotMsg.type === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : copilotMsg.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
            {copilotMsg.text}
          </div>
        )}
      </div>
      <div className="text-center text-sm text-muted-foreground font-medium uppercase tracking-widest my-4">OR MANUAL DISPATCH</div>

      <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
        <form onSubmit={handleDispatch} className="space-y-4">
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
                  {v.licensePlate} ({v.status}) - Max {v.maxCapacityKg}kg
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Driver</label>
            <select 
              required
              className="w-full p-2 rounded-md border border-input bg-background"
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
            >
              <option value="">-- Choose Driver --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.user?.name || 'Unknown'} ({d.licenseNumber}) - {d.status}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cargo Weight (kg)</label>
            <input 
              required
              type="number"
              min="0"
              className="w-full p-2 rounded-md border border-input bg-background"
              value={cargoWeight}
              onChange={e => setCargoWeight(e.target.value)}
              placeholder="e.g. 1500"
            />
          </div>

          <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2 rounded-md transition-colors">
            Dispatch Trip
          </button>
        </form>
      </div>
    </div>
  );
}

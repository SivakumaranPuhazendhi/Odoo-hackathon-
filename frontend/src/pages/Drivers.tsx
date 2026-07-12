import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

interface Driver {
  id: number;
  user: { name: string; email: string };
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const { user } = useContext(AuthContext);

  const fetchDrivers = () => {
    fetch('http://localhost:3001/api/drivers')
      .then(r => r.json())
      .then(setDrivers)
      .catch(console.error);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleToggleStatus = async (id: number) => {
    if (!window.confirm("Are you sure you want to toggle this driver's status?")) return;
    try {
      const res = await fetch(`http://localhost:3001/api/drivers/${id}/toggle-status`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to toggle status');
      }
      fetchDrivers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-500/10 text-green-500';
      case 'On Trip': return 'bg-blue-500/10 text-blue-500';
      case 'Suspended': return 'bg-destructive/10 text-destructive';
      case 'Off Duty': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
          <p className="text-muted-foreground">Manage your driving staff.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium">Add Driver</button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">License Number</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {drivers.map(d => (
              <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium">{d.user?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">{d.user?.email}</div>
                </td>
                <td className="px-6 py-4">{d.licenseNumber}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(d.status)}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {(user?.role === 'Safety Officer' || user?.role === 'Fleet Manager') && (
                    <button 
                      onClick={() => handleToggleStatus(d.id)}
                      className={`px-3 py-1 text-xs rounded-md font-medium text-white transition-colors ${d.status === 'Suspended' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                    >
                      {d.status === 'Suspended' ? 'Reinstate' : 'Suspend'}
                    </button>
                  )}
                  <button className="text-primary hover:underline px-3 py-1">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Truck, Activity, CheckCircle, AlertTriangle, Settings } from 'lucide-react';

interface Vehicle { id: number; status: string; }
interface Trip { id: number; status: string; }

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  const [needsAttention, setNeedsAttention] = useState<any>(null);
  const [safetyMetrics, setSafetyMetrics] = useState<any>(null);
  const [financialMetrics, setFinancialMetrics] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/vehicles').then(r => r.json()).then(setVehicles).catch(console.error);
    // Fetching all trips for stats (assume we add this endpoint or just mock for demo)
    // For now we will mock the trips data if the endpoint isn't ready
    setTrips([
      { id: 1, status: 'Completed' },
      { id: 2, status: 'Dispatched' },
      { id: 3, status: 'Completed' },
      { id: 4, status: 'Draft' },
    ]);

    if (user?.role === 'Fleet Manager') {
      fetch('http://localhost:3001/api/dashboard/needs-attention').then(r => r.json()).then(setNeedsAttention).catch(console.error);
    } else if (user?.role === 'Safety Officer') {
      fetch('http://localhost:3001/api/dashboard/safety-metrics').then(r => r.json()).then(setSafetyMetrics).catch(console.error);
    } else if (user?.role === 'Financial Analyst') {
      fetch('http://localhost:3001/api/dashboard/financial-metrics').then(r => r.json()).then(setFinancialMetrics).catch(console.error);
    }
  }, [user]);

  const triggerDiagnostics = async () => {
    try {
      await fetch('http://localhost:3001/api/trigger-predictive');
      alert("Diagnostics triggered! Check the top of the screen for maintenance alerts.");
    } catch (err) {
      console.error(err);
      alert("Failed to trigger diagnostics");
    }
  };

  const resetDemoData = async () => {
    if (confirm("Are you sure you want to reset all demo data? This will wipe the database and reseed it.")) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/admin/reset-demo-data', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          alert("Demo data reset successfully. Reloading...");
          window.location.reload();
        } else {
          const data = await res.json();
          alert(`Failed to reset: ${data.error}`);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to reset demo data.");
      }
    }
  };

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const inShopVehicles = vehicles.filter(v => v.status === 'In Shop').length;

  const vehicleStatusData = [
    { name: 'Available', value: availableVehicles },
    { name: 'On Trip', value: activeVehicles },
    { name: 'In Shop', value: inShopVehicles },
    { name: 'Retired', value: vehicles.filter(v => v.status === 'Retired').length },
  ].filter(d => d.value > 0);

  const utilizationRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

  // Mock Fuel Efficiency Data
  const fuelData = [
    { month: 'Jan', efficiency: 6.2 },
    { month: 'Feb', efficiency: 6.5 },
    { month: 'Mar', efficiency: 7.1 },
    { month: 'Apr', efficiency: 6.8 },
    { month: 'May', efficiency: 7.4 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fleet Dashboard</h2>
          <p className="text-muted-foreground">High-level KPIs and performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'Fleet Manager' && (
            <button onClick={resetDemoData} className="bg-destructive text-destructive-foreground hover:bg-destructive/80 flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors border border-border">
              Reset Demo Data
            </button>
          )}
          <button onClick={triggerDiagnostics} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors border border-border">
            <Settings className="w-4 h-4" /> Run Diagnostics (Demo)
          </button>
        </div>
      </div>

      {user?.role === 'Fleet Manager' && needsAttention && (
        <div className="p-6 rounded-xl border border-orange-500/30 bg-orange-500/5 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-orange-500 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Needs Attention</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Suspended Drivers</h4>
              {needsAttention.suspendedDrivers.length === 0 ? <p className="text-sm">None</p> : needsAttention.suspendedDrivers.map((d: any) => (
                <div key={d.id} className="text-sm border p-2 rounded-md bg-background">{d.user.name} ({d.licenseNumber})</div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Expiring Licenses (&lt;7 days)</h4>
              {needsAttention.expiringLicenses.length === 0 ? <p className="text-sm">None</p> : needsAttention.expiringLicenses.map((d: any) => (
                <div key={d.id} className="text-sm border p-2 rounded-md bg-background">{d.user.name} - Exp: {new Date(d.licenseExpiry).toLocaleDateString()}</div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Overdue Maintenance (&gt;90 days)</h4>
              {needsAttention.overdueVehicles.length === 0 ? <p className="text-sm">None</p> : needsAttention.overdueVehicles.map((v: any) => (
                <div key={v.id} className="text-sm border p-2 rounded-md bg-background">{v.licensePlate}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'Safety Officer' && safetyMetrics && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
             <div className="flex justify-between pb-2"><h3 className="text-sm font-medium">Compliance Score</h3><ShieldCheck className="h-4 w-4 text-muted-foreground" /></div>
             <div className="text-3xl font-bold text-primary">{safetyMetrics.complianceScore}%</div>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
             <div className="flex justify-between pb-2"><h3 className="text-sm font-medium">Suspended Drivers</h3><AlertTriangle className="h-4 w-4 text-muted-foreground" /></div>
             <div className="text-3xl font-bold text-destructive">{safetyMetrics.suspendedCount}</div>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
             <div className="flex justify-between pb-2"><h3 className="text-sm font-medium">Vehicles In Shop</h3><Wrench className="h-4 w-4 text-muted-foreground" /></div>
             <div className="text-3xl font-bold text-orange-500">{safetyMetrics.inShopCount}</div>
          </div>
          <div className="col-span-3 p-6 rounded-xl border border-border bg-card shadow-sm mt-4">
             <h3 className="text-lg font-medium mb-4">Licenses Expiring in &lt; 30 Days</h3>
             <table className="w-full text-sm text-left">
               <thead className="text-muted-foreground border-b border-border">
                 <tr><th className="py-2">Driver</th><th className="py-2">License #</th><th className="py-2">Expiry Date</th></tr>
               </thead>
               <tbody>
                 {safetyMetrics.expiringDrivers.map((d: any) => (
                   <tr key={d.id} className="border-b border-border/50">
                     <td className="py-2">{d.user.name}</td><td className="py-2">{d.licenseNumber}</td><td className="py-2 text-destructive">{new Date(d.licenseExpiry).toLocaleDateString()}</td>
                   </tr>
                 ))}
                 {safetyMetrics.expiringDrivers.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No drivers expiring soon.</td></tr>}
               </tbody>
             </table>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium">Total Vehicles</h3>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">{totalVehicles}</div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium">Active on Trips</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-primary">{activeVehicles}</div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium">Utilization Rate</h3>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-green-500">{utilizationRate}%</div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium">In Maintenance</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-destructive">{inShopVehicles}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-6 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-4">Fleet Fuel Efficiency (MPG)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="efficiency" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 p-6 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-4">Vehicle Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {vehicleStatusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>
        
        {user?.role === 'Financial Analyst' && financialMetrics && (
          <div className="col-span-7 p-6 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="text-lg font-medium mb-4 flex justify-between items-center">
              Vehicle Cost Ranking (Cost per Trip)
              <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded">Export CSV</button>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground border-b border-border">
                  <tr><th className="py-2">Vehicle Plate</th><th className="py-2 text-right">Total Cost</th><th className="py-2 text-right">Trips</th><th className="py-2 text-right">Cost / Trip</th></tr>
                </thead>
                <tbody>
                  {financialMetrics.costRanking.map((v: any) => (
                    <tr key={v.vehicleId} className="border-b border-border/50">
                      <td className="py-2 font-medium">{v.licensePlate}</td>
                      <td className="py-2 text-right">${v.totalCost.toFixed(2)}</td>
                      <td className="py-2 text-right">{v.tripsCount}</td>
                      <td className="py-2 text-right text-destructive font-semibold">${v.costPerTrip.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

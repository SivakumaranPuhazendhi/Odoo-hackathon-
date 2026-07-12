import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Truck, Users, MapPin, Wrench, DollarSign, Moon, Sun, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Trips from './pages/Trips';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Maintenance from './pages/Maintenance';
import AuditLog from './pages/AuditLog';
import Login from './pages/Login';
import MyTrips from './pages/MyTrips';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { io } from 'socket.io-client';
import { ShieldCheck } from 'lucide-react';
import { useContext } from 'react';

const socket = io('http://localhost:3001');

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(true);
  const [maintenanceAlert, setMaintenanceAlert] = useState<{ plate: string, drop: number } | null>(null);
  const [driverExpiryWarning, setDriverExpiryWarning] = useState<{ date: string } | null>(null);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    if (user?.role === 'Driver') {
      fetch('http://localhost:3001/api/driver/me')
        .then(res => res.json())
        .then(data => {
          if (data && data.licenseExpiry) {
            const expiryDate = new Date(data.licenseExpiry);
            const now = new Date();
            const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 14 && diffDays >= 0) {
              setDriverExpiryWarning({ date: expiryDate.toLocaleDateString() });
            } else if (diffDays < 0) {
              setDriverExpiryWarning({ date: 'EXPIRED' });
            }
          }
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    socket.on('fleetUpdate', (event) => {
      console.log('Live update received:', event);
      if (event.type === 'MaintenanceFlagged') {
        setMaintenanceAlert({ plate: event.data.plate, drop: event.data.drop });
      }
      window.dispatchEvent(new Event('resize')); 
    });
    return () => { socket.off('fleetUpdate'); };
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const hasRole = (roles: string[]) => user && roles.includes(user.role);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-primary">TransitOps</h1>
          {user && <p className="text-sm text-muted-foreground mt-1">Hello, {user.name}</p>}
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem to="/" icon={Home} label="Dashboard" />
          {hasRole(['Fleet Manager', 'Safety Officer']) && <SidebarItem to="/vehicles" icon={Truck} label="Vehicles" />}
          {hasRole(['Fleet Manager', 'Safety Officer']) && <SidebarItem to="/drivers" icon={Users} label="Drivers" />}
          {hasRole(['Fleet Manager']) && <SidebarItem to="/trips" icon={MapPin} label="Dispatch Trips" />}
          {hasRole(['Driver']) && <SidebarItem to="/my-trips" icon={MapPin} label="My Trips" />}
          {hasRole(['Fleet Manager', 'Financial Analyst', 'Safety Officer']) && <SidebarItem to="/maintenance" icon={Wrench} label="Maintenance Logs" />}
          {hasRole(['Fleet Manager', 'Safety Officer']) && <SidebarItem to="/audit" icon={ShieldCheck} label="Audit Log" />}
          {hasRole(['Fleet Manager', 'Financial Analyst']) && <SidebarItem to="/expenses" icon={DollarSign} label="Fuel & Expenses" />}
        </nav>
        <div className="p-4 border-t border-border flex flex-col gap-2">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {driverExpiryWarning && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <strong>Action Required:</strong> Your license expires on {driverExpiryWarning.date}. You may be blocked from new trips soon!
              </div>
            </div>
          )}
          {maintenanceAlert && (
            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3 text-orange-500">
              <ShieldCheck className="h-5 w-5" />
              <div>
                <strong>Predictive Maintenance Alert:</strong> Vehicle {maintenanceAlert.plate} shows a {(maintenanceAlert.drop * 100).toFixed(0)}% drop in fuel efficiency. Please schedule an inspection.
              </div>
              <button onClick={() => setMaintenanceAlert(null)} className="ml-auto underline text-sm">Dismiss</button>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

const Placeholder = ({ title }: { title: string }) => <div>
  <h2 className="text-3xl font-bold tracking-tight mb-4">{title}</h2>
  <div className="p-6 rounded-xl bg-card border border-border text-muted-foreground">
    {title} content coming soon...
  </div>
</div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/vehicles" element={<ProtectedRoute roles={['Fleet Manager', 'Safety Officer']}><Vehicles /></ProtectedRoute>} />
                <Route path="/drivers" element={<ProtectedRoute roles={['Fleet Manager', 'Safety Officer']}><Drivers /></ProtectedRoute>} />
                <Route path="/trips" element={<ProtectedRoute roles={['Fleet Manager']}><Trips /></ProtectedRoute>} />
                <Route path="/my-trips" element={<ProtectedRoute roles={['Driver']}><MyTrips /></ProtectedRoute>} />
                <Route path="/maintenance" element={<ProtectedRoute roles={['Fleet Manager', 'Safety Officer', 'Financial Analyst']}><Maintenance /></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute roles={['Fleet Manager', 'Safety Officer']}><AuditLog /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute roles={['Fleet Manager', 'Financial Analyst']}><Placeholder title="Fuel & Expenses" /></ProtectedRoute>} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

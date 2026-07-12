import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">TransitOps</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        
        {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input 
              required
              type="email"
              className="w-full p-2 rounded-md border border-input bg-background"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="manager@transitops.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input 
              required
              type="password"
              className="w-full p-2 rounded-md border border-input bg-background"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2 rounded-md transition-colors">
            Login
          </button>
        </form>
        
        <div className="text-xs text-muted-foreground text-center mt-4">
          Demo Accounts (password: password):<br/>
          manager@transitops.com (Fleet Manager)<br/>
          safety@transitops.com (Safety Officer)<br/>
          finance@transitops.com (Financial Analyst)<br/>
          driver1@transitops.com (Driver)
        </div>
      </div>
    </div>
  );
}

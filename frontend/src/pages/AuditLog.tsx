import { useState, useEffect } from 'react';

interface AuditLogEntry {
  id: number;
  eventType: string;
  entityType: string;
  entityId: number;
  detail: string;
  actor: string;
  createdAt: string;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/audit-log')
      .then(r => r.json())
      .then(setLogs)
      .catch(console.error);
  }, []);

  const getTypeColor = (type: string) => {
    if (type.includes('Blocked')) return 'bg-destructive/10 text-destructive';
    if (type.includes('Dispatched')) return 'bg-green-500/10 text-green-500';
    if (type.includes('Maintenance')) return 'bg-orange-500/10 text-orange-500';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-muted-foreground">Immutable record of all state transitions and rule evaluations.</p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Event Type</th>
              <th className="px-6 py-4">Entity</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Actor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(log.eventType)}`}>
                    {log.eventType}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">
                  {log.entityType} #{log.entityId}
                </td>
                <td className="px-6 py-4">{log.detail}</td>
                <td className="px-6 py-4 text-muted-foreground">{log.actor}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No audit logs generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

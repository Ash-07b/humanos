import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, Clock, User, Shield, RefreshCw, Server } from 'lucide-react';
import { fetchActivityLogs } from '../services/api';

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchActivityLogs(100);
      if (res && res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div>
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">System Audit Log Trail ({logs.length})</h3>
            <p className="panel-subtitle">Chronological record of administrative operations and platform activity</p>
          </div>
          <button className="btn-secondary" onClick={loadLogs} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Logs</span>
          </button>
        </div>

        {error && (
          <div className="alert-box alert-error" style={{ marginBottom: '16px' }}>
            <span>{error}</span>
          </div>
        )}

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator / User</th>
                <th>Module</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No activity log records found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id || log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <Clock size={13} />
                        <span>
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{log.userName || 'System'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.userEmail || 'system@humanos.local'}</div>
                    </td>

                    <td>
                      <span className="badge badge-admin" style={{ fontSize: '10.5px' }}>
                        {log.module}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', color: '#A5B4FC' }}>{log.action}</div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '340px' }}>
                        {log.details || '—'}
                      </div>
                    </td>

                    <td>
                      <code style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {log.ipAddress || '127.0.0.1'}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

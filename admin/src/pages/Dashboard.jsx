import React, { useState, useEffect } from 'react';
import {
  Users,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { fetchDashboardOverview } from '../services/api';

export default function Dashboard({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDashboardOverview();
      if (res && res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading real-time MongoDB administrative telemetry...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="alert-box alert-error" style={{ margin: '20px 0' }}>
        <span>{error}</span>
      </div>
    );
  }

  const users = data?.users || {};
  const modules = data?.modules || {};
  const recentUsers = data?.recentUsers || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div>
      {/* Main Panel Grid */}
      <div className="panel-grid">
        {/* Recent Users Table */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Recently Registered Users</h3>
              <p className="panel-subtitle">Latest accounts created across HumanOS</p>
            </div>
            {onNavigateTab && (
              <button
                className="btn-secondary"
                onClick={() => onNavigateTab('users')}
                style={{ fontSize: '11.5px', padding: '6px 10px' }}
              >
                <span>View Directory</span>
                <ArrowUpRight size={13} />
              </button>
            )}
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No registered users found
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '12px',
                              color: '#A5B4FC',
                            }}
                          >
                            {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{u.fullName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-client'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.status === 'ACTIVE' ? 'badge-active' : 'badge-disabled'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Audit Activity Feed</h3>
              <p className="panel-subtitle">Real-time administrator & system events</p>
            </div>
            {onNavigateTab && (
              <button
                className="btn-secondary"
                onClick={() => onNavigateTab('activity')}
                style={{ fontSize: '11.5px', padding: '6px 10px' }}
              >
                <span>Full Trail</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                No recent activity events recorded
              </div>
            ) : (
              recentActivity.map((log) => (
                <div
                  key={log._id || log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#818CF8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '2px',
                    }}
                  >
                    <Clock size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {log.details || log.module}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {log.userName} • {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

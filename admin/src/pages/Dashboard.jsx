import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  ListTodo,
  Target,
  HeartPulse,
  WalletCards,
  FileText,
  Bell,
  Sparkles,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import StatCard from '../components/StatCard';
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
      {/* Top 4 System Metrics */}
      <div className="stats-grid">
        <StatCard
          label="Total Registered Users"
          value={users.total || 0}
          subtext={`${users.clients || 0} Clients • ${users.admins || 0} Admins`}
          icon={Users}
          color="#6366F1"
          bg="rgba(99, 102, 241, 0.15)"
        />
        <StatCard
          label="Active Accounts"
          value={users.active || 0}
          subtext={`${users.total > 0 ? Math.round((users.active / users.total) * 100) : 0}% platform health`}
          icon={CheckCircle2}
          color="#10B981"
          bg="rgba(16, 185, 129, 0.15)"
        />
        <StatCard
          label="Disabled Accounts"
          value={users.disabled || 0}
          subtext="Access restricted"
          icon={XCircle}
          color="#EF4444"
          bg="rgba(239, 68, 68, 0.15)"
        />
        <StatCard
          label="AI Recommendations"
          value={modules.ai?.insightsGenerated || 0}
          subtext="Ollama llama3.2 generations"
          icon={Sparkles}
          color="#06B6D4"
          bg="rgba(6, 182, 212, 0.15)"
        />
      </div>

      {/* Module Overview Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Tasks Created</span>
            <ListTodo size={16} color="#6366F1" />
          </div>
          <div className="stat-value">{modules.tasks?.total || 0}</div>
          <div className="stat-subtext">{modules.tasks?.completed || 0} completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Goals Tracked</span>
            <Target size={16} color="#F59E0B" />
          </div>
          <div className="stat-value">{modules.goals?.total || 0}</div>
          <div className="stat-subtext">{modules.goals?.completed || 0} completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Health Telemetry</span>
            <HeartPulse size={16} color="#EC4899" />
          </div>
          <div className="stat-value">{modules.health?.records || 0}</div>
          <div className="stat-subtext">{modules.health?.medications || 0} medications</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Financial Activity</span>
            <WalletCards size={16} color="#10B981" />
          </div>
          <div className="stat-value">{modules.finance?.transactions || 0}</div>
          <div className="stat-subtext">Transactions logged</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Knowledge Notes</span>
            <FileText size={16} color="#8B5CF6" />
          </div>
          <div className="stat-value">{modules.notes?.total || 0}</div>
          <div className="stat-subtext">Captured items</div>
        </div>
      </div>

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

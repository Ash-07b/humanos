import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  Activity,
  Heart,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { fetchReports } from '../services/api';

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchReports();
      if (res && res.success) {
        setReports(res.reports);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch aggregate reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (loading && !reports) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Aggregating system statistics from MongoDB...</p>
      </div>
    );
  }

  if (error && !reports) {
    return (
      <div className="alert-box alert-error">
        <span>{error}</span>
      </div>
    );
  }

  const userStats = reports?.users || {};
  const prodStats = reports?.productivity || {};
  const healthDist = reports?.healthDistribution || [];
  const finCategories = reports?.financialCategories || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
        <button className="btn-secondary" onClick={loadReports} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Grid Row 1: Platform Health & Productivity */}
      <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '22px' }}>
        {/* User Account Distribution */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">User Base & Account Health</h3>
              <p className="panel-subtitle">Distribution of active versus restricted accounts</p>
            </div>
            <Users size={18} color="#6366F1" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Platform Ratio</span>
                <span style={{ fontWeight: '800', color: '#10B981' }}>{userStats.activePercentage || 0}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${userStats.activePercentage || 0}%`,
                    height: '100%',
                    backgroundColor: '#10B981',
                    borderRadius: '6px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div style={{ background: 'var(--bg-card-alt)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>ACTIVE USERS</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>
                  {userStats.active || 0}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-alt)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>DISABLED USERS</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#EF4444', marginTop: '4px' }}>
                  {userStats.disabled || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productivity Completion Metrics */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Productivity & Milestone Completion</h3>
              <p className="panel-subtitle">Goal execution and daily task completion efficiency</p>
            </div>
            <TrendingUp size={18} color="#10B981" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Task Completion Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Task Completion Rate</span>
                <span style={{ fontWeight: '800', color: '#6366F1' }}>
                  {prodStats.taskCompletionRate || 0}% ({prodStats.completedTasks || 0}/{prodStats.totalTasks || 0})
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${prodStats.taskCompletionRate || 0}%`,
                    height: '100%',
                    backgroundColor: '#6366F1',
                    borderRadius: '6px',
                  }}
                />
              </div>
            </div>

            {/* Goal Completion Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Goal Milestone Attainment</span>
                <span style={{ fontWeight: '800', color: '#F59E0B' }}>
                  {prodStats.goalCompletionRate || 0}% ({prodStats.completedGoals || 0}/{prodStats.totalGoals || 0})
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${prodStats.goalCompletionRate || 0}%`,
                    height: '100%',
                    backgroundColor: '#F59E0B',
                    borderRadius: '6px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Health & Finance Distributions */}
      <div className="panel-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Health Telemetry Breakdown */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Biometric Telemetry Distribution</h3>
              <p className="panel-subtitle">Logged health readings by vital category</p>
            </div>
            <Heart size={18} color="#EC4899" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {healthDist.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center', padding: '20px' }}>
                No health telemetry recorded yet
              </p>
            ) : (
              healthDist.map((item) => (
                <div
                  key={item.type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-card-alt)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>
                    {item.type}
                  </span>
                  <span style={{ fontWeight: '800', color: '#EC4899', fontSize: '14px' }}>
                    {item.count} logs
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Allocations */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Financial Flow Categories</h3>
              <p className="panel-subtitle">Aggregated transaction volumes</p>
            </div>
            <Wallet size={18} color="#06B6D4" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {finCategories.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center', padding: '20px' }}>
                No financial transactions recorded yet
              </p>
            ) : (
              finCategories.map((item) => (
                <div
                  key={item.category}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-card-alt)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '13px' }}>
                      {item.category}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.count} transactions</div>
                  </div>
                  <span style={{ fontWeight: '800', color: '#06B6D4', fontSize: '14px' }}>
                    FCFA {Number(item.amount).toLocaleString('en-US')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

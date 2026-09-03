import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Check,
  AlertTriangle,
  Cpu,
  Shield,
  Save,
  RefreshCw,
  Globe,
  Database,
  Lock,
} from 'lucide-react';
import { fetchSystemSettings, updateSystemSettings } from '../services/api';

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [appName, setAppName] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowClientRegistration, setAllowClientRegistration] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('XAF');
  const [telemetryRetentionDays, setTelemetryRetentionDays] = useState(365);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchSystemSettings();
      if (res && res.success && res.settings) {
        const s = res.settings;
        setSettings(s);
        setAppName(s.appName || 'HumanOS Executive Suite');
        setMaintenanceMode(Boolean(s.maintenanceMode));
        setAllowClientRegistration(s.allowClientRegistration !== false);
        setAiEnabled(s.aiEnabled !== false);
        setDefaultCurrency(s.defaultCurrency || 'XAF');
        setTelemetryRetentionDays(s.telemetryRetentionDays || 365);
      }
    } catch (err) {
      setError(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = {
        appName,
        maintenanceMode,
        allowClientRegistration,
        aiEnabled,
        defaultCurrency,
        telemetryRetentionDays: Number(telemetryRetentionDays),
      };

      const res = await updateSystemSettings(payload);
      if (res && res.success) {
        setNotice('System settings updated and saved to MongoDB successfully.');
        setTimeout(() => setNotice(''), 3500);
      }
    } catch (err) {
      setError(err.message || 'Failed to update system configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>Loading system configuration parameters...</p>
      </div>
    );
  }

  return (
    <div>
      {notice && (
        <div className="alert-box alert-success" style={{ marginBottom: '20px' }}>
          <Check size={16} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="panel-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          {/* General Platform Settings */}
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Application Parameters</h3>
                <p className="panel-subtitle">Core platform properties and global toggles</p>
              </div>
              <Globe size={18} color="#6366F1" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  APPLICATION TITLE
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    BASE CURRENCY CODE
                  </label>
                  <select
                    className="input-control"
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    style={{ background: '#080D1A' }}
                  >
                    <option value="XAF">XAF (FCFA - Central Africa)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                    <option value="GHS">GHS (₵ - Ghanaian Cedi)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    LOG RETENTION (DAYS)
                  </label>
                  <input
                    type="number"
                    className="input-control"
                    value={telemetryRetentionDays}
                    onChange={(e) => setTelemetryRetentionDays(e.target.value)}
                    min="30"
                    max="1825"
                  />
                </div>
              </div>

              {/* Maintenance Mode Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  background: 'var(--bg-card-alt)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#FFFFFF' }}>Maintenance Mode</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Restricts client access during scheduled updates
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#6366F1', cursor: 'pointer' }}
                />
              </div>

              {/* Allow Client Registration Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  background: 'var(--bg-card-alt)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#FFFFFF' }}>Client Registrations</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Allow new mobile client accounts to be registered
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowClientRegistration}
                  onChange={(e) => setAllowClientRegistration(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* AI Intelligence & Security Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* AI Engine Status */}
            <div className="panel-card">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">AI Engine Intelligence</h3>
                  <p className="panel-subtitle">Local Ollama instance connectivity</p>
                </div>
                <Cpu size={18} color="#06B6D4" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-card-alt)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>ACTIVE AI MODEL</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#06B6D4', marginTop: '2px' }}>
                    {settings?.aiModel || 'llama3.2'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card-alt)', padding: '12px 14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>OLLAMA ENDPOINT</div>
                  <div style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    http://127.0.0.1:11434
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--bg-card-alt)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>AI Health & Briefings Active</span>
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#06B6D4', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Security Isolation Status */}
            <div className="panel-card">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Security & Environment</h3>
                  <p className="panel-subtitle">Server-side credentials isolation</p>
                </div>
                <Shield size={18} color="#10B981" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399' }}>
                  <Check size={14} />
                  <span>MongoDB Atlas credentials hidden on backend</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399' }}>
                  <Check size={14} />
                  <span>JWT_SECRET protected behind auth middleware</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34D399' }}>
                  <Check size={14} />
                  <span>Password hashes excluded from all API responses</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={15} />
            <span>{saving ? 'Saving Settings...' : 'Save Configuration Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

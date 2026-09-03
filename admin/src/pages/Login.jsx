import React, { useState } from 'react';
import { ShieldAlert, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both administrator email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password.trim());
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={28} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <h2 className="login-title">HumanOS Admin</h2>
          <p className="login-subtitle">Executive System Administration Portal</p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              ADMINISTRATOR EMAIL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-control"
                placeholder="admin@humanos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              SECURITY PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-control"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '6px' }}
            disabled={loading}
          >
            {loading ? (
              <span>Verifying Admin Authorization...</span>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Strictly restricted to authorized administrative personnel. All connection attempts are audited and logged in MongoDB.
          </p>
        </div>
      </div>
    </div>
  );
}

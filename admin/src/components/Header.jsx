import React, { useState, useEffect } from 'react';
import { RotateCw, Server, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { checkServerHealth } from '../services/api';

export default function Header({ title, kicker = 'Administrative Suite', onRefresh, refreshing }) {
  const { admin } = useAuth();
  const [isServerOnline, setIsServerOnline] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const testHealth = async () => {
      const online = await checkServerHealth();
      if (isMounted) setIsServerOnline(online);
    };
    testHealth();
    const interval = setInterval(testHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-kicker">{kicker}</span>
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        <div
          className="system-status-pill"
          style={{
            backgroundColor: isServerOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: isServerOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: isServerOnline ? '#6EE7B7' : '#FCA5A5',
          }}
        >
          <div
            className="status-dot-pulse"
            style={{
              backgroundColor: isServerOnline ? '#10B981' : '#EF4444',
              boxShadow: isServerOnline ? '0 0 8px #10B981' : '0 0 8px #EF4444',
            }}
          />
          <span>{isServerOnline ? 'PORT 5000 • CONNECTED' : 'PORT 5000 • OFFLINE'}</span>
        </div>

        {onRefresh && (
          <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
            <RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        )}
      </div>
    </header>
  );
}

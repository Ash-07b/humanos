import React from 'react';
import { RotateCw, Server, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title, kicker = 'Administrative Suite', onRefresh, refreshing }) {
  const { admin } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <span className="header-kicker">{kicker}</span>
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className="system-status-pill">
          <div className="status-dot-pulse" />
          <span>PORT 5000 • MONGO CONNECTED</span>
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

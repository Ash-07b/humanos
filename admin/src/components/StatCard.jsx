import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, color = '#6366F1', bg = 'rgba(99, 102, 241, 0.15)' }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon-wrapper" style={{ backgroundColor: bg, color }}>
            <Icon size={18} strokeWidth={2.4} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}

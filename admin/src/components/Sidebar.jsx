import React from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Activity,
  Sliders,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { admin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'reports', label: 'Reports & Stats', icon: BarChart3 },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'System Settings', icon: Sliders },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <ShieldCheck size={22} color="#FFFFFF" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-title">HumanOS</span>
            <span className="brand-badge">Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} strokeWidth={2.2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Admin Profile & Logout */}
      <div className="sidebar-footer">
        <div className="admin-profile-card">
          <div className="admin-avatar">
            {admin?.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="admin-info">
            <div className="admin-name">{admin?.fullName || 'Administrator'}</div>
            <div className="admin-role">SYSTEM ADMIN</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign Out">
            <LogOut size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </aside>
  );
}

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManaggeUsers';
import Reports from './pages/Reports';
import Activity from './pages/Activity';
import SystemSettings from './pages/SystemSettings';
import './index.css';

function AdminAppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="login-screen">
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          <p>Initializing HumanOS Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Executive Overview', kicker: 'System Telemetry & Health' };
      case 'users':
        return { title: 'User Management', kicker: 'Account Directory & Access Control' };
      case 'reports':
        return { title: 'Reports & Analytics', kicker: 'System Aggregations' };
      case 'activity':
        return { title: 'Audit Trail', kicker: 'System Activity Logs' };
      case 'settings':
        return { title: 'System Configuration', kicker: 'Global Platform Preferences' };
      default:
        return { title: 'Admin Console', kicker: 'Executive Suite' };
    }
  };

  const { title, kicker } = getPageMeta();

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="main-content-wrapper">
        <Header
          title={title}
          kicker={kicker}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
        />

        <main className="page-body">
          {activeTab === 'dashboard' && (
            <Dashboard key={refreshKey} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'users' && <ManageUsers key={refreshKey} />}
          {activeTab === 'reports' && <Reports key={refreshKey} />}
          {activeTab === 'activity' && <Activity key={refreshKey} />}
          {activeTab === 'settings' && <SystemSettings key={refreshKey} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminAppContent />
    </AuthProvider>
  );
}

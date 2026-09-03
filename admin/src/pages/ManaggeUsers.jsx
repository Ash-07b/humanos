import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Eye,
  Shield,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { fetchUsers, updateUserStatus, fetchUserById } from '../services/api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchUsers({
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
      });
      if (res && res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const showToast = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleToggleStatus = async (user) => {
    if (user.role === 'ADMIN') {
      alert('Security Protection: Administrator accounts cannot be disabled.');
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'DISABLED' ? 'DISABLE' : 'ACTIVATE'} ${user.fullName} (${user.email})?`;
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await updateUserStatus(user._id || user.id, nextStatus);
      if (res && res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id || u.id === user.id ? { ...u, status: nextStatus } : u
          )
        );
        if (selectedUser && (selectedUser._id === user._id || selectedUser.id === user.id)) {
          setSelectedUser((prev) => ({ ...prev, status: nextStatus }));
        }
        showToast(`User account is now ${nextStatus.toLowerCase()}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (userId) => {
    setDetailsLoading(true);
    try {
      const res = await fetchUserById(userId);
      if (res && res.success) {
        setSelectedUser({ ...res.user, engagement: res.engagement });
      }
    } catch (err) {
      alert('Failed to load full user profile details');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      {/* Notice Toast */}
      {notice && (
        <div className="alert-box alert-success" style={{ marginBottom: '18px' }}>
          <Check size={16} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '18px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px', maxWidth: '420px' }}
        >
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '10px 14px' }}>
            <Search size={15} />
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>STATUS:</span>
            {['All', 'ACTIVE', 'DISABLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === st ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                  borderColor: statusFilter === st ? '#6366F1' : 'var(--border-color)',
                  color: statusFilter === st ? '#A5B4FC' : 'var(--text-secondary)',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>ROLE:</span>
            {['All', 'CLIENT', 'ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  border: '1px solid',
                  cursor: 'pointer',
                  backgroundColor: roleFilter === r ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-card)',
                  borderColor: roleFilter === r ? '#6366F1' : 'var(--border-color)',
                  color: roleFilter === r ? '#A5B4FC' : 'var(--text-secondary)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">User Accounts ({users.length})</h3>
            <p className="panel-subtitle">Authenticated clients and system administrators</p>
          </div>
          <button className="btn-secondary" onClick={loadUsers} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Engagement</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No users matching current criteria
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u._id || u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: isAdmin ? '#312E81' : '#1E293B',
                              color: isAdmin ? '#A5B4FC' : '#94A3B8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '13px',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{u.fullName}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>{u.phoneNumber || '—'}</td>

                      <td>
                        <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-client'}`}>
                          {u.role}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${isActive ? 'badge-active' : 'badge-disabled'}`}>
                          {u.status}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {u.stats ? (
                            <span>
                              {u.stats.tasks} Tasks • {u.stats.goals} Goals • {u.stats.healthRecords} Health
                            </span>
                          ) : (
                            '—'
                          )}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => handleViewDetails(u._id || u.id)}
                            title="View Profile Details"
                          >
                            <Eye size={13} />
                          </button>

                          {!isAdmin ? (
                            <button
                              className={isActive ? 'btn-danger' : 'btn-success'}
                              onClick={() => handleToggleStatus(u)}
                              disabled={actionLoading}
                              title={isActive ? 'Disable User Access' : 'Activate User Access'}
                            >
                              {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                              <span>{isActive ? 'Disable' : 'Activate'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '0 6px' }}>
                              Protected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#312E81',
                    color: '#A5B4FC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '800',
                  }}
                >
                  {selectedUser.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF' }}>{selectedUser.fullName}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-card-alt)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ROLE</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedUser.role}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-alt)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ACCOUNT STATUS</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: selectedUser.status === 'ACTIVE' ? '#10B981' : '#EF4444', marginTop: '2px' }}>
                  {selectedUser.status}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-alt)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>PHONE NUMBER</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedUser.phoneNumber || 'Not specified'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-alt)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>DATE OF BIRTH</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'Not specified'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-alt)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>GENDER</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedUser.gender || 'Not specified'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card-alt)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>JOINED DATE</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            {selectedUser.engagement && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  User Activity Footprint
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#6366F1' }}>{selectedUser.engagement.tasks || 0}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tasks</div>
                  </div>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#F59E0B' }}>{selectedUser.engagement.goals || 0}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Goals</div>
                  </div>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#EC4899' }}>{selectedUser.engagement.healthRecords || 0}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Health Records</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedUser.role !== 'ADMIN' && (
                <button
                  className={selectedUser.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}
                  onClick={() => handleToggleStatus(selectedUser)}
                  disabled={actionLoading}
                >
                  {selectedUser.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

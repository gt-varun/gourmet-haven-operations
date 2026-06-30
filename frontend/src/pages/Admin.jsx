import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  X,
  Store,
  Beef
} from 'lucide-react';

const Admin = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [activeUser, setActiveUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    branchId: '',
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || 'Failed to load staff list');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch branches if SUPER_ADMIN
  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (currentUser.role === 'SUPER_ADMIN') {
      fetchBranches();
    }
  }, [currentUser.role, fetchUsers]);

  // Open add modal
  const openAddModal = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'CASHIER',
      branchId: currentUser.role === 'SUPER_ADMIN' ? '' : currentUser.branchId?._id || '',
      hasIngredientsAccess: false,
    });
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModal = (u) => {
    setActiveUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      password: '', // Leave blank unless changing
      role: u.role,
      branchId: u.branchId?._id || '',
      hasIngredientsAccess: u.hasIngredientsAccess || false,
    });
    setShowEditModal(true);
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);

  // Submit User Create
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchUsers();
      } else {
        alert(data.message || 'Error creating user');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Submit User Edit
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      // If password field is empty, delete it from payload
      const payload = { ...userForm };
      if (!payload.password) delete payload.password;

      const res = await fetch(`/api/users/${activeUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchUsers();
      } else {
        alert(data.message || 'Error updating user');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Soft delete / deactivate user
  const handleDeleteUser = async (userId) => {
    if (userId === currentUser._id) {
      alert('You cannot deactivate your own account!');
      return;
    }
    if (!window.confirm('Are you sure you want to deactivate this staff account?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || 'Error deactivating user');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Inline toggle ingredients access for a cashier
  const handleToggleIngredients = async (userId, currentValue) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasIngredientsAccess: !currentValue }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || 'Error toggling permission');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div>
      <div className="header-container">
        <div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: '22px', color: '#e63946', marginBottom: '-2px', fontWeight: 700 }}>— Gourmet Haven —</div>
          <h1 className="header-title" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}>Staff Management</h1>
          <p className="header-subtitle">Create and configure user roles and permissions</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={openAddModal}>
            <UserPlus size={16} />
            <span>Add Staff Account</span>
          </button>
          <button className="btn-secondary" style={{ padding: '10px' }} onClick={fetchUsers}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-banner-danger">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search and control */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div className="input-with-icon" style={{ width: '300px' }}>
          <Search className="input-icon" size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(90, 58, 26, 0.1)',
            borderTopColor: '#e63946',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No staff accounts found.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Role Badge</th>
                <th>Branch Assignment</th>
                <th style={{ textAlign: 'center' }}>Ingredients Access</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const canEdit =
                  currentUser.role === 'SUPER_ADMIN' ||
                  (currentUser.role === 'ADMIN' && u.role === 'CASHIER' && u.branchId?._id === currentUser.branchId?._id);

                return (
                  <tr key={u._id} style={{ opacity: u._id === currentUser._id ? 0.85 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {u._id === currentUser._id ? (
                          <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                        ) : (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                        )}
                        <strong>{u.name}</strong> {u._id === currentUser._id && <span style={{ fontSize: '11px', color: 'var(--primary)' }}>(You)</span>}
                      </div>
                    </td>
                    <td><code>{u.email}</code></td>
                    <td>
                      <span className={`user-role-badge badge-${u.role.toLowerCase()}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {u.role === 'SUPER_ADMIN' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Global (All Branches)</span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                          <Store size={12} style={{ color: 'var(--text-muted)' }} />
                          {u.branchId?.name || 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {u.role === 'CASHIER' ? (
                        <button
                          className={`toggle-switch ${u.hasIngredientsAccess ? 'active' : ''}`}
                          onClick={() => handleToggleIngredients(u._id, u.hasIngredientsAccess)}
                          title={u.hasIngredientsAccess ? 'Revoke Ingredients Access' : 'Grant Ingredients Access'}
                        >
                          <span className="toggle-knob" />
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' ? 'Full Access' : '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {canEdit ? (
                        <>
                          <button
                            className="btn-icon"
                            title="Edit Staff details"
                            onClick={() => openEditModal(u)}
                          >
                            <Edit2 size={14} style={{ color: '#3b82f6' }} />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Deactivate Staff account"
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u._id === currentUser._id}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Create Staff Account</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. David Miller"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="david.m@gourmethaven.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Access Role</label>
                  {currentUser.role === 'SUPER_ADMIN' ? (
                    <select
                      className="form-select"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      required
                    >
                      <option value="CASHIER">CASHIER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      value="CASHIER"
                      disabled
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Outlet Scoping</label>
                  {currentUser.role === 'SUPER_ADMIN' ? (
                    <select
                      className="form-select"
                      value={userForm.branchId}
                      onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                      required={userForm.role !== 'SUPER_ADMIN'}
                      disabled={userForm.role === 'SUPER_ADMIN'}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      value={currentUser.branchId?.name || 'Current Branch'}
                      disabled
                    />
                  )}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Edit Staff Profile</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  minLength={6}
                />
              </div>

              {currentUser.role === 'SUPER_ADMIN' && activeUser && activeUser._id !== currentUser._id && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Access Role</label>
                    <select
                      className="form-select"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      required
                    >
                      <option value="CASHIER">CASHIER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Outlet Scoping</label>
                    <select
                      className="form-select"
                      value={userForm.branchId}
                      onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                      required={userForm.role !== 'SUPER_ADMIN'}
                      disabled={userForm.role === 'SUPER_ADMIN'}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                Save Profile Details
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Admin;

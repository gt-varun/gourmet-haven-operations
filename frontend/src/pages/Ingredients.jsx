import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Beef,
  PlusCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  Store
} from 'lucide-react';

const Ingredients = () => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [activeIngredient, setActiveIngredient] = useState(null);
  const [ingForm, setIngForm] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    branchId: '',
  });

  // Fetch ingredients
  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const branchParam = user.role === 'SUPER_ADMIN' && selectedBranchId
        ? `?branchId=${selectedBranchId}`
        : '';
      const res = await fetch(`/api/ingredients${branchParam}`);
      const data = await res.json();
      if (data.success) {
        setIngredients(data.ingredients);
      } else {
        setError(data.message || 'Failed to load ingredients');
      }
    } catch (err) {
      setError('Connection to API server failed');
    } finally {
      setLoading(false);
    }
  }, [user.role, selectedBranchId]);

  // Fetch branches if SUPER_ADMIN
  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success && data.branches.length > 0) {
        setBranches(data.branches);
        setSelectedBranchId(data.branches[0]._id); // Auto-select first branch
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user.role === 'SUPER_ADMIN') {
      fetchBranches();
    } else {
      fetchIngredients();
    }
  }, [user.role]);

  useEffect(() => {
    if (user.role === 'SUPER_ADMIN' && selectedBranchId) {
      fetchIngredients();
    }
  }, [selectedBranchId, fetchIngredients, user.role]);

  // Open Add Modal
  const openAddModal = () => {
    setIngForm({
      name: '',
      quantity: '',
      unit: 'kg',
      branchId: user.role === 'SUPER_ADMIN' ? selectedBranchId : (user.branchId?._id || ''),
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (ing) => {
    setActiveIngredient(ing);
    setIngForm({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
    });
    setShowEditModal(true);
  };

  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch =
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.unit.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [ingredients, searchQuery]);

  // Add Ingredient Submit
  const handleAddIngredient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchIngredients();
      } else {
        alert(data.message || 'Error creating ingredient');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Edit Ingredient Submit
  const handleEditIngredient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/ingredients/${activeIngredient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchIngredients();
      } else {
        alert(data.message || 'Error updating ingredient');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Delete (soft) Ingredient
  const handleDeleteIngredient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) return;

    try {
      const res = await fetch(`/api/ingredients/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchIngredients();
      } else {
        alert(data.message || 'Error deleting ingredient');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="header-title">Ingredients stock</h1>
          <p className="header-subtitle">Manage ingredients stock levels for the kitchen</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={openAddModal}>
            <PlusCircle size={16} />
            <span>Add Ingredient</span>
          </button>
          <button className="btn-secondary" style={{ padding: '10px' }} onClick={fetchIngredients}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {user.role === 'SUPER_ADMIN' && (
        <div className="branch-selector-bar">
          <Store size={16} style={{ color: 'var(--primary)' }} />
          <label>Viewing Branch:</label>
          <select
            className="form-select"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-banner-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Control panel */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div className="input-with-icon" style={{ width: '300px' }}>
          <Search className="input-icon" size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main ingredients table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#5d6eff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No ingredients registered.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                <th>Ingredient Name</th>
                <th style={{ textAlign: 'center' }}>Current Stock</th>
                <th>Unit</th>
                {user.role === 'SUPER_ADMIN' && <th>Branch Assignment</th>}
                <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map((ing, idx) => (
                <tr key={ing._id}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Beef size={16} style={{ color: 'var(--primary)' }} />
                      <strong>{ing.name}</strong>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: ing.quantity === 0 ? '#f87171' : '#f3f4f6',
                        background: ing.quantity === 0 ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: ing.quantity === 0 ? '1px solid rgba(248,113,113,0.2)' : '1px solid var(--border-glow)'
                      }}
                    >
                      {ing.quantity}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}><code>{ing.unit}</code></td>
                  {user.role === 'SUPER_ADMIN' && (
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Store size={12} style={{ color: 'var(--text-muted)' }} />
                        {ing.branchId?.name || 'Global'}
                      </span>
                    </td>
                  )}
                  <td style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button
                      className="btn-icon"
                      title="Edit Quantity"
                      onClick={() => openEditModal(ing)}
                    >
                      <Edit2 size={14} style={{ color: '#3b82f6' }} />
                    </button>
                    <button
                      className="btn-icon danger"
                      title="Delete Ingredient"
                      onClick={() => handleDeleteIngredient(ing._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Add Kitchen Ingredient</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleAddIngredient}>
              <div className="form-group">
                <label className="form-label">Ingredient Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sugar, Chicken, Curd"
                  value={ingForm.name}
                  onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="10"
                    min="0"
                    value={ingForm.quantity}
                    onChange={(e) => setIngForm({ ...ingForm, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. kg, L, pcs"
                    value={ingForm.unit}
                    onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              {user.role === 'SUPER_ADMIN' && (
                <div className="form-group">
                  <label className="form-label">Branch Assignment</label>
                  <select
                    className="form-select"
                    value={ingForm.branchId}
                    onChange={(e) => setIngForm({ ...ingForm, branchId: e.target.value })}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                Add Ingredient
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Modify Ingredient Details</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleEditIngredient}>
              <div className="form-group">
                <label className="form-label">Ingredient Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={ingForm.name}
                  onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={ingForm.quantity}
                    onChange={(e) => setIngForm({ ...ingForm, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ingForm.unit}
                    onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                Save Changes
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

export default Ingredients;

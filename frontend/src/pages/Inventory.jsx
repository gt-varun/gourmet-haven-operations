import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  PackagePlus,
  Edit2,
  Trash2,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  X
} from 'lucide-react';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, LOW_STOCK
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Form states
  const [activeProduct, setActiveProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  // Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    price: '',
    taxRate: 18,
    stock: 0,
    reorderLevel: 10,
    category: '',
    imageUrl: '',
    branchId: '',
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        setError(data.message || 'Failed to load inventory');
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
    fetchProducts();
    if (user.role === 'SUPER_ADMIN') {
      fetchBranches();
    }
  }, [user.role, fetchProducts]);

  // Handle open Add Modal
  const openAddModal = () => {
    setProdForm({
      name: '',
      sku: '',
      price: '',
      taxRate: 18,
      stock: 0,
      reorderLevel: 10,
      category: '',
      imageUrl: '',
      branchId: user.role === 'SUPER_ADMIN' ? '' : user.branchId?._id || '',
    });
    setError(''); // Preserving original clear errors logic
    setShowAddModal(true);
  };

  // Handle open Edit Modal
  const openEditModal = (product) => {
    setActiveProduct(product);
    setProdForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      taxRate: product.taxRate,
      reorderLevel: product.reorderLevel,
      category: product.category,
      imageUrl: product.imageUrl || '',
    });
    setShowEditModal(true);
  };

  // Handle open Restock Modal
  const openRestockModal = (product) => {
    setActiveProduct(product);
    setRestockQty('');
    setShowRestockModal(true);
  };

  // Filtered listing
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isLowStock = p.stock <= p.reorderLevel;
      const matchesFilter = selectedFilter === 'ALL' || (selectedFilter === 'LOW' && isLowStock);

      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, selectedFilter]);

  // Submit product creation
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchProducts();
      } else {
        alert(data.message || 'Error creating product');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Submit product update
  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/products/${activeProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchProducts();
      } else {
        alert(data.message || 'Error updating product');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Submit product restock (Audited - FR-11, FR-16)
  const handleRestockProduct = async (e) => {
    e.preventDefault();
    if (!restockQty || Number(restockQty) <= 0) return;

    try {
      const res = await fetch(`/api/products/${activeProduct._id}/restock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(restockQty) }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRestockModal(false);
        fetchProducts();
      } else {
        alert(data.message || 'Error restocking product');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  // Handle product deletion (soft delete)
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      } else {
        alert(data.message || 'Error deleting product');
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
          <h1 className="header-title" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}>Inventory Catalog</h1>
          <p className="header-subtitle">Manage products, pricing, and stock replenishment</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-primary" onClick={openAddModal}>
            <PackagePlus size={16} />
            <span>Add Product</span>
          </button>
          <button className="btn-secondary" style={{ padding: '10px' }} onClick={fetchProducts}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-banner-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and search row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`filter-chip ${selectedFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('ALL')}
          >
            All Items
          </button>
          <button
            className={`filter-chip ${selectedFilter === 'LOW' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('LOW')}
          >
            Low Stock Watchlist
          </button>
        </div>

        <div className="input-with-icon" style={{ width: '300px' }}>
          <Search className="input-icon" size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by SKU or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main product table */}
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
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No products found matching your search.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Tax %</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th>Reorder Lvl</th>
                {user.role === 'SUPER_ADMIN' && <th>Branch</th>}
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.reorderLevel;

                return (
                  <tr key={p._id}>
                    <td><code>{p.sku}</code></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', background: '#f7ebd5', flexShrink: 0, border: '1px solid #e8dcc8' }}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '14px' }}>🍳</div>
                          )}
                        </div>
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>₹{p.price.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{p.taxRate}%</td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: isLowStock ? '#d97706' : '#10b981',
                          background: isLowStock ? 'rgba(217, 119, 6, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: isLowStock ? '1px solid rgba(217, 119, 6, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)'
                        }}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.reorderLevel}</td>
                    {user.role === 'SUPER_ADMIN' && <td>{p.branchId?.name || 'Global'}</td>}
                    <td style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        className="btn-icon"
                        title="Restock Inventory"
                        onClick={() => openRestockModal(p)}
                      >
                        <PlusCircle size={14} style={{ color: '#10b981' }} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Edit Details"
                        onClick={() => openEditModal(p)}
                      >
                        <Edit2 size={14} style={{ color: '#3b82f6' }} />
                      </button>
                      <button
                        className="btn-icon danger"
                        title="Deactivate Product"
                        onClick={() => handleDeleteProduct(p._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Add Catalog Product</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Truffle Fries"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="DF-001"
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Appetizers"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. /assets/img/social/truffle-fries.jpg"
                  value={prodForm.imageUrl}
                  onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="350"
                    min="0"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={prodForm.taxRate}
                    onChange={(e) => setProdForm({ ...prodForm, taxRate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={prodForm.reorderLevel}
                    onChange={(e) => setProdForm({ ...prodForm, reorderLevel: e.target.value })}
                    required
                  />
                </div>
              </div>

              {user.role === 'SUPER_ADMIN' && (
                <div className="form-group">
                  <label className="form-label">Target Branch Assignment</label>
                  <select
                    className="form-select"
                    value={prodForm.branchId}
                    onChange={(e) => setProdForm({ ...prodForm, branchId: e.target.value })}
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
                Create Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Edit Product Details</h2>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleEditProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={prodForm.imageUrl}
                  onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={prodForm.taxRate}
                    onChange={(e) => setProdForm({ ...prodForm, taxRate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reorder Level</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={prodForm.reorderLevel}
                  onChange={(e) => setProdForm({ ...prodForm, reorderLevel: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Restock Inventory Modal (Audited) */}
      {showRestockModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Restock Inventory</h2>
              <button className="btn-icon" onClick={() => setShowRestockModal(false)}><X size={16} /></button>
            </div>

            {activeProduct && (
              <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
                <div style={{ fontWeight: 600 }}>{activeProduct.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>SKU: {activeProduct.sku}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px' }}>
                  <span>Current Stock: <strong>{activeProduct.stock}</strong></span>
                  <span>Threshold: <strong>{activeProduct.reorderLevel}</strong></span>
                </div>
              </div>
            )}

            <form onSubmit={handleRestockProduct}>
              <div className="form-group">
                <label className="form-label">Restock Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 50"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                Confirm Restock
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

export default Inventory;

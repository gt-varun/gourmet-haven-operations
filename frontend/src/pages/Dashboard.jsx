import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  Store
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch branches if SUPER_ADMIN
  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.success) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  // Fetch dashboard metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/api/reports/dashboard';
      if (selectedBranch) {
        url += `?branchId=${selectedBranch}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      } else {
        setError(data.message || 'Failed to load report data');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (user.role === 'SUPER_ADMIN') {
      fetchBranches();
    }
  }, [user.role]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="header-title">Dashboard</h1>
          <p className="header-subtitle">
            {user.role === 'SUPER_ADMIN' ? 'Global insights across outlets' : `Outlets overview for ${user.branchId?.name}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user.role === 'SUPER_ADMIN' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                className="form-select"
                style={{ width: '180px', padding: '8px 12px' }}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={fetchMetrics}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

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
      ) : error ? (
        <div className="alert-banner alert-banner-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      ) : metrics ? (
        <>
          {/* Metrics summary cards */}
          <div className="metrics-grid">
            <div className="glass-card metric-card">
              <div className="metric-icon" style={{ background: 'rgba(93, 110, 255, 0.15)', color: '#5d6eff' }}>
                <TrendingUp size={24} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Today's Sales</span>
                <span className="metric-value">₹{metrics.salesToday}</span>
              </div>
            </div>

            <div className="glass-card metric-card">
              <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <ShoppingBag size={24} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Orders Filled</span>
                <span className="metric-value">{metrics.orderCountToday}</span>
              </div>
            </div>

            <div className="glass-card metric-card">
              <div className="metric-icon" style={{
                background: metrics.lowStockCount > 0 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.05)',
                color: metrics.lowStockCount > 0 ? '#fbbf24' : 'var(--text-muted)'
              }}>
                <AlertTriangle size={24} />
              </div>
              <div className="metric-info">
                <span className="metric-label">Low Stock Items</span>
                <span className="metric-value" style={{ color: metrics.lowStockCount > 0 ? '#fbbf24' : 'white' }}>
                  {metrics.lowStockCount}
                </span>
              </div>
            </div>
          </div>

          {/* Low Stock banner alerts (FR-12) */}
          {metrics.lowStockCount > 0 && (
            <div className="alert-banner alert-banner-warning">
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Low Stock Alert:</strong> {metrics.lowStockCount} products are running low on inventory.
                {user.role === 'CASHIER'
                  ? ' Please inform the branch manager to restock them.'
                  : ' Please review and restock them from the Inventory tab.'}
              </div>
            </div>
          )}

          {/* Tables Section */}
          <div className="dashboard-grid">
            {/* Top Items table */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-header">
                <h3 className="panel-title">Today's Top-Selling Items</h3>
              </div>
              
              {metrics.topSellingItems.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  No items sold today yet.
                </div>
              ) : (
                <div className="table-container" style={{ flexGrow: 1 }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th style={{ textAlign: 'center' }}>Quantity Sold</th>
                        <th style={{ textAlign: 'right' }}>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topSellingItems.map((item) => (
                        <tr key={item._id}>
                          <td><strong>{item.name}</strong></td>
                          <td style={{ textAlign: 'center' }}>{item.quantitySold}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{item.totalRevenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low stock items list */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-header">
                <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Low Stock Watchlist
                </h3>
              </div>

              {metrics.lowStockItems.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  All items are sufficiently stocked.
                </div>
              ) : (
                <div className="table-container" style={{ flexGrow: 1 }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th style={{ textAlign: 'center' }}>Stock</th>
                        <th>Threshold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.lowStockItems.slice(0, 5).map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div>{item.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.sku}</div>
                          </td>
                          <td style={{ textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>
                            {item.stock}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.reorderLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

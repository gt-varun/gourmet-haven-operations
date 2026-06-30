import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet,
  RefreshCw,
  Search,
  AlertTriangle,
  Info
} from 'lucide-react';

const AuditLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL'); // ALL, RESTOCK, VOID, DISCOUNT, USER
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      } else {
        setError(data.message || 'Failed to load audit logs');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(log.metadata).toLowerCase().includes(searchQuery.toLowerCase());

      let matchesAction = true;
      if (selectedAction === 'RESTOCK') matchesAction = log.action === 'INVENTORY_RESTOCK';
      else if (selectedAction === 'VOID') matchesAction = log.action === 'ORDER_VOID';
      else if (selectedAction === 'DISCOUNT') matchesAction = log.action === 'DISCOUNT_OVERRIDE';
      else if (selectedAction === 'USER') matchesAction = log.action === 'USER_CREATE' || log.action === 'ROLE_CHANGE';

      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, selectedAction]);

  // Translate metadata to clean English descriptions
  const translateMetadata = (log) => {
    const meta = log.metadata || {};
    switch (log.action) {
      case 'USER_CREATE':
        return `Created staff account for '${meta.email}' as role '${meta.role}'${meta.reactivated ? ' (Reactivated profile)' : ''}.`;
      case 'ROLE_CHANGE':
        if (meta.action === 'DEACTIVATE') {
          return `Deactivated staff account for '${meta.email}'.`;
        }
        if (meta.action === 'GRANT_INGREDIENTS') {
          return `Granted custom ingredients access to Cashier '${meta.email}'.`;
        }
        if (meta.action === 'REVOKE_INGREDIENTS') {
          return `Revoked custom ingredients access from Cashier '${meta.email}'.`;
        }
        const oldR = (meta.oldRole || '').replace('_', ' ');
        const newR = (meta.newRole || '').replace('_', ' ');
        return `Changed role of '${meta.email}' from '${oldR}' to '${newR}'.`;
      case 'ORDER_VOID':
        return `Voided invoice #${(log.entityId || '').toString().slice(-6).toUpperCase()} (Refunded: ₹${Number(meta.grandTotal).toFixed(2)} | Reason: "${meta.voidReason}").`;
      case 'INVENTORY_RESTOCK':
        return `Refilled '${meta.productName}' (SKU: ${meta.sku}) +${meta.addedQuantity} items. Stock increased from ${meta.oldStock} to ${meta.newStock}.`;
      case 'DISCOUNT_OVERRIDE':
        return `Applied ${meta.discountRate}% discount on Order #${(log.entityId || '').toString().slice(-6).toUpperCase()} (Saved: ₹${Number(meta.discountTotal).toFixed(2)} on Subtotal: ₹${Number(meta.originalSubtotal).toFixed(2)}).`;
      default:
        return JSON.stringify(meta);
    }
  };

  // Helper for action badges
  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'INVENTORY_RESTOCK':
        return { bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981', text: 'Restock' };
      case 'ORDER_VOID':
        return { bg: 'rgba(230, 57, 70, 0.08)', color: '#e63946', text: 'Order Void' };
      case 'DISCOUNT_OVERRIDE':
        return { bg: 'rgba(217, 119, 6, 0.08)', color: '#d97706', text: 'Discount Apply' };
      case 'USER_CREATE':
        return { bg: 'rgba(29, 78, 216, 0.08)', color: '#1d4ed8', text: 'Staff Join' };
      case 'ROLE_CHANGE':
        return { bg: 'rgba(109, 40, 217, 0.08)', color: '#6d28d9', text: 'Privilege Alter' };
      default:
        return { bg: 'rgba(90, 58, 26, 0.08)', color: 'var(--text-main)', text: action };
    }
  };

  return (
    <div>
      <div className="header-container">
        <div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: '22px', color: '#e63946', marginBottom: '-2px', fontWeight: 700 }}>— Gourmet Haven —</div>
          <h1 className="header-title" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}>Audit Logs</h1>
          <p className="header-subtitle">Immutable chronological ledger of sensitive operations (SUPER_ADMIN only)</p>
        </div>

        <button className="btn-secondary" style={{ padding: '10px' }} onClick={fetchLogs}>
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="alert-banner alert-banner-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Chips & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`filter-chip ${selectedAction === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedAction('ALL')}
          >
            All Actions
          </button>
          <button
            className={`filter-chip ${selectedAction === 'RESTOCK' ? 'active' : ''}`}
            onClick={() => setSelectedAction('RESTOCK')}
          >
            Refills
          </button>
          <button
            className={`filter-chip ${selectedAction === 'VOID' ? 'active' : ''}`}
            onClick={() => setSelectedAction('VOID')}
          >
            Voids
          </button>
          <button
            className={`filter-chip ${selectedAction === 'DISCOUNT' ? 'active' : ''}`}
            onClick={() => setSelectedAction('DISCOUNT')}
          >
            Discounts
          </button>
          <button
            className={`filter-chip ${selectedAction === 'USER' ? 'active' : ''}`}
            onClick={() => setSelectedAction('USER')}
          >
            Users
          </button>
        </div>

        <div className="input-with-icon" style={{ width: '300px' }}>
          <Search className="input-icon" size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by actor, action details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Table */}
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
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No audit logs recorded matching filters.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Timestamp</th>
                <th style={{ width: '150px' }}>Action Type</th>
                <th>Staff Account (Actor)</th>
                <th>Outlet</th>
                <th>Audit Ledger Entry</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const badge = getActionBadgeClass(log.action);
                return (
                  <tr key={log._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.color}20`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em'
                        }}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{log.actorId?.name || 'Staff Member'}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        <code>{log.actorEmail}</code>
                      </div>
                    </td>
                    <td>
                      {log.branchId ? (
                        <strong>{log.branchId.name}</strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Global</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', lineHeight: 1.4 }}>
                        <Info size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                        <span>{translateMetadata(log)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

export default AuditLog;

import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  FileSpreadsheet,
  LogOut,
  Store,
  Beef
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  // Determine allowed links based on role hierarchy
  const showDashboard = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  const showInventory = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  const showUsers = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  const showAuditLog = user.role === 'SUPER_ADMIN';
  const showIngredients = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.hasIngredientsAccess === true;

  const navItems = [];
  
  if (showDashboard) {
    navItems.push({ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> });
  }
  
  // POS is accessible to all
  navItems.push({ to: '/pos', label: 'POS Billing', icon: <ShoppingBag size={18} /> });
  
  if (showInventory) {
    navItems.push({ to: '/inventory', label: 'Inventory', icon: <Package size={18} /> });
  }
  
  if (showIngredients) {
    navItems.push({ to: '/ingredients', label: 'Ingredients', icon: <Beef size={18} /> });
  }
  
  if (showUsers) {
    navItems.push({ to: '/admin', label: 'Staff Management', icon: <Users size={18} /> });
  }
  
  if (showAuditLog) {
    navItems.push({ to: '/audit-log', label: 'Audit Logs', icon: <FileSpreadsheet size={18} /> });
  }

  // Helper to determine active path
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">H</div>
          <span className="logo-text">HotelPOS</span>
        </div>

        <nav style={{ flexGrow: 1 }}>
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.to} className={`nav-item ${isActive(item.to) ? 'active' : ''}`}>
                <NavLink to={item.to}>
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile / Logout footer */}
        <div className="user-profile-widget">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
              <span className={`user-role-badge badge-${user.role.toLowerCase()}`}>
                {user.role.replace('_', ' ')}
              </span>
              {user.branchId && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Store size={10} />
                  {user.branchId.name || 'Branch'}
                </span>
              )}
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

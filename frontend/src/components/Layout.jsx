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

  const bgImages = [
    '/assets/img/social/s62-sourdough.jpg',
    '/assets/img/social/s78-baguettes.jpg',
    '/assets/img/social/s90-vegetables.jpg'
  ];
  const [currentBgIndex, setCurrentBgIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  // Determine allowed links based on role hierarchy
  const showDashboard = true; // All authenticated users have dashboard access
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
      {/* Global Background Slideshow (Faded Brand Watermark) */}
      <div className="layout-slideshow">
        {bgImages.map((imgUrl, index) => (
          <img
            key={imgUrl}
            src={imgUrl}
            alt=""
            className={`layout-slide-img ${index === currentBgIndex ? 'active' : ''}`}
          />
        ))}
        <div className="layout-slideshow-overlay"></div>
      </div>
      {/* Top Header Navigation Bar */}
      <header className="top-navbar">
        <div className="logo-container" onClick={() => navigate('/')}>
          <div className="logo-icon">★</div>
          <span className="logo-text">Gourmet Haven</span>
        </div>

        <nav>
          <ul className="top-nav-menu">
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

        {/* User profile / Logout Header area */}
        <div className="top-profile-container">
          <div className="top-user-info">
            <span className="top-user-name">{user.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Background images for cross-fade slideshow
  const images = [
    '/assets/img/social/s62-sourdough.jpg',
    '/assets/img/social/s78-baguettes.jpg',
    '/assets/img/social/s90-vegetables.jpg'
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setFormError(result.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="login-page">
      {/* Background Slideshow */}
      <div className="login-slideshow">
        {images.map((imgUrl, index) => (
          <img
            key={imgUrl}
            src={imgUrl}
            alt=""
            className={`login-slide-img ${index === currentImageIndex ? 'active' : ''}`}
          />
        ))}
        <div className="login-slideshow-overlay"></div>
      </div>

      <div className="login-card glass-panel" style={{ zIndex: 10, background: '#ffffff', boxShadow: '0 20px 50px rgba(90, 58, 26, 0.15)' }}>
        <div className="login-header">
          <div 
            onClick={() => navigate('/')}
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '24px',
              color: '#5a3a1a',
              margin: '0 auto 12px auto',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            ★ Gourmet Haven
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Poppins', sans-serif" }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', fontWeight: 600 }}>
            POS & Inventory Management Platform
          </p>
        </div>

        {formError && (
          <div className="alert-banner alert-banner-danger">
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={16} />
              <input
                type="email"
                className="form-input"
                placeholder="you@gourmethaven.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={16} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>

      <style>{`
        .login-slideshow {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 1;
        }
        .login-slide-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1.05);
          transition: opacity 1.8s ease-in-out, transform 3s ease-out;
        }
        .login-slide-img.active {
          opacity: 1;
          transform: scale(1);
        }
        .login-slideshow-overlay {
          position: absolute;
          inset: 0;
          background: rgba(247, 235, 213, 0.68);
          backdrop-filter: blur(1px);
        }
      `}</style>
    </div>
  );
};

export default Login;

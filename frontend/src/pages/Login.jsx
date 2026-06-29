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
      // Re-fetch user to check role for redirection
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      
      if (userData.success && userData.user) {
        if (userData.user.role === 'CASHIER') {
          navigate('/pos');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/pos');
      }
    } else {
      setFormError(result.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div style={{
            width: '52px',
            height: '52px',
            background: 'var(--gradient-accent)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '28px',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 24px rgba(93, 110, 255, 0.3)'
          }}>
            H
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
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
    </div>
  );
};

export default Login;

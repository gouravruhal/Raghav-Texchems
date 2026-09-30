import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError('');
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(cleanEmail, password);

      if (!result.success) {
        setError(result.error || 'Invalid email or password.');
        return;
      }

      if (result.requiresMfaSetup) {
        navigate('/admin/setup-mfa', { replace: true });
        return;
      }

      if (result.requiresMfa) {
        navigate('/admin/mfa', { replace: true });
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-minimal-page">
      <div className="login-minimal-card">
        {/* Company Brand Header */}
        <div className="login-brand-section">
          <div className="login-logo-container">
            <div className="login-brand-icon">
              <FlaskConical size={28} color="#4A90E2" />
            </div>
            <div className="login-brand-titles">
              <h2 className="login-company-name">Raghav Texchems</h2>
              <span className="login-company-type">Chemical Private Limited</span>
              <span className="login-company-tagline">chemistry that connects</span>
            </div>
          </div>
        </div>

        <div className="login-divider" />

        {/* Sign In Header */}
        <div className="login-form-header">
          <h1 className="login-title">Administrator Portal</h1>
          <p className="login-subtitle">
            Sign in to manage catalog, inquiries & content
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="login-error-alert" role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate>
          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label htmlFor="login-email" className="form-label">
              Email Address
            </label>
            <div className="input-icon-container">
              <Mail size={16} className="input-left-icon" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="username"
                className="form-control with-icon"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <div className="input-icon-container">
              <Lock size={16} className="input-left-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="form-control with-icon with-right-btn"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="input-right-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading || !email.trim() || !password}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="login-card-footer">
          &copy; {new Date().getFullYear()} Raghav Texchems Chemical Pvt. Ltd.
        </div>
      </div>
    </div>
  );
};
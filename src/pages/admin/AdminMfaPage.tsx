import React, { useState } from 'react';
import { ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminMfaPage: React.FC = () => {
  const { verifyMfa, signOut } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyMfa(code);

    if (!result.success) {
      setError(result.error ?? 'Invalid code. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="login-minimal-page">
      <div className="login-minimal-card">
        <div className="login-minimal-header">
          <div className="login-brand-icon">
            <KeyRound size={26} color="#4A90E2" />
          </div>
          <h1 className="login-title">Verification Code</h1>
          <p className="login-subtitle">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {error && (
          <div className="login-error-alert" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ textAlign: 'center' }}>
              Authentication Code
            </label>
            <input
              className="form-control mfa-code-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={signOut}
          className="login-cancel-btn"
        >
          Cancel and return
        </button>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, Copy, Check, ArrowRight } from 'lucide-react';

export const AdminMfaSetupPage: React.FC = () => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const enroll = async () => {
      try {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'Raghav Texchems Admin',
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize MFA.');
      } finally {
        setLoading(false);
      }
    };

    enroll();
  }, []);

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit code from your app.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId,
        });

      if (challengeError) {
        setError(challengeError.message);
        setVerifying(false);
        return;
      }

      const { error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code,
        });

      if (verifyError) {
        setError('Invalid code. Please try again.');
        setVerifying(false);
        return;
      }

      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
      setVerifying(false);
    }
  };

  return (
    <div className="login-minimal-page">
      <div className="login-minimal-card" style={{ maxWidth: '440px' }}>
        <div className="login-minimal-header">
          <div className="login-brand-icon">
            <Shield size={26} color="#4A90E2" />
          </div>
          <h1 className="login-title">Authenticator Setup</h1>
          <p className="login-subtitle">
            Scan the QR code with your authenticator app
          </p>
        </div>

        {error && (
          <div className="login-error-alert" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#7F7F7F' }}>
            <div className="btn-spinner" style={{ margin: '0 auto 0.75rem', width: 24, height: 24, borderColor: '#D1D8E0', borderTopColor: '#4A90E2' }} />
            <span style={{ fontSize: '0.88rem' }}>Generating setup code...</span>
          </div>
        ) : (
          <>
            {qrCode && (
              <div className="qr-code-frame">
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(qrCode)}`}
                  alt="QR Code"
                  style={{ width: 180, height: 180, display: 'block' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#7F7F7F', fontWeight: 600 }}>
                  Manual key:
                </span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: copied ? '#50E3C2' : '#4A90E2',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <code className="manual-key-box">
                {secret}
              </code>
            </div>

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center' }}>
                  Enter 6-Digit Code
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
                  disabled={verifying}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary login-submit-btn"
                disabled={verifying || code.length !== 6}
              >
                {verifying ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Setup</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
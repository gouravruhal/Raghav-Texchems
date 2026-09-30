import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { logAdminAction } from '../../lib/audit';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

export const AdminMfaSetupPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showManualKey, setShowManualKey] = useState(false);

  // Prevent multiple simultaneous enrollment attempts in React StrictMode
  const enrollingRef = useRef(false);

  // Redirect to login if user session is invalid
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const initMfaEnrollment = useCallback(async () => {
    if (enrollingRef.current) return;
    enrollingRef.current = true;

    setLoading(true);
    setError('');

    try {
      // 1. Verify user session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('Session expired. Please sign in again.');
        setLoading(false);
        enrollingRef.current = false;
        return;
      }

      // 2. Clean up any existing unverified factors to prevent hitting Supabase's 10-factor limit
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      if (factorsData?.totp) {
        for (const factor of factorsData.totp) {
          if (factor.status === 'verified') {
            // Admin already has a verified factor!
            window.location.href = '/admin/dashboard';
            return;
          } else if (factor.status === 'unverified') {
            try {
              await supabase.auth.mfa.unenroll({ factorId: factor.id });
            } catch {
              // Ignore cleanup error and proceed
            }
          }
        }
      }

      // 3. Request new TOTP enrollment
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Raghav Texchems Admin',
      });

      if (enrollError || !data) {
        setError(enrollError?.message || 'Failed to initialize authenticator setup.');
        setLoading(false);
        enrollingRef.current = false;
        return;
      }

      setFactorId(data.id);
      setSecret(data.totp.secret);

      // 4. Generate high-resolution, rock-solid QR code
      let resolvedQr = '';

      // Priority A: Generate high-contrast PNG via QRCode from standard Supabase TOTP URI
      if (data.totp?.uri) {
        try {
          resolvedQr = await QRCode.toDataURL(data.totp.uri, {
            width: 240,
            margin: 1.5,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
        } catch (qrErr) {
          console.warn('QRCode.toDataURL failed, attempting fallback:', qrErr);
        }
      }

      // Priority B: If uri conversion didn't run, handle Supabase qr_code safely
      if (!resolvedQr && data.totp?.qr_code) {
        const rawQr = data.totp.qr_code;
        if (rawQr.startsWith('data:')) {
          resolvedQr = rawQr;
        } else if (rawQr.includes('<svg')) {
          resolvedQr = `data:image/svg+xml;utf-8,${encodeURIComponent(rawQr)}`;
        } else {
          resolvedQr = rawQr;
        }
      }

      // Priority C: Synthesize standard OTPAuth URI from secret & user email
      if (!resolvedQr && data.totp?.secret) {
        try {
          const userEmail = user.email || 'admin@raghavtexchems.com';
          const synthesizedUri = `otpauth://totp/Raghav%20Texchems:${encodeURIComponent(userEmail)}?secret=${data.totp.secret}&issuer=Raghav%20Texchems`;
          resolvedQr = await QRCode.toDataURL(synthesizedUri, {
            width: 240,
            margin: 1.5,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
        } catch (synthErr) {
          console.error('Failed synthesizing fallback QR code:', synthErr);
        }
      }

      if (resolvedQr) {
        setQrCode(resolvedQr);
      } else {
        setError('Could not generate the QR code graphic. Please use the manual key below.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize authenticator.');
    } finally {
      setLoading(false);
      enrollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    initMfaEnrollment();
  }, [initMfaEnrollment]);

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit verification code from your authenticator app.');
      return;
    }

    if (!factorId) {
      setError('Setup session expired. Please refresh and try again.');
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

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        setError('Invalid verification code. Please check your app and try again.');
        setVerifying(false);
        return;
      }

      await logAdminAction('ADMIN_MFA_ENROLLED', 'auth');

      // Refresh to dashboard with authenticated AAL2 state
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.');
      setVerifying(false);
    }
  };

  const handleCancel = async () => {
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch {
        // ignore
      }
    }
    await signOut();
    navigate('/login', { replace: true });
  };

  const formattedSecret = secret ? secret.match(/.{1,4}/g)?.join(' ') || secret : '';

  return (
    <div className="login-minimal-page">
      <div className="login-minimal-card" style={{ maxWidth: '460px' }}>
        <div className="login-minimal-header">
          <div className="login-brand-icon">
            <ShieldCheck size={28} color="#4A90E2" />
          </div>
          <h1 className="login-title">Authenticator Setup</h1>
          <p className="login-subtitle">
            Secure your administrator account with two-factor authentication
          </p>
        </div>

        {error && (
          <div
            className="login-error-alert"
            role="alert"
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', textAlign: 'left' }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>{error}</div>
            <button
              type="button"
              onClick={initMfaEnrollment}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#7F7F7F' }}>
            <div
              className="btn-spinner"
              style={{
                margin: '0 auto 1rem',
                width: 28,
                height: 28,
                borderColor: '#D1D8E0',
                borderTopColor: '#4A90E2',
              }}
            />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Generating secure QR code...
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Setting up your time-based one-time password (TOTP) factor
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Scan QR Code */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.75rem',
                }}
              >
                Step 1: Scan this QR code with your authenticator app
              </div>

              {qrCode ? (
                <div className="qr-code-frame" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                  <img
                    src={qrCode}
                    alt="Authenticator QR Code"
                    style={{
                      width: 190,
                      height: 190,
                      display: 'block',
                      margin: '0 auto',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: '2rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                    marginBottom: '1rem',
                  }}
                >
                  <KeyRound size={32} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Use the manual entry key below in your authenticator app
                  </p>
                </div>
              )}

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Works with Google Authenticator, Microsoft Authenticator, 1Password & Apple Passwords
              </div>
            </div>

            {/* Manual Key Accordion / Section */}
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem 0.9rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowManualKey(!showManualKey)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#4A90E2',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {showManualKey ? 'Hide manual key' : "Can't scan? Use manual setup key"}
                </button>

                <button
                  type="button"
                  onClick={handleCopySecret}
                  style={{
                    background: copied ? '#10B981' : '#ffffff',
                    border: '1px solid',
                    borderColor: copied ? '#10B981' : '#cbd5e1',
                    color: copied ? '#ffffff' : '#334155',
                    borderRadius: '4px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy Key'}
                </button>
              </div>

              {showManualKey && (
                <div style={{ marginTop: '0.65rem' }}>
                  <code className="manual-key-box" style={{ letterSpacing: '0.08em' }}>
                    {formattedSecret || secret}
                  </code>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      marginTop: '0.35rem',
                      textAlign: 'center',
                    }}
                  >
                    Account name: Raghav Texchems &bull; Type: Time-based (TOTP)
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Verification Form */}
            <form onSubmit={handleVerify}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label
                  htmlFor="mfa-auth-code"
                  className="form-label"
                  style={{ textAlign: 'center', display: 'block', marginBottom: '0.4rem' }}
                >
                  Step 2: Enter 6-Digit Code from App
                </label>
                <input
                  id="mfa-auth-code"
                  className="form-control mfa-code-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Complete Setup</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={handleCancel}
              className="login-cancel-btn"
              disabled={verifying}
            >
              Cancel and return to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};
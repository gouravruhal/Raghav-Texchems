import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { checkRateLimit, resetRateLimit } from '../lib/rateLimiter';
import { isValidEmail } from '../lib/validation';
import { logAdminAction } from '../lib/audit';

// FIXED: Added full_name and expanded role to allow super_admin
interface AdminProfile {
  id: string;
  role: 'admin' | 'super_admin';
  active: boolean;
  full_name?: string; 
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  adminProfile: AdminProfile | null;

  isAuthenticated: boolean;
  isAdmin: boolean;
  isMfaVerified: boolean;
  isMfaEnrolled: boolean;
  loading: boolean;

  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    success: boolean;
    requiresMfa: boolean;
    requiresMfaSetup: boolean;
    error?: string;
  }>;

  verifyMfa: (
    code: string,
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isMfaVerified, setIsMfaVerified] = useState(false);
  const [isMfaEnrolled, setIsMfaEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  const resetAuthState = () => {
    setSession(null);
    setUser(null);
    setAdminProfile(null);
    setIsMfaVerified(false);
    setIsMfaEnrolled(false);
  };

  const loadAuthState = async (currentSession: Session | null) => {
    if (!currentSession) {
      resetAuthState();
      return;
    }

    setSession(currentSession);
    setUser(currentSession.user);

    // FIXED: Now selecting full_name from database
    const { data: profile, error: profileError } = await supabase
      .from('admin_users')
      .select('id, role, active, full_name')
      .eq('id', currentSession.user.id)
      .eq('active', true)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      resetAuthState();
      return;
    }

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();

    if (factorError) {
      setAdminProfile(profile);
      setIsMfaEnrolled(false);
      setIsMfaVerified(false);
      return;
    }

    const verifiedTotpFactors = factors.totp.filter((factor) => factor.status === 'verified');
    const enrolled = verifiedTotpFactors.length > 0;

    setAdminProfile(profile);
    setIsMfaEnrolled(enrolled);

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setIsMfaVerified(aal?.currentLevel === 'aal2');
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;
      await loadAuthState(currentSession);
      if (mounted) setLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      await loadAuthState(newSession);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    const rateCheck = checkRateLimit(`login_${cleanEmail}`, {
      maxRequests: 5,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return {
        success: false,
        requiresMfa: false,
        requiresMfaSetup: false,
        error: `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
      };
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, requiresMfa: false, requiresMfaSetup: false, error: 'Please enter a valid administrator email address.' };
    }

    if (!password) {
      return { success: false, requiresMfa: false, requiresMfaSetup: false, error: 'Password is required.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    if (error || !data.session) {
      return { success: false, requiresMfa: false, requiresMfaSetup: false, error: 'Invalid email or password.' };
    }

    // FIXED: Now selecting full_name from database
    const { data: profile, error: profileError } = await supabase
      .from('admin_users')
      .select('id, role, active, full_name')
      .eq('id', data.user.id)
      .eq('active', true)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { success: false, requiresMfa: false, requiresMfaSetup: false, error: 'Access restricted: Unauthorized administrator account.' };
    }

    resetRateLimit(`login_${cleanEmail}`);

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();

    if (factorError) {
      await supabase.auth.signOut();
      return { success: false, requiresMfa: false, requiresMfaSetup: false, error: 'Unable to verify multi-factor authentication status.' };
    }

    const verifiedTotpFactors = factors.totp.filter((factor) => factor.status === 'verified');
    const enrolled = verifiedTotpFactors.length > 0;

    setSession(data.session);
    setUser(data.user);
    setAdminProfile(profile);
    setIsMfaEnrolled(enrolled);

    if (!enrolled) {
      setIsMfaVerified(false);
      return { success: true, requiresMfa: false, requiresMfaSetup: true };
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const verified = aal?.currentLevel === 'aal2';

    setIsMfaVerified(verified);

    if (verified) {
      await logAdminAction('ADMIN_LOGIN_SUCCESS', 'auth', { email: cleanEmail });
    }

    return { success: true, requiresMfa: !verified, requiresMfaSetup: false };
  };

  const verifyMfa = async (code: string) => {
    const cleanCode = code.trim();

    const rateCheck = checkRateLimit('mfa_verification', { maxRequests: 6, windowMs: 60 * 1000 });

    if (!rateCheck.allowed) {
      return { success: false, error: `Too many verification attempts. Please wait ${rateCheck.retryAfterSeconds} seconds.` };
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      return { success: false, error: 'Enter the 6-digit authenticator code.' };
    }

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();

    if (factorError) return { success: false, error: 'Unable to access MFA service.' };

    const factor = factors.totp.find((item) => item.status === 'verified');

    if (!factor) return { success: false, error: 'No verified authenticator is enrolled.' };

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });

    if (challengeError) return { success: false, error: 'Unable to start MFA challenge verification.' };

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code: cleanCode,
    });

    if (verifyError) return { success: false, error: 'Invalid authenticator code. Please try again.' };

    const { data: { session: updatedSession } } = await supabase.auth.getSession();

    setSession(updatedSession);
    setUser(updatedSession?.user ?? null);
    setIsMfaVerified(true);
    setIsMfaEnrolled(true);

    resetRateLimit('mfa_verification');
    await logAdminAction('ADMIN_MFA_VERIFIED', 'auth');

    return { success: true };
  };

  const signOut = async () => {
    await logAdminAction('ADMIN_LOGOUT', 'auth');
    await supabase.auth.signOut();
    resetAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        adminProfile,
        isAuthenticated: !!session,
        isAdmin: !!adminProfile?.active,
        isMfaVerified,
        isMfaEnrolled,
        loading,
        signIn,
        verifyMfa,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
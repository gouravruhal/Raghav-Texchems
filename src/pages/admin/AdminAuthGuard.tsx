import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminMfaPage } from '../../pages/admin/AdminMfaPage';

export const AdminAuthGuard: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    loading,
    isAuthenticated,
    isAdmin,
    isMfaVerified,
    isMfaEnrolled,
  } = useAuth();

  if (loading) {
    return (
      <div className="admin-auth-loading">
        <div className="homepage-loading-spinner" />
      </div>
    );
  }

  /*
   * No valid authenticated admin.
   */
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  /*
   * Authenticated administrator but
   * authenticator has not been enrolled.
   *
   * We don't allow access to the dashboard.
   */
  if (!isMfaEnrolled) {
    return (
      <Navigate
        to="/admin/setup-mfa"
        replace
      />
    );
  }

  /*
   * Authenticator exists but this login
   * has not yet reached AAL2.
   */
  if (!isMfaVerified) {
    return <AdminMfaPage />;
  }

  /*
   * Fully authenticated administrator.
   */
  return <>{children}</>;
};
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LogOut, Globe } from 'lucide-react';
import logoImg from '../../assets/logo-icon.png';

export const AdminNavbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { companySettings } = useData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // 1. Wipe frontend data cache to prevent leaks across sessions
    localStorage.removeItem('raghav_texchems_ui_cache');
    
    // 2. Sign out of backend
    await signOut();
    
    // 3. Redirect
    navigate('/', { replace: true });
  };

  const isSubdomain =
    typeof window !== 'undefined' &&
    (window.location.hostname.startsWith('admin.') ||
      window.location.hostname === 'admin.localhost');

  const handleViewWebsite = (e: React.MouseEvent) => {
    if (isSubdomain) {
      e.preventDefault();
      const mainHost = window.location.host.replace(/^admin\./, '');
      window.location.href = `${window.location.protocol}//${mainHost}/`;
    }
  };

  // Get registered admin email from auth user or local storage fallback
  const adminEmail = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('raghav_admin_email') : null) || 'admin@raghavtexchems.com';
  const emailInitial = adminEmail.charAt(0).toUpperCase();

  return (
    <header 
      className="admin-navbar-light" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 1.5rem', 
        background: '#ffffff', 
        borderBottom: '1px solid #e2e8f0', 
        zIndex: 1000,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. BRANDING (LEFT) */}
      <div className="admin-navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img 
          src={companySettings?.logoUrl || logoImg} 
          alt="Company Logo" 
          style={{ height: '38px', width: 'auto', objectFit: 'contain' }} 
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {companySettings?.shortName || 'Raghav Texchems'}
            <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>
              ADMIN
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
            Secure Management Portal
          </div>
        </div>
      </div>

      {/* 2. ACTIONS & PROFILE (RIGHT) */}
      <div className="admin-navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        
        {/* View Public Site - Exclusively here */}
        <Link
          to="/"
          onClick={handleViewWebsite}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            color: '#475569', 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            textDecoration: 'none', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '6px', 
            transition: 'background 0.2s, color 0.2s' 
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <Globe size={16} /> View Public Site
        </Link>

        {/* Vertical Divider */}
        <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Admin Email & Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: '#0f172a', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '0.9rem', 
              fontWeight: 700,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '2px solid #e2e8f0'
            }}>
              {emailInitial}
            </div>
            <span 
              title={adminEmail}
              style={{ 
                fontSize: '0.86rem', 
                fontWeight: 600, 
                color: '#0f172a',
                letterSpacing: '-0.01em',
                maxWidth: '240px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {adminEmail}
            </span>
          </div>

          {/* Secure Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out securely"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              padding: '0.5rem 0.9rem', 
              background: '#fef2f2', 
              color: '#dc2626', 
              border: '1px solid #fecaca', 
              borderRadius: '6px', 
              fontSize: '0.84rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              marginLeft: '0.25rem'
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.background = '#fee2e2'; 
              e.currentTarget.style.borderColor = '#f87171'; 
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.background = '#fef2f2'; 
              e.currentTarget.style.borderColor = '#fecaca'; 
            }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
};
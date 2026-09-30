import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Settings2,
  PlusCircle,
  Inbox,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AdminSidebar: React.FC = () => {
  const { products = [], inquiries = [] } = useData();
  const newInquiriesCount = inquiries.filter((i) => i.status === 'New').length;

  const isSubdomain =
    typeof window !== 'undefined' &&
    (window.location.hostname.startsWith('admin.') ||
      window.location.hostname === 'admin.localhost');

  const basePath = isSubdomain ? '' : '/admin';

  return (
    <aside 
      className="admin-sidebar-light" 
      style={{ 
        position: 'fixed',
        top: '70px',
        left: 0,
        bottom: 0,
        width: '260px',
        height: 'calc(100vh - 70px)',
        background: '#ffffff', 
        borderRight: '1px solid #e2e8f0', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        zIndex: 900,
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div className="admin-sidebar-top" style={{ padding: '1.5rem 1rem' }}>
        <div 
          className="sidebar-section-label" 
          style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: '#94a3b8', 
            letterSpacing: '0.5px', 
            marginBottom: '1rem', 
            paddingLeft: '0.5rem' 
          }}
        >
          NAVIGATION
        </div>

        <nav className="admin-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <NavLink
            to={`${basePath}/dashboard`}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            end
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to={`${basePath}/inquiries`}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Inbox size={18} />
            <span>Customer Inquiries</span>
            {inquiries.length > 0 && (
              <span 
                className="admin-badge-count" 
                style={{ 
                  marginLeft: 'auto', 
                  background: newInquiriesCount > 0 ? '#ef4444' : '#e2e8f0', 
                  color: newInquiriesCount > 0 ? '#ffffff' : '#475569', 
                  padding: '0.1rem 0.5rem', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700 
                }}
              >
                {newInquiriesCount > 0 ? `${newInquiriesCount} new` : inquiries.length}
              </span>
            )}
          </NavLink>

          <NavLink
            to={`${basePath}/products`}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Package size={18} />
            <span>Product Catalog</span>
            <span 
              className="admin-badge-count" 
              style={{ 
                marginLeft: 'auto', 
                background: '#e2e8f0', 
                color: '#475569', 
                padding: '0.1rem 0.5rem', 
                borderRadius: '12px', 
                fontSize: '0.75rem', 
                fontWeight: 600 
              }}
            >
              {products.length}
            </span>
          </NavLink>

          <NavLink
            to={`${basePath}/products/new`}
            className={({ isActive }) => `admin-nav-item admin-nav-subitem ${isActive ? 'active' : ''}`}
          >
            <PlusCircle size={16} />
            <span>Add Product</span>
          </NavLink>

          <div style={{ margin: '0.5rem 0', height: '1px', background: '#f1f5f9' }} />

          <NavLink
            to={`${basePath}/settings`}
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings2 size={18} />
            <span>Website Content</span>
          </NavLink>
        </nav>
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
          Raghav Texchems Portal
        </span>
      </div>
    </aside>
  );
};
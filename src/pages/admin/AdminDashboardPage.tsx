import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  CheckCircle2, 
  EyeOff,
  Plus, 
  ArrowRight, 
  FlaskConical, 
  Eye, 
  FolderTree,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  X,
  ExternalLink,
  Inbox,
  MessageSquare
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  // FIXED: Added default empty arrays to prevent undefined crashes
  const { products = [], categories = [], inquiries = [], toggleProductActive, addCategory, deleteCategory } = useData();
  const unreadInquiriesCount = inquiries.filter((i) => i.status === 'New' || i.status === 'Unread').length;

  const isSubdomain = typeof window !== 'undefined' && (window.location.hostname.startsWith('admin.') || window.location.hostname === 'admin.localhost');
  const basePath = isSubdomain ? '' : '/admin';

  const activeProducts = products.filter((p) => p?.active !== false);
  const recentProducts = products.slice(0, 6);

  // Category Management State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addCatError, setAddCatError] = useState<string | null>(null);
  const [catActionSuccess, setCatActionSuccess] = useState<string | null>(null);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Deletion Confirmation State
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  // Products belonging to the category currently pending deletion
  const affectedProducts = useMemo(() => {
    if (!catToDelete) return [];
    const catNameLower = catToDelete.name.trim().toLowerCase();
    return products.filter(
      (p) =>
        (p?.category && p.category.trim().toLowerCase() === catNameLower) ||
        p?.categoryId === catToDelete.id
    );
  }, [catToDelete, products]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddCatError(null);
    const clean = newCatName.trim();

    if (!clean) {
      setAddCatError('Please enter a category name.');
      return;
    }

    // Strict Case-Insensitive Duplicate Check
    const duplicate = categories.find(
      (c) => c?.name?.trim().toLowerCase() === clean.toLowerCase()
    );
    if (duplicate) {
      setAddCatError(`Category "${duplicate.name}" already exists. Category names must be unique.`);
      return;
    }

    setIsSubmittingCat(true);
    const result = await addCategory(clean);
    setIsSubmittingCat(false);

    if (result.success) {
      setNewCatName('');
      setShowAddCategory(false);
      setCatActionSuccess(`Category "${clean}" added to catalog.`);
      setTimeout(() => setCatActionSuccess(null), 3500);
    } else {
      setAddCatError(result.error || 'Failed to create category.');
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!catToDelete) return;
    setIsDeletingCat(true);
    const result = await deleteCategory(catToDelete.id);
    setIsDeletingCat(false);

    if (result.success) {
      const count = result.deletedProductsCount;
      setCatActionSuccess(
        count > 0
          ? `Category "${catToDelete.name}" and ${count} associated product(s) deleted.`
          : `Category "${catToDelete.name}" deleted.`
      );
      setTimeout(() => setCatActionSuccess(null), 3500);
      setCatToDelete(null);
    } else {
      alert(result.error || 'Failed to delete category.');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="admin-header-title-block">
          <h1 className="admin-page-title">Catalog Dashboard</h1>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-primary" onClick={() => navigate(`${basePath}/products/new`)}><Plus size={16} /> Add Product</button>
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card" onClick={() => navigate(`${basePath}/products`)} style={{ cursor: 'pointer' }} title="View product catalogue">
          <div className="stat-icon-wrap" style={{ background: '#eff6ff', color: '#1d4ed8' }}><Package size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-label">Total Products</div>
            <div className="stat-number">{products.length}</div>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => navigate(`${basePath}/products`)} style={{ cursor: 'pointer' }} title="View active website products">
          <div className="stat-icon-wrap" style={{ background: '#ecfdf5', color: '#047857' }}><CheckCircle2 size={20} /></div>
          <div className="stat-card-content">
            <div className="stat-label">Active on Website</div>
            <div className="stat-number" style={{ color: '#047857' }}>{activeProducts.length}</div>
          </div>
        </div>

        <div
          className="admin-stat-card"
          onClick={() => navigate(`${basePath}/inquiries`)}
          style={{ cursor: 'pointer' }}
          title="Click to view inquiries"
        >
          <div className="stat-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <MessageSquare size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-label">Customer Inquiries</div>
            <div className="stat-number">{inquiries.length}</div>
          </div>
        </div>

        <div
          className="admin-stat-card"
          onClick={() => navigate(`${basePath}/inquiries`)}
          style={{ cursor: 'pointer', border: unreadInquiriesCount > 0 ? '1.5px solid #fca5a5' : undefined }}
          title="Click to view unread inquiries"
        >
          <div className="stat-icon-wrap" style={{ background: unreadInquiriesCount > 0 ? '#fef2f2' : '#f8fafc', color: unreadInquiriesCount > 0 ? '#dc2626' : '#64748b' }}>
            <Inbox size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-label">Unread Inquiries</div>
            <div className="stat-number" style={{ color: unreadInquiriesCount > 0 ? '#dc2626' : undefined }}>
              {unreadInquiriesCount}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-split">
        {/* Category Management Section */}
        <div className="admin-panel-card category-breakdown-card">
          <div style={{ marginBottom: '0.85rem' }}>
            <h3 className="panel-card-title">Chemical Categories & Divisions</h3>
          </div>

          {/* Sub-line: Total categories on left, New Category button on opposite right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
              Total Categories: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{categories.length}</strong>
            </span>
            <button
              type="button"
              className={`btn btn-sm ${showAddCategory ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => {
                setShowAddCategory(!showAddCategory);
                setAddCatError(null);
              }}
              style={{ gap: '0.35rem', whiteSpace: 'nowrap' }}
            >
              {showAddCategory ? <X size={15} /> : <Plus size={15} />}
              <span>{showAddCategory ? 'Cancel' : 'New Category'}</span>
            </button>
          </div>

          {/* Action Success Alert */}
          {catActionSuccess && (
            <div style={{ padding: '0.65rem 0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.9rem' }}>
              <CheckCircle2 size={16} color="#059669" /> {catActionSuccess}
            </div>
          )}

          {/* Inline Add Category Form with Duplicate Validation */}
          {showAddCategory && (
            <form onSubmit={handleAddCategory} style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                New Unique Category Name *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sizing & Wetting Agents"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (addCatError) setAddCatError(null);
                  }}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingCat || !newCatName.trim()} style={{ flexShrink: 0 }}>
                  {isSubmittingCat ? 'Saving...' : 'Add Category'}
                </button>
              </div>
              {addCatError && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={14} color="#dc2626" /> {addCatError}
                </div>
              )}
            </form>
          )}

          {/* Categories List with Counts, Progress Bar, and Actions */}
          <div className="category-bars-container" style={{ maxHeight: '380px', minHeight: '220px', overflowY: 'auto', paddingRight: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <FolderTree size={28} color="#94a3b8" style={{ marginBottom: '0.4rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>No chemical categories found.</p>
              </div>
            ) : (
              categories.map((cat) => {
                const count = products.filter(
                  (p) => (p?.category && p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()) || p?.categoryId === cat.id
                ).length;
                const percentage = products.length > 0 ? Math.round((count / products.length) * 100) : 0;

                return (
                  <div 
                    key={cat.id} 
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cat.name}>
                          {cat.name}
                        </span>
                      </div>

                      {/* Right-indented count, percentage, and action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginLeft: 'auto' }}>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>
                            {count} {count === 1 ? 'product' : 'products'}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', minWidth: '36px', textAlign: 'right' }}>
                            {percentage}%
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => navigate(`${basePath}/products?category=${encodeURIComponent(cat.name)}`)}
                            title={`View ${cat.name} in catalog`}
                            style={{ width: '28px', height: '28px' }}
                          >
                            <ExternalLink size={13} />
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn danger"
                            onClick={() => setCatToDelete(cat)}
                            title={`Delete category "${cat.name}"`}
                            style={{ width: '28px', height: '28px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress track */}
                    <div className="category-bar-track" style={{ height: '6px' }}>
                      <div
                        className="category-bar-fill"
                        style={{
                          width: `${Math.max(percentage, count > 0 ? 5 : 0)}%`,
                          background: cat.name.toLowerCase().includes('dye') ? '#1d4ed8' : cat.name.toLowerCase().includes('emulsion') ? '#059669' : cat.name.toLowerCase().includes('paper') ? '#d97706' : cat.name.toLowerCase().includes('textile') ? '#7c3aed' : '#0284c7',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="admin-panel-card quick-mgmt-card">
          <div className="panel-card-header">
            <div>
              <h3 className="panel-card-title">Quick Actions</h3>
              <p className="panel-card-subtitle">Core shortcuts for catalog and inquiry operations.</p>
            </div>
          </div>
          <div className="quick-actions-list">
            <Link to={`${basePath}/products/new`} className="quick-action-btn primary">
              <div className="quick-action-icon"><Plus size={18} /></div>
              <div className="quick-action-text">
                <strong>Create Chemical Product</strong>
                <span>Add a new formulation with TDS specifications</span>
              </div>
              <ArrowRight size={16} className="quick-action-arrow" />
            </Link>
            <button
              type="button"
              className="quick-action-btn"
              onClick={() => {
                setShowAddCategory(true);
                window.scrollTo({ top: 220, behavior: 'smooth' });
              }}
              style={{ textAlign: 'left', width: '100%', cursor: 'pointer', border: '1px solid #e2e8f0', background: '#ffffff' }}
            >
              <div className="quick-action-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <FolderTree size={18} />
              </div>
              <div className="quick-action-text">
                <strong>Add Chemical Category</strong>
                <span>Create a new segment with unique validation</span>
              </div>
              <ArrowRight size={16} className="quick-action-arrow" />
            </button>
            <Link to={`${basePath}/products`} className="quick-action-btn">
              <div className="quick-action-icon"><Package size={18} /></div>
              <div className="quick-action-text">
                <strong>Manage Product Catalogue</strong>
                <span>View, filter, edit, or toggle visibility</span>
              </div>
              <ArrowRight size={16} className="quick-action-arrow" />
            </Link>
            <Link to={`${basePath}/inquiries`} className="quick-action-btn">
              <div className="quick-action-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Inbox size={18} />
              </div>
              <div className="quick-action-text">
                <strong>Customer Inquiries</strong>
                <span>{unreadInquiriesCount > 0 ? `${unreadInquiriesCount} unread inquiries pending review` : 'View and follow up with inquiries'}</span>
              </div>
              <ArrowRight size={16} className="quick-action-arrow" />
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-panel-card" style={{ marginTop: '1.75rem' }}>
        <div className="panel-card-header">
          <div><h3 className="panel-card-title">Recent Catalogue Additions</h3><p className="panel-card-subtitle">Latest chemical formulations added.</p></div>
          <Link to={`${basePath}/products`} className="admin-link-inline"><span>Full Catalogue</span><ArrowRight size={15} /></Link>
        </div>
        {recentProducts.length === 0 ? (
          <div className="admin-empty-table"><Package size={40} style={{ opacity: 0.35, marginBottom: '0.5rem' }} /><p>No chemical products registered yet.</p></div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr><th style={{ width: '38%' }}>Product Details</th><th style={{ width: '16%' }}>SKU Code</th><th style={{ width: '20%' }}>Category</th><th style={{ width: '14%' }}>Visibility</th><th style={{ width: '12%', textAlign: 'right' }}>Action</th></tr></thead>
              <tbody>
                {recentProducts.map((product) => {
                  const isActive = product?.active !== false;
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell-wrapper">
                          <div className="product-thumb-box">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <FlaskConical size={18} color="#94a3b8" />}</div>
                          <div className="product-info-column"><strong className="product-cell-name">{product.name}</strong><span className="product-cell-sub">{product.appearance || 'Standard technical grade'}</span></div>
                        </div>
                      </td>
                      <td><span className="sku-badge">{product.code}</span></td>
                      <td><span className="product-category-tag">{product.category}</span></td>
                      <td><button type="button" className={`status-toggle-btn ${isActive ? 'active' : 'inactive'}`} onClick={() => toggleProductActive(product.id)}>{isActive ? <Eye size={13} /> : <EyeOff size={13} />}<span>{isActive ? 'Active' : 'Disabled'}</span></button></td>
                      <td style={{ textAlign: 'right' }}><button className="btn btn-secondary btn-sm" onClick={() => navigate(`${basePath}/products/${product.id}/edit`)}>Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cascading Category Deletion Warning Modal */}
      {catToDelete && (
        <div className="modal-overlay" onClick={() => !isDeletingCat && setCatToDelete(null)}>
          <div 
            className="modal-content" 
            style={{ maxWidth: '560px', padding: '1.75rem', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: affectedProducts.length > 0 ? '#fee2e2' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {affectedProducts.length > 0 ? (
                  <ShieldAlert size={26} color="#dc2626" />
                ) : (
                  <AlertTriangle size={26} color="#d97706" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: affectedProducts.length > 0 ? '#991b1b' : '#92400e' }}>
                  {affectedProducts.length > 0 
                    ? `Critical Warning: Delete Category & ${affectedProducts.length} Product(s)?`
                    : `Delete Category "${catToDelete.name}"?`}
                </h3>
                <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
                  {affectedProducts.length > 0 ? (
                    <>
                      Category <strong style={{ color: '#0f172a' }}>"{catToDelete.name}"</strong> has <strong style={{ color: '#dc2626' }}>{affectedProducts.length} chemical product(s)</strong> registered. Removing this category will <strong>permanently delete all {affectedProducts.length} associated products</strong> from both the database and public website catalogue.
                    </>
                  ) : (
                    <>
                      Are you sure you want to remove category <strong style={{ color: '#0f172a' }}>"{catToDelete.name}"</strong>? No products are currently assigned to this category.
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingCat && setCatToDelete(null)}
                style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {affectedProducts.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Formulations to be permanently deleted ({affectedProducts.length}):
                  </span>
                </div>
                <div style={{ maxHeight: '130px', overflowY: 'auto', background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>
                  {affectedProducts.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #fee2e2', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b', background: '#ffffff', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid #fecaca' }}>{p.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isDeletingCat}
                onClick={() => setCatToDelete(null)}
              >
                Cancel, Keep Everything
              </button>
              <button
                type="button"
                className="btn"
                disabled={isDeletingCat}
                onClick={handleConfirmDeleteCategory}
                style={{ background: '#dc2626', color: '#ffffff', fontWeight: 700, border: 0, gap: '0.4rem', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)', padding: '0.5rem 1rem', borderRadius: '8px' }}
              >
                <Trash2 size={15} />
                {isDeletingCat 
                  ? 'Deleting...' 
                  : affectedProducts.length > 0 
                    ? `Yes, Delete Category & ${affectedProducts.length} Product(s)` 
                    : 'Yes, Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
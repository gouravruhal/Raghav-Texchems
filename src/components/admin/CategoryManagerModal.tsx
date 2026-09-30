import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { X, Trash2, Plus, AlertTriangle, FolderTree, Package, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Category } from '../../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelected?: (categoryName: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onCategorySelected,
}) => {
  const { categories = [], products = [], addCategory, deleteCategory } = useData();

  const [newCatName, setNewCatName] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion Confirmation State
  const [pendingDeleteCat, setPendingDeleteCat] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Products belonging to the category currently pending deletion
  const affectedProducts = useMemo(() => {
    if (!pendingDeleteCat) return [];
    const catNameLower = pendingDeleteCat.name.trim().toLowerCase();
    return products.filter(
      (p) =>
        (p.category && p.category.trim().toLowerCase() === catNameLower) ||
        p.categoryId === pendingDeleteCat.id
    );
  }, [pendingDeleteCat, products]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);
    const clean = newCatName.trim();

    if (!clean) {
      setInlineError('Please enter a category name.');
      return;
    }

    // Duplicate check (case-insensitive)
    const duplicate = categories.find(
      (c) => c?.name?.trim().toLowerCase() === clean.toLowerCase()
    );
    if (duplicate) {
      setInlineError(`Category "${duplicate.name}" already exists. Category names must be unique.`);
      return;
    }

    setIsSubmitting(true);
    const result = await addCategory(clean);
    setIsSubmitting(false);

    if (result.success) {
      setNewCatName('');
      showNotification(`Category "${clean}" added successfully.`);
      if (onCategorySelected) {
        onCategorySelected(clean);
      }
    } else {
      setInlineError(result.error || 'Failed to add category.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteCat) return;

    setIsDeleting(true);
    const result = await deleteCategory(pendingDeleteCat.id);
    setIsDeleting(false);

    if (result.success) {
      const count = result.deletedProductsCount;
      showNotification(
        count > 0
          ? `Category "${pendingDeleteCat.name}" and ${count} associated product(s) deleted.`
          : `Category "${pendingDeleteCat.name}" deleted.`
      );
      setPendingDeleteCat(null);
    } else {
      alert(result.error || 'Failed to delete category.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '600px', 
          padding: '1.75rem', 
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderTree size={20} color="#2563eb" /> Manage Categories
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Add unique categories or remove obsolete ones. Removing a category permanently deletes associated products.
            </p>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            style={{ position: 'static', width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div style={{ padding: '0.65rem 0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <CheckCircle2 size={16} color="#059669" /> {successMsg}
          </div>
        )}

        {inlineError && (
          <div style={{ padding: '0.65rem 0.85rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <AlertTriangle size={16} color="#dc2626" /> {inlineError}
          </div>
        )}

        {/* Deletion Warning Dialog (Overlay Container) */}
        {pendingDeleteCat ? (
          <div style={{ padding: '1.25rem', background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {affectedProducts.length > 0 ? (
                  <ShieldAlert size={22} color="#dc2626" />
                ) : (
                  <AlertTriangle size={22} color="#ea580c" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#9f1239' }}>
                  {affectedProducts.length > 0 
                    ? `Warning: Delete Category & ${affectedProducts.length} Product(s)?` 
                    : `Delete Category "${pendingDeleteCat.name}"?`}
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: '#881337', lineHeight: 1.45 }}>
                  {affectedProducts.length > 0 ? (
                    <>
                      Category <strong>"{pendingDeleteCat.name}"</strong> has <strong>{affectedProducts.length} chemical product(s)</strong> in the catalog. Removing this category will <strong>permanently delete all {affectedProducts.length} associated product(s)</strong> from your catalog and website.
                    </>
                  ) : (
                    <>
                      Are you sure you want to remove <strong>"{pendingDeleteCat.name}"</strong>? No products are currently assigned to this category.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Affected Products List Preview */}
            {affectedProducts.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Products to be permanently deleted ({affectedProducts.length}):
                </span>
                <div style={{ maxHeight: '110px', overflowY: 'auto', background: '#ffffff', border: '1px solid #fecdd3', borderRadius: '8px', padding: '0.5rem', marginTop: '0.35rem' }}>
                  {affectedProducts.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.4rem', fontSize: '0.8rem', borderBottom: '1px solid #fff1f2' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>{p.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                disabled={isDeleting}
                onClick={() => setPendingDeleteCat(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-sm"
                style={{ background: '#dc2626', color: '#ffffff', border: 0, fontWeight: 700, gap: '0.35rem' }}
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                <Trash2 size={13} /> {isDeleting ? 'Deleting...' : affectedProducts.length > 0 ? `Yes, Delete Category & ${affectedProducts.length} Product(s)` : 'Yes, Delete Category'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Form: Add New Category */}
        <form onSubmit={handleAddCategory} style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem' }}>
            Add New Unique Category
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Sizing & Wetting Agents" 
              value={newCatName}
              onChange={(e) => {
                setNewCatName(e.target.value);
                if (inlineError) setInlineError(null);
              }}
              style={{ flex: 1 }}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || !newCatName.trim()}
              style={{ gap: '0.35rem', flexShrink: 0 }}
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Existing Categories ({categories.length})
            </span>
          </div>

          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              <FolderTree size={32} color="#94a3b8" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>No categories registered yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {categories.map((cat) => {
                const count = products.filter(
                  (p) =>
                    (p.category && p.category.trim().toLowerCase() === cat.name.trim().toLowerCase()) ||
                    p.categoryId === cat.id
                ).length;

                return (
                  <div 
                    key={cat.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.65rem 0.85rem', 
                      background: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat.name}
                      </span>
                      <span 
                        style={{ 
                          fontSize: '0.72rem', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '12px', 
                          fontWeight: 600,
                          background: count > 0 ? '#eff6ff' : '#f1f5f9',
                          color: count > 0 ? '#2563eb' : '#94a3b8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          flexShrink: 0
                        }}
                      >
                        <Package size={11} /> {count} {count === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>

                    <button 
                      type="button" 
                      className="admin-icon-btn danger" 
                      style={{ width: '30px', height: '30px', flexShrink: 0 }}
                      onClick={() => setPendingDeleteCat(cat)}
                      title={`Remove category "${cat.name}"`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

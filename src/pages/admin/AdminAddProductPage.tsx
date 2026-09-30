import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Plus, Save, Trash2, CheckCircle2, FileText, FolderTree, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { Product } from '../../types';
import { CategoryManagerModal } from '../../components/admin/CategoryManagerModal';
import { uploadProductImage } from '../../lib/storage';
import { sanitizeString, LIMITS } from '../../lib/validation';

export const AdminAddProductPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  // FIXED: Default empty arrays
  const { products = [], categories = [], addCategory, addProduct, updateProduct } = useData();

  const isSubdomain = typeof window !== 'undefined' && (window.location.hostname.startsWith('admin.') || window.location.hostname === 'admin.localhost');
  const basePath = isSubdomain ? '' : '/admin';

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [applicationInput, setApplicationInput] = useState('');
  const [packagingInput, setPackagingInput] = useState('');
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const [form, setForm] = useState<Omit<Product, 'id' | 'createdAt'>>({
    name: '', code: '', category: '', description: '', imageUrl: '', imagePath: '',
    appearance: '', ph: '', activeContent: '', viscosity: '', ionicNature: 'Non-Ionic',
    solubility: 'Easily soluble in cold water', shelfLife: '12 Months in original sealed container',
    applications: [], packaging: [], tdsUrl: '', sdsUrl: '', featured: false, active: true, stockStatus: 'In Stock',
  });

  useEffect(() => {
    if (isEditMode && id) {
      const existingProduct = products.find((p) => p?.id === id);
      if (existingProduct) {
        setForm({
          name: existingProduct.name || '', code: existingProduct.code || '', category: existingProduct.category || '',
          description: existingProduct.description || '', imageUrl: existingProduct.imageUrl || '', imagePath: existingProduct.imagePath || '',
          appearance: existingProduct.appearance || '', ph: existingProduct.ph || '', activeContent: existingProduct.activeContent || '',
          viscosity: existingProduct.viscosity || '', ionicNature: existingProduct.ionicNature || 'Non-Ionic',
          solubility: existingProduct.solubility || 'Easily soluble in cold water', shelfLife: existingProduct.shelfLife || '12 Months',
          applications: existingProduct.applications || [], packaging: existingProduct.packaging || [], tdsUrl: existingProduct.tdsUrl || '',
          sdsUrl: existingProduct.sdsUrl || '', featured: existingProduct.featured || false, active: existingProduct.active !== false,
          stockStatus: existingProduct.stockStatus || 'In Stock',
        });

        if (existingProduct.imageUrl) {
          setImagePreview(existingProduct.imageUrl);
          if (existingProduct.imageUrl.startsWith('http')) setUseUrlInput(true);
        }
      } else {
        setError('Product not found in catalog.');
      }
    } else {
      const randomNum = Math.floor(100 + Math.random() * 900);
      setForm((prev) => ({ ...prev, code: `RTC-CHEM-${randomNum}` }));
    }
  }, [id, isEditMode, products]);

  const updateField = <K extends keyof Omit<Product, 'id' | 'createdAt'>>(field: K, value: Omit<Product, 'id' | 'createdAt'>[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview('');
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    updateField('imageUrl', '');
    updateField('imagePath', '');
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'ADD_NEW') {
      setIsAddingCategory(true);
      setCategoryError(null);
      updateField('category', '');
    } else if (e.target.value === 'MANAGE_CATEGORIES') {
      setIsCategoryModalOpen(true);
    } else {
      updateField('category', e.target.value);
    }
  };

  const handleCreateCategory = async () => {
    setCategoryError(null);
    const cleanName = newCategoryName.trim();
    if (!cleanName) {
      setCategoryError('Category name cannot be empty.');
      return;
    }
    const result = await addCategory(cleanName);
    if (result.success) {
      updateField('category', cleanName);
      setNewCategoryName('');
      setIsAddingCategory(false);
      setCategoryError(null);
    } else {
      setCategoryError(result.error || 'Failed to add category.');
    }
  };

  const addApplication = () => {
    const value = sanitizeString(applicationInput, 100);
    if (!value || form.applications.includes(value)) return setApplicationInput('');
    updateField('applications', [...form.applications, value]);
    setApplicationInput('');
  };

  const addPackaging = () => {
    const value = sanitizeString(packagingInput, 50);
    if (!value || form.packaging.includes(value)) return setPackagingInput('');
    updateField('packaging', [...form.packaging, value]);
    setPackagingInput('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError('');

    // STRICT VALIDATION
    if (!form.name.trim() || !form.code.trim() || !form.category.trim() || !form.description.trim()) {
      setError('Product Name, Code, Category, and Description cannot be empty.');
      return;
    }
    if (!imageFile && (!form.imageUrl || !form.imageUrl.trim()) && !imagePreview) {
      setError('A product image is required. Please upload a file or provide a valid image URL.');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = form.imageUrl;
      let finalImagePath = form.imagePath;

      if (imageFile) {
        const uploadResult = await uploadProductImage(imageFile);
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Failed to upload product image.');
          setSaving(false); return;
        }
        finalImageUrl = uploadResult.publicUrl || '';
        finalImagePath = uploadResult.storagePath || '';
      }

      const cleanedData = {
        ...form, name: sanitizeString(form.name, LIMITS.PRODUCT_NAME), code: sanitizeString(form.code, LIMITS.PRODUCT_CODE),
        category: sanitizeString(form.category, LIMITS.PRODUCT_CATEGORY), description: sanitizeString(form.description, LIMITS.PRODUCT_DESCRIPTION),
        imageUrl: finalImageUrl, imagePath: finalImagePath,
      };

      if (isEditMode && id) {
        const existing = products.find((p) => p?.id === id);
        await updateProduct({ ...cleanedData, id, createdAt: existing?.createdAt || new Date().toISOString().split('T')[0] });
        setSuccessToast('Product updated successfully!');
      } else {
        await addProduct(cleanedData);
        setSuccessToast('New product added to catalog!');
      }
      setTimeout(() => navigate(`${basePath}/products`, { replace: true }), 500);
    } catch (submitError: any) {
      setError(submitError?.message || 'Unable to save the product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="admin-header-title-block">
          <button type="button" onClick={() => navigate(`${basePath}/products`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: 0, background: 'transparent', padding: 0, marginBottom: '0.65rem', color: '#64748b', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Products Catalog
          </button>
          <h1 className="admin-page-title">{isEditMode ? 'Edit Chemical Product' : 'Add Chemical Product'}</h1>
          <p className="admin-page-subtitle">Configure formulations, technical specifications, and documents.</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`${basePath}/products`)}>Cancel</button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>
            <Save size={16} /><span>{saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Publish Product'}</span>
          </button>
        </div>
      </div>

      {error && <div className="admin-login-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {successToast && <div className="admin-success-alert" style={{ marginBottom: '1.5rem' }}><CheckCircle2 size={18} /> {successToast}</div>}

      <form id="product-form" onSubmit={handleSubmit}>
        <div className="admin-form-two-col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="admin-panel-card">
              <div className="panel-card-header"><div><h3 className="panel-card-title">Product Information</h3></div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Commercial Name *</label>
                  <input type="text" required className="form-control" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Technical Code *</label>
                  <input type="text" required className="form-control" value={form.code} onChange={(e) => updateField('code', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.3rem'
                      }}
                    >
                      <FolderTree size={14} /> Manage / Remove Categories
                    </button>
                  </div>
                  {isAddingCategory ? (
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="New Category Name"
                          value={newCategoryName}
                          onChange={(e) => {
                            setNewCategoryName(e.target.value);
                            if (categoryError) setCategoryError(null);
                          }}
                        />
                        <button type="button" className="btn btn-primary" onClick={handleCreateCategory}>Save</button>
                        <button type="button" className="btn btn-secondary" onClick={() => { setIsAddingCategory(false); setCategoryError(null); }}>Cancel</button>
                      </div>
                      {categoryError && (
                        <div style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={14} /> {categoryError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <select className="form-control" required value={form.category} onChange={handleCategoryChange}>
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c?.id} value={c?.name}>{c?.name}</option>)}
                      <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#2563eb' }}>+ Create New Category</option>
                      <option value="MANAGE_CATEGORIES" style={{ color: '#dc2626', fontWeight: 600 }}>⚙️ Manage & Remove Categories...</option>
                    </select>
                  )}
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Technical Description *</label>
                  <textarea required className="form-control" rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="admin-panel-card">
              <div className="panel-card-header"><div><h3 className="panel-card-title">Technical Data Sheet (TDS) Attributes</h3></div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Physical Appearance</label>
                  <input type="text" className="form-control" value={form.appearance} onChange={(e) => updateField('appearance', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ionic Nature</label>
                  <select className="form-control" value={form.ionicNature} onChange={(e) => updateField('ionicNature', e.target.value)}>
                    <option value="Non-Ionic">Non-Ionic</option>
                    <option value="Anionic">Anionic</option>
                    <option value="Cationic">Cationic</option>
                    <option value="Amphoteric">Amphoteric</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">pH Range (10% aqueous)</label>
                  <input type="text" className="form-control" value={form.ph} onChange={(e) => updateField('ph', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Active Solids Content (%)</label>
                  <input type="text" className="form-control" value={form.activeContent} onChange={(e) => updateField('activeContent', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Viscosity (cps)</label>
                  <input type="text" className="form-control" value={form.viscosity} onChange={(e) => updateField('viscosity', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Solubility</label>
                  <input type="text" className="form-control" value={form.solubility} onChange={(e) => updateField('solubility', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="admin-panel-card">
              <div className="panel-card-header"><div><h3 className="panel-card-title">Industrial Applications & Packaging</h3></div></div>
              <div className="form-group">
                <label className="form-label">Applications</label>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input type="text" className="form-control" value={applicationInput} onChange={(e) => setApplicationInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addApplication())} />
                  <button type="button" className="btn btn-secondary" onClick={addApplication}><Plus size={16} /> Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                  {form.applications.map((app, index) => (
                    <div key={index} className="badge-chip"><span>{app}</span><button type="button" onClick={() => updateField('applications', form.applications.filter((_, i) => i !== index))}><Trash2 size={13} /></button></div>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Packaging Options</label>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <input type="text" className="form-control" value={packagingInput} onChange={(e) => setPackagingInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPackaging())} />
                  <button type="button" className="btn btn-secondary" onClick={addPackaging}><Plus size={16} /> Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                  {form.packaging.map((pkg, index) => (
                    <div key={index} className="badge-chip"><span>{pkg}</span><button type="button" onClick={() => updateField('packaging', form.packaging.filter((_, i) => i !== index))}><Trash2 size={13} /></button></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-panel-card">
              <div className="panel-card-header"><div><h3 className="panel-card-title">Technical Documentation</h3></div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label"><FileText size={14} style={{ display: 'inline', marginRight: '4px' }}/> TDS URL (PDF)</label>
                  <input type="url" className="form-control" value={form.tdsUrl} onChange={(e) => updateField('tdsUrl', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label"><FileText size={14} style={{ display: 'inline', marginRight: '4px' }}/> SDS URL (PDF)</label>
                  <input type="url" className="form-control" value={form.sdsUrl} onChange={(e) => updateField('sdsUrl', e.target.value)} />
                </div>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="admin-panel-card">
              <h3 className="panel-card-title" style={{ marginBottom: '1rem' }}>Catalog Configuration</h3>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Stock / Supply Status</label>
                <select className="form-control" value={form.stockStatus || 'In Stock'} onChange={(e) => updateField('stockStatus', e.target.value as any)}>
                  <option value="In Stock">In Stock (Standard Bulk)</option>
                  <option value="Custom Order">Custom Order / Synthesis</option>
                  <option value="High Demand">High Demand</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--divider)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.active !== false} onChange={(e) => updateField('active', e.target.checked)} /><span>Visible on Public Website</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', color: form.featured ? '#b45309' : 'inherit' }}>
                  <input type="checkbox" checked={form.featured || false} onChange={(e) => updateField('featured', e.target.checked)} /><span>⭐ Featured on Homepage</span>
                </label>
              </div>
            </div>

            <div className="admin-panel-card">
              <div className="panel-card-header"><div><h3 className="panel-card-title">Product Image *</h3></div></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button type="button" className={`btn ${!useUrlInput ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setUseUrlInput(false)}>Upload File</button>
                <button type="button" className={`btn ${useUrlInput ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setUseUrlInput(true)}>Image URL</button>
              </div>
              {useUrlInput ? (
                <input type="url" className="form-control" value={form.imageUrl || ''} onChange={(e) => { updateField('imageUrl', e.target.value); setImagePreview(e.target.value); }} />
              ) : (
                <>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} style={{ display: 'none' }} />
                  {!imagePreview && (
                    <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '2rem 1rem', border: '2px dashed var(--divider)', flexDirection: 'column' }} onClick={() => fileInputRef.current?.click()}>
                      <ImagePlus size={26} color="var(--primary-brand)" /> Click to browse
                    </button>
                  )}
                </>
              )}
              {imagePreview && (
                <div style={{ marginTop: '1rem' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem', color: '#ef4444' }} onClick={removeImage}>Remove</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      <style>{`
        .badge-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.75rem; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-size: 0.8rem; font-weight: 600; border: 1px solid #bfdbfe; }
        .badge-chip button { border: 0; background: transparent; color: #ef4444; padding: 0; cursor: pointer; display: inline-flex; }
      `}</style>

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategorySelected={(name) => updateField('category', name)}
      />
    </div>
  );
};
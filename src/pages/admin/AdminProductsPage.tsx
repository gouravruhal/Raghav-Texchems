import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Plus, 
  Search, 
  Star, 
  Trash2, 
  Download, 
  RotateCcw, 
  FolderTree, 
  Edit2, 
  FlaskConical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { sanitizeSearchQuery } from '../../lib/validation';
import { CategoryManagerModal } from '../../components/admin/CategoryManagerModal';

const ITEMS_PER_PAGE = 50;

type ProductFilter = 'all' | 'active' | 'disabled';

export const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products = [], categories = [], deleteProduct, toggleProductActive, updateProduct } = useData();

  const isSubdomain = typeof window !== 'undefined' && (window.location.hostname.startsWith('admin.') || window.location.hostname === 'admin.localhost');
  const basePath = isSubdomain ? '' : '/admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All Products');
  const [statusFilter, setStatusFilter] = useState<ProductFilter>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setActiveCategory(catParam);
    }
  }, [searchParams]);

  // Reset pagination to first page whenever search query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, statusFilter, featuredOnly]);

  const activeCount = useMemo(() => products.filter((p) => p?.active !== false).length, [products]);
  const disabledCount = useMemo(() => products.filter((p) => p?.active === false).length, [products]);
  const featuredCount = useMemo(() => products.filter((p) => p?.featured).length, [products]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Permanently delete "${name}" from the catalog?`)) deleteProduct(id);
  };

  const handleToggleFeatured = (id: string) => {
    const prod = products.find((p) => p?.id === id);
    if (prod) updateProduct({ ...prod, featured: !prod.featured });
  };

  const handleExportCSV = () => {
    if (products.length === 0) return alert('No products available to export.');
    const headers = [ 'ID', 'Name', 'Code', 'Category', 'Active', 'Featured', 'Stock Status', 'pH', 'Active Content', 'Viscosity', 'Appearance', 'Ionic Nature', 'Solubility', 'Shelf Life', 'Packaging', 'Applications', 'Description', 'TDS URL', 'SDS URL' ];
    const sanitizeCsvCell = (val: string | undefined | null): string => {
      if (!val) return '""';
      const clean = String(val).replace(/"/g, '""');
      return /^[=+\-@\t\r]/.test(clean) ? `"'${clean}"` : `"${clean}"`;
    };
    const rows = products.map((p) => [
      sanitizeCsvCell(p?.id), sanitizeCsvCell(p?.name), sanitizeCsvCell(p?.code), sanitizeCsvCell(p?.category),
      p?.active !== false ? 'Yes' : 'No', p?.featured ? 'Yes' : 'No', sanitizeCsvCell(p?.stockStatus || 'In Stock'),
      sanitizeCsvCell(p?.ph), sanitizeCsvCell(p?.activeContent), sanitizeCsvCell(p?.viscosity), sanitizeCsvCell(p?.appearance),
      sanitizeCsvCell(p?.ionicNature), sanitizeCsvCell(p?.solubility), sanitizeCsvCell(p?.shelfLife),
      sanitizeCsvCell((p?.packaging || []).join(' | ')), sanitizeCsvCell((p?.applications || []).join(' | ')),
      sanitizeCsvCell(p?.description), sanitizeCsvCell(p?.tdsUrl), sanitizeCsvCell(p?.sdsUrl)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a'); link.href = encodeURI(csvContent); link.download = `raghav_texchems_catalog_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchQuery(''); 
    setActiveCategory('All Products'); 
    setStatusFilter('all'); 
    setFeaturedOnly(false);
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    const query = sanitizeSearchQuery(searchQuery).toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || 
        product?.name?.toLowerCase().includes(query) || 
        product?.code?.toLowerCase().includes(query) || 
        product?.category?.toLowerCase().includes(query) ||
        (product?.appearance && product.appearance.toLowerCase().includes(query));
      const matchesCategory = activeCategory === 'All Products' || product?.category === activeCategory;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && product?.active !== false) || (statusFilter === 'disabled' && product?.active === false);
      const matchesFeatured = !featuredOnly || product?.featured;
      return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
    });
  }, [products, searchQuery, activeCategory, statusFilter, featuredOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  // Guard against currentPage exceeding totalPages after filter or deletion
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginate 50 products per page
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const paginationRange = useMemo(() => {
    if (totalPages <= 1) return [];
    const delta = 1;
    const range: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      const catalogPanel = document.getElementById('catalog-table-panel');
      if (catalogPanel) {
        catalogPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-title-block">
          <h1 className="admin-page-title">Chemical Products Catalog</h1>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(true)}>
            <FolderTree size={16} /> Manage Categories
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} /> Export Catalog
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate(`${basePath}/products/new`)}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Responsive Stat Cards matching Dashboard design */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrap" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            <Package size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-label">Total Catalog</div>
            <div className="stat-number">{products.length}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrap" style={{ background: '#ecfdf5', color: '#047857' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-label">Active / Live</div>
            <div className="stat-number" style={{ color: '#047857' }}>{activeCount}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <EyeOff size={20} />
          </div>
          <div className="stat-card-content">
            <div className="stat-label">Disabled / Hidden</div>
            <div className="stat-number" style={{ color: '#dc2626' }}>{disabledCount}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrap" style={{ background: '#fffbeb', color: '#b45309' }}>
            <Star size={20} fill="#f59e0b" color="#f59e0b" />
          </div>
          <div className="stat-card-content">
            <div className="stat-label">Featured Showcase</div>
            <div className="stat-number" style={{ color: '#b45309' }}>{featuredCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Container */}
      <div className="admin-panel-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div className="search-box-wrapper" style={{ margin: 0, flex: '1 1 240px', maxWidth: '380px' }}>
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by product name, code, or grade..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <select 
              value={activeCategory} 
              onChange={(e) => setActiveCategory(e.target.value)} 
              className="form-control" 
              style={{ width: 'auto', minWidth: '160px', padding: '0.45rem 0.75rem', fontSize: '0.84rem' }}
            >
              <option value="All Products">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat?.id} value={cat?.name}>{cat?.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button 
                type="button"
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} 
                onClick={() => setStatusFilter('all')}
              >
                All ({products.length})
              </button>
              <button 
                type="button"
                className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`} 
                onClick={() => setStatusFilter('active')}
              >
                Active ({activeCount})
              </button>
              <button 
                type="button"
                className={`filter-btn ${statusFilter === 'disabled' ? 'active' : ''}`} 
                onClick={() => setStatusFilter('disabled')}
              >
                Disabled ({disabledCount})
              </button>
            </div>
            <button 
              type="button"
              className={`filter-btn ${featuredOnly ? 'active' : ''}`} 
              onClick={() => setFeaturedOnly(!featuredOnly)}
              style={{ gap: '0.35rem' }}
            >
              <Star size={13} fill={featuredOnly ? 'currentColor' : 'none'} /> Featured ({featuredCount})
            </button>
            {(searchQuery || activeCategory !== 'All Products' || statusFilter !== 'all' || featuredOnly) && (
              <button 
                type="button" 
                onClick={handleResetFilters} 
                className="btn btn-secondary btn-sm" 
                style={{ gap: '0.3rem' }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Catalog Table Container matching Dashboard aesthetic */}
      <div id="catalog-table-panel" className="admin-panel-card">
        <div className="panel-card-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="panel-card-title">Catalogue Formulations</h3>
            <p className="panel-card-subtitle" style={{ marginTop: '0.15rem' }}>
              {filteredProducts.length > 0 ? (
                <>
                  Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> registered products
                  {totalPages > 1 && (
                    <span style={{ color: '#64748b', fontWeight: 500 }}> (Page {currentPage} of {totalPages})</span>
                  )}
                </>
              ) : (
                '0 registered products found'
              )}
            </p>
          </div>
          {filteredProducts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="admin-pagination-pill">50 per page</span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                Live Catalog
              </span>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="admin-empty-table" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <Package size={44} style={{ opacity: 0.35, marginBottom: '0.75rem', color: '#64748b' }} />
            <h4 style={{ margin: '0 0 0.35rem', color: '#0f172a', fontWeight: 700, fontSize: '1rem' }}>No products match your criteria</h4>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', maxWidth: '380px' }}>
              Try adjusting your search query, switching categories, or clearing active filters.
            </p>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={handleResetFilters} 
              style={{ marginTop: '1rem' }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Product Details</th>
                    <th style={{ width: '16%' }}>SKU Code</th>
                    <th style={{ width: '20%' }}>Category</th>
                    <th style={{ width: '14%' }}>Visibility</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const isActive = product?.active !== false;
                    return (
                      <tr key={product.id}>
                        {/* Product Details */}
                        <td>
                          <div className="product-cell-wrapper">
                            <div className="product-thumb-box">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} />
                              ) : (
                                <FlaskConical size={16} color="#94a3b8" />
                              )}
                            </div>
                            <div className="product-info-column">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                                <strong className="product-cell-name" title={product.name}>
                                  {product.name}
                                </strong>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFeatured(product.id)}
                                  title={product.featured ? 'Featured Product (click to toggle)' : 'Click to feature in showcase'}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <Star 
                                    size={13} 
                                    fill={product.featured ? '#f59e0b' : 'none'} 
                                    color={product.featured ? '#f59e0b' : '#cbd5e1'} 
                                  />
                                </button>
                              </div>
                              <span className="product-cell-sub" title={product.appearance || 'Standard technical grade'}>
                                {product.appearance || 'Standard technical grade'}
                              </span>
                              {(product.tdsUrl || product.sdsUrl) && (
                                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.15rem' }}>
                                  {product.tdsUrl && (
                                    <a 
                                      href={product.tdsUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.08rem 0.35rem', borderRadius: '4px', background: '#ecfdf5', color: '#047857', textDecoration: 'none', border: '1px solid #a7f3d0' }}
                                    >
                                      TDS ↗
                                    </a>
                                  )}
                                  {product.sdsUrl && (
                                    <a 
                                      href={product.sdsUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.08rem 0.35rem', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', textDecoration: 'none', border: '1px solid #bfdbfe' }}
                                    >
                                      SDS ↗
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU Code */}
                        <td>
                          <span className="sku-badge" title={product.code}>{product.code}</span>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="product-category-tag" title={product.category}>{product.category}</span>
                        </td>

                        {/* Active/Disabled Toggle Button */}
                        <td>
                          <button 
                            type="button" 
                            className={`status-toggle-btn ${isActive ? 'active' : 'inactive'}`} 
                            onClick={() => toggleProductActive(product.id)}
                            title={isActive ? 'Click to disable' : 'Click to enable'}
                          >
                            {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                            <span>{isActive ? 'Active' : 'Disabled'}</span>
                          </button>
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => navigate(`${basePath}/products/${product.id}/edit`)}
                              style={{ padding: '0.2rem 0.5rem', fontSize: 'clamp(0.72rem, 0.75vw, 0.78rem)' }}
                              title="Edit product"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button 
                              type="button" 
                              className="admin-icon-btn danger" 
                              onClick={() => handleDelete(product.id, product.name)}
                              title={`Delete ${product.name}`}
                              style={{ width: '26px', height: '26px' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            <div className="admin-pagination-bar">
              <div className="admin-pagination-info">
                <span>
                  Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> products
                </span>
                <span className="admin-pagination-pill">50 per page</span>
              </div>

              {totalPages > 1 && (
                <div className="admin-pagination-actions">
                  <button
                    type="button"
                    className="admin-page-nav-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="admin-page-numbers">
                    {paginationRange.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="admin-page-ellipsis">
                            …
                          </span>
                        );
                      }
                      const isCurrent = currentPage === page;
                      return (
                        <button
                          key={`page-${page}`}
                          type="button"
                          className={`admin-page-num-btn ${isCurrent ? 'active' : ''}`}
                          onClick={() => handlePageChange(Number(page))}
                          aria-current={isCurrent ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="admin-page-nav-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next Page"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
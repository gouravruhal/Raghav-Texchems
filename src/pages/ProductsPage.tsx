import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ProductCard } from '../components/products/ProductCard';
import { TechSpecModal } from '../components/products/TechSpecModal';
import type { Product } from '../types';
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  LayoutGrid,
  List,
  FileText,
  ArrowRight,
  FlaskConical
} from 'lucide-react';
import { sanitizeSearchQuery } from '../lib/validation';

const ITEMS_PER_PAGE = 12;

export const ProductsPage: React.FC = () => {
  const { products, companySettings } = useData();
  const activeProducts = useMemo(() => products.filter((p) => p.active !== false), [products]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination state (12 products max per page)
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Multi-category filter state
  const categoryFromUrl = searchParams.get('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    return categoryFromUrl && categoryFromUrl !== 'All Products' ? [categoryFromUrl] : [];
  });
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // View mode: 'grid' (container view, default) or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected product for Tech Specs modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync state if category changes in URL externally
  useEffect(() => {
    if (categoryFromUrl && categoryFromUrl !== 'All Products') {
      setSelectedCategories((prev) => (prev.includes(categoryFromUrl) ? prev : [categoryFromUrl]));
    }
  }, [categoryFromUrl]);

  // Ensure body scrolling is active when browsing products and unlocked when no modal is open
  useEffect(() => {
    if (!selectedProduct) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, [selectedProduct]);

  // Extract all unique categories present in active products
  const availableCategories = useMemo(() => {
    const unique = Array.from(new Set(activeProducts.map((p) => p.category).filter(Boolean)));
    return unique.sort();
  }, [activeProducts]);

  // Toggle category selection
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(cat);
      const next = exists ? prev.filter((c) => c !== cat) : [...prev, cat];
      if (next.length === 1) {
        setSearchParams({ category: next[0] });
      } else {
        setSearchParams({});
      }
      return next;
    });
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSearchParams({});
    setIsFilterOpen(false);
  };

  // Remove a single category chip
  const handleRemoveCategory = (cat: string) => {
    toggleCategory(cat);
  };

  // Primary contact info for inquiries
  const primaryContact = (companySettings?.contacts || []).find((c) => c.active) || companySettings?.contacts?.[0];
  const handleWhatsAppInquiry = (product: Product) => {
    const contactName = primaryContact?.name || companySettings.contact1Name;
    const contactPhone = primaryContact?.phone || companySettings.contact1Phone;
    const text = `Hello ${contactName}, I am interested in technical specs & quotation for ${product.name} (${product.code}).`;
    window.open(`https://wa.me/91${contactPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filter products by search matching ANY property and selected categories
  const filteredProducts = useMemo(() => {
    const query = sanitizeSearchQuery(searchQuery).toLowerCase().trim();

    return activeProducts.filter((p) => {
      // Category filter check (multi-category match)
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => cat.toLowerCase() === p.category?.toLowerCase());

      if (!matchesCategory) return false;

      // If no search query, include if category matched
      if (!query) return true;

      // Search matches ANY field of the product
      const inName = p.name?.toLowerCase().includes(query) ?? false;
      const inCode = p.code?.toLowerCase().includes(query) ?? false;
      const inCategory = p.category?.toLowerCase().includes(query) ?? false;
      const inDesc = p.description?.toLowerCase().includes(query) ?? false;
      const inAppearance = p.appearance?.toLowerCase().includes(query) ?? false;
      const inActiveContent = p.activeContent?.toLowerCase().includes(query) ?? false;
      const inViscosity = p.viscosity?.toLowerCase().includes(query) ?? false;
      const inPh = p.ph?.toLowerCase().includes(query) ?? false;
      const inIonic = p.ionicNature?.toLowerCase().includes(query) ?? false;
      const inSolubility = p.solubility?.toLowerCase().includes(query) ?? false;
      const inShelfLife = p.shelfLife?.toLowerCase().includes(query) ?? false;
      const inStock = p.stockStatus?.toLowerCase().includes(query) ?? false;
      const inApps = Boolean(p.applications) && p.applications.some((app) => app?.toLowerCase().includes(query));
      const inPackaging = Boolean(p.packaging) && p.packaging.some((pack) => pack?.toLowerCase().includes(query));

      return (
        inName ||
        inCode ||
        inCategory ||
        inDesc ||
        inAppearance ||
        inActiveContent ||
        inViscosity ||
        inPh ||
        inIonic ||
        inSolubility ||
        inShelfLife ||
        inStock ||
        inApps ||
        inPackaging
      );
    });
  }, [activeProducts, selectedCategories, searchQuery]);

  // Reset to page 1 whenever search query or category filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories]);

  // Total pages count (max 12 products per page)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  // Ensure valid current page if list shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated product slice (maximum 12 products per page)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Smooth scroll to top of catalog on page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate pagination numbers list with ellipsis
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

  // Scroll reveal animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const items = document.querySelectorAll('.product-scroll-item');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [paginatedProducts, viewMode]);

  return (
    <div className="products-page-container">
      <div className="section-container products-content-layout">
        {/* TOP CONTROLS BAR: Left search, Right filter & view switcher */}
        <div className="products-top-controls-bar">
          {/* TOP LEFT: Global Reactive Search Bar */}
          <div className="products-search-container">
            <div className="products-search-bar">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Search chemical name, code (e.g. RTC), application, pH, active content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* TOP RIGHT: Category Multi-Select Filter + Clear Filter + View Mode Switcher */}
          <div className="products-actions-container">
            {/* Category Dropdown Multi-Select */}
            <div className="category-filter-dropdown-wrapper" ref={filterDropdownRef}>
              <button
                type="button"
                className={`category-filter-trigger-btn ${selectedCategories.length > 0 ? 'active' : ''}`}
                onClick={() => setIsFilterOpen((prev) => !prev)}
                aria-expanded={isFilterOpen}
                aria-haspopup="true"
              >
                <Filter size={16} />
                <span>Categories</span>
                {selectedCategories.length > 0 && (
                  <span className="filter-count-badge">{selectedCategories.length}</span>
                )}
                <ChevronDown size={14} className={`dropdown-chevron ${isFilterOpen ? 'open' : ''}`} />
              </button>

              {/* Floating Filter Popover */}
              {isFilterOpen && (
                <div className="category-filter-menu animate-scale-in">
                  <div className="filter-menu-header">
                    <span className="filter-menu-title">Select Categories</span>
                    {selectedCategories.length > 0 && (
                      <button
                        type="button"
                        className="filter-menu-clear-link"
                        onClick={() => {
                          setSelectedCategories([]);
                          setSearchParams({});
                        }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="filter-menu-list">
                    {availableCategories.map((cat) => {
                      const isChecked = selectedCategories.includes(cat);
                      const count = activeProducts.filter((p) => p.category === cat).length;
                      return (
                        <label key={cat} className="filter-menu-item">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategory(cat)}
                          />
                          <span className="custom-checkbox">
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className="filter-item-name">{cat}</span>
                          <span className="filter-item-count">{count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Clear / Remove Filter on the right side of the filter section */}
            {(selectedCategories.length > 0 || searchQuery) && (
              <button
                type="button"
                className="clear-filters-btn"
                onClick={handleClearAllFilters}
                title="Remove all active filters"
                aria-label="Remove all active filters"
              >
                <X size={14} />
                <span>Remove Filters</span>
              </button>
            )}

            {/* View Mode Toggle: Container (Cards) vs List View */}
            <div className="view-mode-toggle-group" role="group" aria-label="Product display view">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Container View (Default)"
                aria-label="Container View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
                aria-label="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS & RESULTS SUMMARY */}
        <div className="products-results-summary-bar">
          <div className="products-results-count">
            Showing <strong>{filteredProducts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong>–<strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> chemical formulations
            {totalPages > 1 && (
              <span className="products-page-badge"> • Page {currentPage} of {totalPages}</span>
            )}
          </div>

          {/* Active Category Chips */}
          {selectedCategories.length > 0 && (
            <div className="active-filters-chips-bar">
              {selectedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="active-filter-chip"
                  onClick={() => handleRemoveCategory(cat)}
                  title={`Remove ${cat} filter`}
                >
                  <span>{cat}</span>
                  <X size={12} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCTS PRESENTATION: Container (Grid) View vs List View (12 items per page) */}
        {filteredProducts.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              /* 1. CONTAINER VIEW (Cards Grid) */
              <div className="products-grid products-scroll-container">
                {paginatedProducts.map((product, idx) => (
                  <div
                    key={product.id}
                    className="product-scroll-item"
                    style={{ transitionDelay: `${(idx % 4) * 65}ms` }}
                  >
                    <ProductCard
                      product={product}
                      onSelectTechSpecs={(p) => setSelectedProduct(p)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* 2. LIST VIEW (Detailed Row Containers) */
              <div className="products-list-layout products-scroll-container">
                {paginatedProducts.map((product, idx) => (
                  <div
                    key={product.id}
                    className="product-list-row product-scroll-item"
                    style={{ transitionDelay: `${(idx % 4) * 65}ms` }}
                  >
                    {/* Thumbnail / Emblem */}
                    <div className="list-row-image-col">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="list-row-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="list-row-icon-fallback">
                          <FlaskConical size={32} color="#94a3b8" />
                        </div>
                      )}
                    </div>

                    {/* Product Information */}
                    <div className="list-row-info-col">
                      <div className="list-row-meta-header">
                        <span className="list-row-code">{product.code}</span>
                        <span className="list-row-category-badge">{product.category}</span>
                        {product.stockStatus && (
                          <span className="list-row-stock-badge">{product.stockStatus}</span>
                        )}
                      </div>

                      <h3 className="list-row-name">{product.name}</h3>
                      <p className="list-row-desc">{product.description}</p>

                      {/* Quick Specs Chips */}
                      <div className="list-row-specs-wrap">
                        {product.activeContent && (
                          <span className="list-spec-chip">
                            <strong>Active:</strong> {product.activeContent}
                          </span>
                        )}
                        {product.appearance && (
                          <span className="list-spec-chip">
                            <strong>Appearance:</strong> {product.appearance}
                          </span>
                        )}
                        {product.ionicNature && (
                          <span className="list-spec-chip">
                            <strong>Ionic:</strong> {product.ionicNature}
                          </span>
                        )}
                        {product.ph && (
                          <span className="list-spec-chip">
                            <strong>pH:</strong> {product.ph}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="list-row-actions-col">
                      <button
                        type="button"
                        className="btn-list-specs"
                        onClick={() => setSelectedProduct(product)}
                        title="Inspect Technical Specs"
                      >
                        <FileText size={16} />
                        <span>Tech Specs</span>
                      </button>

                      <button
                        type="button"
                        className="btn-list-inquire"
                        onClick={() => handleWhatsAppInquiry(product)}
                        title="Inquire via WhatsApp"
                      >
                        <span>Inquire</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION CONTROLS BELOW PRODUCTS */}
            {totalPages > 1 && (
              <div className="products-pagination-container">
                <button
                  type="button"
                  className="pagination-btn pagination-nav-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                <div className="pagination-numbers-list">
                  {paginationRange.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                          …
                        </span>
                      );
                    }
                    const isCurrent = currentPage === page;
                    return (
                      <button
                        key={`page-btn-${page}`}
                        type="button"
                        className={`pagination-btn pagination-num-btn ${isCurrent ? 'active' : ''}`}
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
                  className="pagination-btn pagination-nav-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* EMPTY STATE */
          <div className="products-empty-state animate-fade-in">
            <div className="empty-state-icon">
              <FlaskConical size={36} />
            </div>
            <h3 className="empty-state-title">No Matching Chemical Formulations</h3>
            <p className="empty-state-text">
              {activeProducts.length === 0
                ? 'No active products are currently configured in the database.'
                : `We couldn't find any formulations matching your search "${searchQuery}" or selected category filters.`}
            </p>
            {(selectedCategories.length > 0 || searchQuery) && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearAllFilters}
                style={{ marginTop: '1.25rem' }}
              >
                Clear All Filters & Show All
              </button>
            )}
          </div>
        )}
      </div>

      {/* TECHNICAL DATA SHEET MODAL (Only mounted when a product is selected) */}
      {selectedProduct && (
        <TechSpecModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};


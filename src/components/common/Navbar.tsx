import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Droplets,
  Layers,
  FileText,
  Sparkles,
  Package,
  Activity,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import logoImg from '../../assets/logo-icon.png';

export const Navbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { products, companySettings } = useData();
  const location = useLocation();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Dynamic category extraction from active products
  const activeProducts = products.filter((product) => product.active !== false);
  const activeCategories = Array.from(
    new Set(activeProducts.map((p) => p.category).filter(Boolean))
  );

  const hasActiveProducts = activeProducts.length > 0 && activeCategories.length > 0;

  // Helper to map category names to distinct Lucide icons
  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('dye') || lower.includes('color')) return <Droplets size={16} />;
    if (lower.includes('polymer') || lower.includes('emulsion')) return <Layers size={16} />;
    if (lower.includes('paper') || lower.includes('coating')) return <FileText size={16} />;
    if (lower.includes('textile') || lower.includes('auxiliary')) return <Sparkles size={16} />;
    if (lower.includes('pack') || lower.includes('resin')) return <Package size={16} />;
    return <Activity size={16} />;
  };

  return (
    <header className={`navbar-header-wrapper ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="navbar" aria-label="Main Navigation">
        {/* Left: Small Brand Logo + Divider + Company Name */}
        <Link
          to="/"
          className="logo-container"
          id="brand-logo-link"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <img
            src={companySettings.logoUrl || logoImg}
            alt="Raghav Texchems Logo"
            className="navbar-brand-logo-small"
          />
          <div className="brand-vertical-divider" aria-hidden="true" />
          <div className="logo-text-group">
            <span className="logo-title">Raghav Texchems</span>
            <span className="logo-subtext">CHEMICAL PVT. LTD.</span>
            <span className="logo-tagline">
              {companySettings.tagline || 'Chemistry That Connects'}
            </span>
          </div>
        </Link>

        {/* Center: Neat rounded pill container with pages, no box container on active item */}
        <div className="navbar-center-nav">
          <ul className="nav-pill-container">
            {/* 1. Home */}
            <li className="nav-item">
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                id="nav-link-home"
              >
                <span>Home</span>
              </Link>
            </li>

            {/* 2. Products & Solutions */}
            <li
              className="nav-item dropdown-wrapper"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <Link
                to="/products"
                className={`nav-link dropdown-trigger ${isActive('/products') ? 'active' : ''}`}
                id="nav-link-products"
                aria-expanded={isDropdownOpen}
              >
                <span>Products & Solutions</span>
                {hasActiveProducts && (
                  <ChevronDown
                    size={14}
                    className={`chevron-icon ${isDropdownOpen ? 'rotated' : ''}`}
                  />
                )}
              </Link>

              {hasActiveProducts && isDropdownOpen && (
                <div className="dropdown-menu animate-fade-in">
                  <div className="dropdown-header-bar">
                    <span className="dropdown-header-title">Product Categories</span>
                    <span className="dropdown-count-badge">{activeProducts.length} Products</span>
                  </div>

                  <div className="dropdown-list">
                    {activeCategories.map((cat) => {
                      const count = activeProducts.filter((p) => p.category === cat).length;
                      return (
                        <Link
                          key={cat}
                          to={`/products?category=${encodeURIComponent(cat)}`}
                          className="dropdown-item"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className="dropdown-icon">{getCategoryIcon(cat)}</div>
                          <div className="dropdown-item-content">
                            <div className="dropdown-item-name">{cat}</div>
                            <span className="dropdown-item-meta">{count} formulations</span>
                          </div>
                          <ChevronRight size={14} className="dropdown-arrow-hint" />
                        </Link>
                      );
                    })}
                  </div>

                  <div className="dropdown-footer-bar">
                    <Link
                      to="/products"
                      className="dropdown-all-link"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      View All Products & TDS <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </li>

            {/* 3. Our Story */}
            <li className="nav-item">
              <Link
                to="/about"
                className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                id="nav-link-about"
              >
                <span>Our Story</span>
              </Link>
            </li>

            {/* 4. Contact Us */}
            <li className="nav-item">
              <Link
                to="/contact"
                className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
                id="nav-link-contact"
              >
                <span>Contact Us</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Right: Kept empty per design reference (only mobile toggle button for small screens) */}
        <div className="navbar-right-empty">
          <button
            className="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-drawer animate-slide-down">
            <Link
              to="/"
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Home</span>
            </Link>

            <div className="mobile-divider" />

            <Link
              to="/products"
              className={`mobile-nav-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Products & Solutions</span>
            </Link>

            {hasActiveProducts && (
              <div className="mobile-category-list">
                {activeCategories.map((cat) => (
                  <Link
                    key={cat}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    className="mobile-category-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mobile-divider" />

            <Link
              to="/about"
              className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Our Story</span>
            </Link>

            <div className="mobile-divider" />

            <Link
              to="/contact"
              className={`mobile-nav-link ${isActive('/contact') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>Contact Us</span>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

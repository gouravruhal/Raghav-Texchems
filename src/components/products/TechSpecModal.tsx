import React, { useEffect } from 'react';
import type { Product } from '../../types';
import { 
  X, 
  Download, 
  ArrowRight, 
  FlaskConical, 
  FileText, 
  ExternalLink 
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface TechSpecModalProps {
  product: Product | null;
  onClose: () => void;
}

export const TechSpecModal: React.FC<TechSpecModalProps> = ({ product, onClose }) => {
  const { companySettings } = useData();
  const primaryContact = (companySettings?.contacts || []).find((contact) => contact.active) || companySettings?.contacts?.[0];

  // Close on Escape key press and lock background page scrolling ONLY when modal is active
  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Lock background page scroll to prevent product page from scrolling
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Prevent layout shift from scrollbar disappearing
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || '';
      document.body.style.paddingRight = originalPaddingRight || '';
    };
  }, [product, onClose]);

  if (!product) return null;

  const handleWhatsAppQuote = () => {
    const contactName = primaryContact?.name || companySettings.contact1Name;
    const contactPhone = primaryContact?.phone || companySettings.contact1Phone;
    const text = `Hello ${contactName}, I require technical data sheet & pricing quote for ${product.name} (${product.code}).`;
    window.open(`https://wa.me/91${contactPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadTDS = () => {
    if (product.tdsUrl) {
      window.open(product.tdsUrl, '_blank');
    } else {
      alert(`Technical Data Sheet (TDS) for ${product.name} will be dispatched by our technical team.`);
    }
  };

  // Standard packaging fallback if product has no packaging defined
  const packagingList = product.packaging && product.packaging.length > 0 
    ? product.packaging 
    : [
        '25 Litre Metal Cans', 
        '50 Litre HDPE Carboys',
        '200 Litre Epoxy-Coated Steel Barrels', 
        '1000 Litre Bulk IBC Totes'
      ];

  const applicationsList = product.applications && product.applications.length > 0 
    ? product.applications 
    : [
        'Automated Corrugation Adhesive', 
        'Laminating Adhesive for Packaging', 
        'Wood Furniture & Joinery Bonding', 
        'High-Speed Paper Bag Manufacture',
        'Textile Sizing & Finishing Binder',
        'Architectural Coating & Primer Emulsion'
      ];

  const specParameters = [
    { label: 'Appearance', value: product.appearance || 'Clear light straw liquid with mild citrus pine odor' },
    { label: 'pH Value (@ 25°C)', value: product.ph || '6.5 - 7.5 (at 5% emulsion)' },
    { label: 'Active Solid Content', value: product.activeContent || '99.5% Active Solvents & Surfactants' },
    { label: 'Viscosity (@ 25°C)', value: product.viscosity || '15 - 35 cP @ 25°C' },
    { label: 'Ionic Nature', value: product.ionicNature || 'Non-Ionic' },
    { label: 'Recommended Shelf Life', value: product.shelfLife || '18 Months in closed container in well-ventilated dry warehouse' },
    { label: 'Solubility & Dispersion', value: product.solubility || 'Forms a milky spontaneous self-emulsifying dispersion in water' },
    { label: 'Specific Gravity (@ 20°C)', value: '1.04 - 1.09 g/cm³' },
    { label: 'Flammability / Flash Point', value: 'Non-flammable (Water-based formulation)' },
    { label: 'VOC & Solvent Content', value: 'Low VOC (< 0.5%) / Free from toxic solvents' }
  ];

  return (
    <div className="tech-spec-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="tech-spec-modal-wide" onClick={(e) => e.stopPropagation()}>
        
        {/* Left Sub-Container: Non-scrollable product identity & CTAs */}
        <div className="tech-spec-aside">
          {/* 1. Pic on top */}
          <div className="tech-spec-img-box">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="tech-spec-img" 
              />
            ) : (
              <div className="tech-spec-img-placeholder">
                <FlaskConical size={48} strokeWidth={1.5} color="#2563eb" />
                <span>Chemical Formulation Grade</span>
              </div>
            )}
          </div>

          {/* 2. Product ID & 3. Category */}
          <div className="tech-spec-meta-block">
            <div className="tech-spec-meta-row">
              <span className="tech-spec-meta-label">PRODUCT ID</span>
              <span className="tech-spec-sku-code" title={product.code}>{product.code}</span>
            </div>

            <div className="tech-spec-meta-row">
              <span className="tech-spec-meta-label">CATEGORY</span>
              <span className="tech-spec-category-pill" title={product.category}>{product.category}</span>
            </div>
          </div>

          {/* 4. Product Name */}
          <div className="tech-spec-left-name-box">
            <span className="tech-spec-name-label">PRODUCT NAME</span>
            <h2 className="tech-spec-left-title">{product.name}</h2>
          </div>

          {/* 5. 3 Action Buttons */}
          <div className="tech-spec-aside-actions">
            <button
              type="button"
              className="btn btn-primary tech-spec-btn-action"
              onClick={handleWhatsAppQuote}
            >
              <span>Direct WhatsApp Quote</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              className="btn btn-secondary tech-spec-btn-action"
              onClick={handleDownloadTDS}
              title={product.tdsUrl ? 'Download Official Technical Data Sheet' : 'Request Official TDS'}
            >
              <Download size={15} />
              <span>Download TDS Sheet</span>
            </button>

            {product.sdsUrl ? (
              <a
                href={product.sdsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary tech-spec-btn-action"
                title="View Safety Data Sheet (SDS)"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={15} />
                <span>Safety Data Sheet (MSDS)</span>
              </a>
            ) : (
              <button
                type="button"
                className="btn btn-secondary tech-spec-btn-action"
                onClick={() => alert(`Safety Data Sheet (MSDS) for ${product.name} is available on request from Raghav Texchems chemical team.`)}
                title="Safety Data Sheet available on request"
              >
                <FileText size={15} />
                <span>Safety Data Sheet (MSDS)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Sub-Container: Scrollable & Mannered Minimal Specifications */}
        <div className="tech-spec-main">
          {/* Sticky Header with Close Button */}
          <div className="tech-spec-header-sticky">
            <div className="tech-spec-header-info">
              <span className="tech-spec-header-badge">
                TECHNICAL DATA SHEET SPECIFICATIONS
              </span>
              <span className="tech-spec-header-subtitle">Comprehensive formulation parameters & specification profile</span>
            </div>

            <button 
              type="button" 
              className="tech-spec-close-btn" 
              onClick={onClose}
              aria-label="Close Technical Specification"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="tech-spec-scroll-content">
            {/* 01. Product Formulation Overview */}
            <div className="tech-spec-minimal-card">
              <div className="tech-spec-minimal-heading">
                <span className="tech-spec-heading-text">01. PRODUCT OVERVIEW & FORMULATION</span>
              </div>
              <p className="tech-spec-minimal-desc">
                {product.description || 'High-performance commercial industrial chemical formulation engineered for maximum stability, uniform bonding, and strict compliance with chemical technical standards.'}
              </p>
            </div>

            {/* 02. Core Chemical & Physical Parameters */}
            <div className="tech-spec-minimal-card">
              <div className="tech-spec-minimal-heading">
                <span className="tech-spec-heading-text">02. CORE CHEMICAL & PHYSICAL PARAMETERS</span>
              </div>

              <div className="tech-spec-param-grid">
                {specParameters.map((spec, idx) => (
                  <div key={idx} className="tech-spec-param-card">
                    <span className="tech-spec-param-label">{spec.label}</span>
                    <span className="tech-spec-param-val" title={spec.value}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 03. Recommended Industrial Applications */}
            <div className="tech-spec-minimal-card">
              <div className="tech-spec-minimal-heading">
                <span className="tech-spec-heading-text">03. RECOMMENDED INDUSTRIAL APPLICATIONS</span>
              </div>
              <div className="tech-spec-minimal-apps-grid">
                {applicationsList.map((app, idx) => (
                  <div key={idx} className="tech-spec-minimal-app-item">
                    <span>{app}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 04. Standard Packaging Options */}
            <div className="tech-spec-minimal-card">
              <div className="tech-spec-minimal-heading">
                <span className="tech-spec-heading-text">04. STANDARD PACKAGING & DISPATCH SIZES</span>
              </div>
              <div className="tech-spec-minimal-packaging-grid">
                {packagingList.map((pack, idx) => (
                  <div key={idx} className="tech-spec-minimal-pack-card">
                    <span className="tech-spec-pack-name">{pack}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 05. Storage, Handling & Application Guidelines */}
            <div className="tech-spec-minimal-card">
              <div className="tech-spec-minimal-heading">
                <span className="tech-spec-heading-text">05. STORAGE, STABILITY & SAFE HANDLING</span>
              </div>
              <div className="tech-spec-guidelines-list">
                <div className="tech-spec-guideline-item">
                  <span className="tech-spec-guideline-bullet">•</span>
                  <span><strong>Storage Temperature:</strong> Store between 5°C and 35°C in clean, original sealed containers. Protect strictly from freezing and prolonged exposure to direct sunlight.</span>
                </div>
                <div className="tech-spec-guideline-item">
                  <span className="tech-spec-guideline-bullet">•</span>
                  <span><strong>Agitation:</strong> Stir or homogenize well before automated dispensing, mixing, or application.</span>
                </div>
                <div className="tech-spec-guideline-item">
                  <span className="tech-spec-guideline-bullet">•</span>
                  <span><strong>Airtight Resealing:</strong> Keep lids tightly sealed immediately after drawing product to avoid surface film formation or evaporation.</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

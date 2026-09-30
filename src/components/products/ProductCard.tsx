import React from 'react';
import type { Product } from '../../types';
import { FileText, ArrowRight, FlaskConical } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface ProductCardProps {
  product: Product;
  onSelectTechSpecs?: (product: Product) => void;
  showActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onSelectTechSpecs,
  showActions = true 
}) => {
  const { companySettings } = useData();
  const primaryContact = (companySettings?.contacts || []).find((contact) => contact.active) || companySettings?.contacts?.[0];

  const handleWhatsAppInquiry = () => {
    const contactName = primaryContact?.name || companySettings.contact1Name;
    const contactPhone = primaryContact?.phone || companySettings.contact1Phone;
    const text = `Hello ${contactName}, I am interested in technical specs & quotation for ${product.name} (${product.code}).`;
    window.open(`https://wa.me/91${contactPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div 
      className="catalog-product-card"
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        background: '#fff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        transition: 'box-shadow 0.2s, transform 0.2s' 
      }}
    >
      {/* 1. Image Area (Fixed Height) */}
      <div style={{ height: '220px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid #e2e8f0' }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <FlaskConical size={48} color="#cbd5e1" />
        )}
        <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.95)', color: '#1e40af', fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.6rem', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
          {product.category}
        </span>
      </div>

      {/* 2. Core Information */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace', marginBottom: '0.35rem', fontWeight: 600 }}>
          {product.code}
        </div>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#0f172a', fontWeight: 700, lineHeight: 1.3 }}>
          {product.name}
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1 }}>
          {product.description}
        </p>
      </div>

      {/* 3. Standardized Actions (Only rendered when showActions is true) */}
      {showActions && (
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', background: '#f8fafc' }}>
          <button
            onClick={() => onSelectTechSpecs && onSelectTechSpecs(product)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: '#fff', border: '1px solid #cbd5e1', color: '#334155', padding: '0.55rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
          >
            <FileText size={16} /> Specs
          </button>
          <button
            onClick={handleWhatsAppInquiry}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: '#2563eb', border: '1px solid #2563eb', color: '#fff', padding: '0.55rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
          >
            Inquire <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
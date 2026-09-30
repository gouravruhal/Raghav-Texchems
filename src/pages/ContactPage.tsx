import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CATEGORIES } from '../data/initialData';
import { Phone, Mail, Send, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateInquiryData, sanitizeString, LIMITS } from '../lib/validation';
import { checkRateLimit } from '../lib/rateLimiter';

export const ContactPage: React.FC = () => {
  const { companySettings, addInquiry } = useData();
  const activeContacts = companySettings.contacts.filter((contact) => contact.active && contact.name && contact.phone);
  const primaryContact = activeContacts[0];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    productCategory: CATEGORIES[1] || 'Dyestuff & Colorants',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Bot trap check (OWASP A04: Insecure Design defense)
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    setError('');

    // 1. Rate limiting check
    const rateCheck = checkRateLimit('public_inquiry_submit', {
      maxRequests: 3,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.allowed) {
      setError(`Too many requests submitted. Please wait ${rateCheck.retryAfterSeconds} seconds before sending another RFQ.`);
      return;
    }

    // 2. Input validation
    const validation = validateInquiryData({
      customerName: formData.name,
      phone: formData.phone,
      email: formData.email,
      companyName: formData.company,
      productCategory: formData.productCategory,
      message: formData.message,
    });

    if (!validation.valid) {
      setError(validation.error || 'Please provide all required details.');
      return;
    }

    setLoading(true);

    try {
      const result = await addInquiry({
        customerName: sanitizeString(formData.name, LIMITS.CUSTOMER_NAME),
        phone: sanitizeString(formData.phone, LIMITS.CUSTOMER_PHONE),
        email: sanitizeString(formData.email, LIMITS.CUSTOMER_EMAIL).toLowerCase(),
        companyName: sanitizeString(formData.company, LIMITS.CUSTOMER_COMPANY),
        productCategory: sanitizeString(formData.productCategory, LIMITS.PRODUCT_CATEGORY),
        message: sanitizeString(formData.message, LIMITS.CUSTOMER_MESSAGE),
        assignedTo: primaryContact?.name || companySettings.contact1Name || 'Sales Team',
      });

      if (result && !result.success) {
        setError(result.error || 'Unable to submit inquiry at this time.');
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phone: string, text: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/91${clean}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="section-padding" style={{ paddingTop: '3rem' }}>
      <div className="section-header">
        <h2 className="section-title">Reach Our Technical Team</h2>
        <p className="section-subtitle">
          Connect directly with our sales and technical team for quotes, technical parameters, and custom formulation inquiries.
        </p>
      </div>

      <div className="contact-layout">
        {/* Contact Cards */}
        <div className="contact-info-panel">
          {activeContacts.map((contact, index) => (
            <div className="contact-person-card" key={contact.id}>
              <div className="person-avatar" style={index % 2 ? { background: 'linear-gradient(135deg, #0c2b64 0%, #0369a1 100%)' } : undefined}>
                {contact.name.split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase()}
              </div>
              <div className="person-details">
                <div className="person-name">{contact.name}</div>
                <div className="person-title">{contact.title}</div>
                <a href={`tel:${contact.phone}`} className="person-phone"><Phone size={15} color="var(--primary-brand)" /> +91 {contact.phone}</a>
                {contact.email && <a href={`mailto:${contact.email}`} className="person-phone"><Mail size={14} color="var(--primary-brand)" /> {contact.email}</a>}
              </div>
              <div className="person-actions"><button className="icon-action-btn" style={{ background: '#dcfce7', color: '#15803d', border: 'none', cursor: 'pointer' }} onClick={() => openWhatsApp(contact.phone, `Hello ${contact.name}, I would like to inquire about chemical products.`)} title="Chat on WhatsApp"><Send size={18} /></button></div>
            </div>
          ))}

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--divider)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Mail size={20} color="var(--primary-brand)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>OFFICIAL EMAIL</div>
                <a href={`mailto:${companySettings.email}`} style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                  {companySettings.email}
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Building2 size={20} color="var(--primary-brand)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>REGISTERED COMPANY</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {companySettings.companyName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="contact-form-card">
          <h3 className="form-title">Send Technical RFQ Inquiry</h3>
          <p className="form-subtitle">Submit your chemical requirements to be added to our admin queue.</p>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.88rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div style={{ padding: '2rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.25rem', color: '#15803d', marginBottom: '0.5rem' }}>Inquiry Registered!</h4>
              <p style={{ color: '#166534', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Thank you, {formData.name}. Your inquiry has been submitted securely to our technical sales team.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    company: '',
                    productCategory: CATEGORIES[1] || 'Dyestuff & Colorants',
                    message: '',
                  });
                }}
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Anti-spam honeypot (OWASP A04) */}
              <div style={{ display: 'none', visibility: 'hidden', position: 'absolute', left: '-9999px' }} aria-hidden="true">
                <input
                  type="text"
                  name="website_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Your Name *</label>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{formData.name.length}/{LIMITS.CUSTOMER_NAME}</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={LIMITS.CUSTOMER_NAME}
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-Z\s.,\-()]/g, '');
                    setFormData({ ...formData, name: clean });
                  }}
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Phone / WhatsApp *</label>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{formData.phone.length}/{LIMITS.CUSTOMER_PHONE}</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={LIMITS.CUSTOMER_PHONE}
                    className="form-control"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9+\s.,\-()]/g, '');
                      setFormData({ ...formData, phone: clean });
                    }}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Email Address *</label>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{formData.email.length}/{LIMITS.CUSTOMER_EMAIL}</span>
                  </div>
                  <input
                    type="email"
                    required
                    maxLength={LIMITS.CUSTOMER_EMAIL}
                    className="form-control"
                    placeholder="e.g. client@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Company Name</label>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{formData.company.length}/{LIMITS.CUSTOMER_COMPANY}</span>
                </div>
                <input
                  type="text"
                  maxLength={LIMITS.CUSTOMER_COMPANY}
                  className="form-control"
                  placeholder="e.g. Acme Textile Mills"
                  value={formData.company}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-Z0-9\s.,\-()]/g, '');
                    setFormData({ ...formData, company: clean });
                  }}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Category Interest</label>
                <select
                  className="form-control"
                  value={formData.productCategory}
                  onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                  disabled={loading}
                >
                  {CATEGORIES.filter((c: string) => c !== 'All Products').map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Requirement Details / Message *</label>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{formData.message.length}/{LIMITS.CUSTOMER_MESSAGE}</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={LIMITS.CUSTOMER_MESSAGE}
                  className="form-control"
                  placeholder="Specify quantity, application details, or target TDS..."
                  value={formData.message}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^a-zA-Z0-9\s.,\-()]/g, '');
                    setFormData({ ...formData, message: clean });
                  }}
                  disabled={loading}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Allowed characters: letters, numbers, spaces, and . , - ( )
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Submitting...' : (
                  <>Submit Inquiry <Send size={16} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

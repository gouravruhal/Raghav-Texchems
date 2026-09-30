import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { sanitizeString, isValidHttpUrl } from '../../lib/validation';
import { uploadCompanyLogo } from '../../lib/storage';
import { ImageCropperModal } from '../../components/admin/ImageCropperModal';
import type { Collaboration, AboutContent, AboutMilestone } from '../../types';
import { INITIAL_ABOUT_CONTENT } from '../../data/initialData';
import { 
  Save, CheckCircle2, Handshake, Plus, Trash2, Edit2, 
  Eye, EyeOff, BookOpen, MapPin, Phone, Building2, ExternalLink,
  Upload, Link as LinkIcon, Crop, ImagePlus, Search, Sparkles, X,
  Calendar, Target, Globe, Video, ChevronUp, ChevronDown
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { 
    companySettings, 
    updateCompanySettings, 
    collaborations, 
    addCollaboration, 
    updateCollaboration, 
    deleteCollaboration, 
    toggleCollaborationActive, 
    aboutContent, 
    updateAboutContent 
  } = useData();

  const [activeTab, setActiveTab] = useState<'contact' | 'collaborations' | 'about'>('contact');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Tab States
  const [contactForm, setContactForm] = useState(companySettings);
  const [aboutForm, setAboutForm] = useState<AboutContent>(() => {
    return aboutContent ? { ...INITIAL_ABOUT_CONTENT, ...aboutContent } : INITIAL_ABOUT_CONTENT;
  });
  const [storyParagraphsText, setStoryParagraphsText] = useState(() => {
    if (aboutContent?.storyParagraphs && aboutContent.storyParagraphs.length > 0) {
      return aboutContent.storyParagraphs.join('\n\n');
    }
    return aboutContent?.storyMarkdown || (INITIAL_ABOUT_CONTENT.storyParagraphs || []).join('\n\n');
  });

  // Milestone Modal State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<AboutMilestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<AboutMilestone>({
    id: '',
    year: '',
    title: '',
    description: '',
  });
  
  // Alliance Search & Filter State
  const [collabSearch, setCollabSearch] = useState('');

  // Alliance Modal State
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);
  const [collabForm, setCollabForm] = useState<Omit<Collaboration, 'id'>>({ 
    name: '', 
    type: 'Strategic Alliance', 
    partnershipTier: 'Strategic Alliance',
    location: '', 
    badgeText: 'Official Partner',
    logoUrl: '', 
    logoPath: '', 
    websiteUrl: '', 
    description: '',
    active: true 
  });

  // Logo Source & Cropping States
  const [logoSourceMode, setLogoSourceMode] = useState<'upload' | 'url'>('upload');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoNotice, setLogoNotice] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when context data loads
  useEffect(() => { 
    if (companySettings) setContactForm(companySettings); 
  }, [companySettings]);
  
  useEffect(() => { 
    if (aboutContent) {
      const merged: AboutContent = {
        ...INITIAL_ABOUT_CONTENT,
        ...aboutContent,
        milestones: Array.isArray(aboutContent.milestones) && aboutContent.milestones.length > 0
          ? aboutContent.milestones
          : (INITIAL_ABOUT_CONTENT.milestones || []),
      };
      setAboutForm(merged);
      const text = (merged.storyParagraphs && merged.storyParagraphs.length > 0)
        ? merged.storyParagraphs.join('\n\n')
        : (merged.storyMarkdown || (INITIAL_ABOUT_CONTENT.storyParagraphs || []).join('\n\n'));
      setStoryParagraphsText(text);
    }
  }, [aboutContent]);

  const showSuccess = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3500);
  };

  // --- HANDLERS ---
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.address?.trim()) {
      alert('Address cannot be empty.');
      return;
    }
    // Merge existing locked data (like companyName, email) with the updated address and contacts
    updateCompanySettings({ 
      ...contactForm, 
      companyName: companySettings.companyName, 
      email: companySettings.email 
    });
    showSuccess('Contacts and location updated successfully!');
  };

  const handleAboutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paras = storyParagraphsText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const updated: AboutContent = {
      ...aboutForm,
      storyParagraphs: paras.length > 0 ? paras : (aboutForm.storyParagraphs || []),
      storyMarkdown: storyParagraphsText,
    };

    updateAboutContent(updated);
    showSuccess('About page content saved successfully!');
  };

  const handleOpenAddMilestone = () => {
    setEditingMilestone(null);
    setMilestoneForm({
      id: `m_${Date.now()}`,
      year: new Date().getFullYear().toString(),
      title: '',
      description: '',
    });
    setIsMilestoneModalOpen(true);
  };

  const handleOpenEditMilestone = (ms: AboutMilestone) => {
    setEditingMilestone(ms);
    setMilestoneForm({ ...ms });
    setIsMilestoneModalOpen(true);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneForm.year.trim()) {
      alert('Please enter a milestone year.');
      return;
    }
    if (!milestoneForm.title.trim()) {
      alert('Please enter a milestone title / heading.');
      return;
    }
    if (!milestoneForm.description.trim()) {
      alert('Please enter a small description for this milestone.');
      return;
    }

    const currentList = aboutForm.milestones || [];
    let updatedList: AboutMilestone[];
    if (editingMilestone) {
      updatedList = currentList.map((m) =>
        m.id === editingMilestone.id ? { ...milestoneForm } : m
      );
    } else {
      updatedList = [...currentList, { ...milestoneForm, id: milestoneForm.id || `m_${Date.now()}` }];
    }

    const paras = storyParagraphsText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const updatedAbout: AboutContent = {
      ...aboutForm,
      milestones: updatedList,
      storyParagraphs: paras.length > 0 ? paras : (aboutForm.storyParagraphs || []),
      storyMarkdown: storyParagraphsText,
    };
    setAboutForm(updatedAbout);
    updateAboutContent(updatedAbout);
    setIsMilestoneModalOpen(false);
    showSuccess(`Milestone "${milestoneForm.title}" saved!`);
  };

  const handleDeleteMilestone = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this milestone?')) return;
    const updatedList = (aboutForm.milestones || []).filter((m) => m.id !== id);
    const paras = storyParagraphsText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const updatedAbout: AboutContent = {
      ...aboutForm,
      milestones: updatedList,
      storyParagraphs: paras.length > 0 ? paras : (aboutForm.storyParagraphs || []),
      storyMarkdown: storyParagraphsText,
    };
    setAboutForm(updatedAbout);
    updateAboutContent(updatedAbout);
    showSuccess('Milestone removed!');
  };

  const handleMoveMilestone = (index: number, direction: 'up' | 'down') => {
    const list = [...(aboutForm.milestones || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const paras = storyParagraphsText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const updatedAbout: AboutContent = {
      ...aboutForm,
      milestones: list,
      storyParagraphs: paras.length > 0 ? paras : (aboutForm.storyParagraphs || []),
      storyMarkdown: storyParagraphsText,
    };
    setAboutForm(updatedAbout);
    updateAboutContent(updatedAbout);
    showSuccess('Milestone order updated!');
  };

  const handleOpenAddCollab = () => {
    setEditingCollab(null);
    setCollabForm({
      name: '',
      type: 'Textile Auxiliaries & Sizing Partner',
      partnershipTier: 'Strategic Alliance',
      location: '',
      badgeText: 'Official Partner',
      logoUrl: '',
      logoPath: '',
      websiteUrl: '',
      description: '',
      active: true,
    });
    setLogoSourceMode('upload');
    setLogoNotice(null);
    setIsCollabModalOpen(true);
  };

  const handleOpenEditCollab = (collab: Collaboration) => {
    setEditingCollab(collab);
    setCollabForm({
      name: collab.name || '',
      type: collab.type || 'Strategic Alliance',
      partnershipTier: collab.partnershipTier || 'Strategic Alliance',
      location: collab.location || '',
      badgeText: collab.badgeText || '',
      logoUrl: collab.logoUrl || '',
      logoPath: collab.logoPath || '',
      websiteUrl: collab.websiteUrl || '',
      description: collab.description || '',
      active: collab.active !== false,
    });
    setLogoSourceMode(
      collab.logoUrl && !collab.logoUrl.startsWith('data:') && !collab.logoUrl.includes('company-assets')
        ? 'url'
        : 'upload'
    );
    setLogoNotice(null);
    setIsCollabModalOpen(true);
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCropImageSrc(dataUrl);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedDataUrl: string, croppedBlob: Blob) => {
    // 1. Immediately set cropped image preview
    setCollabForm((prev) => ({ ...prev, logoUrl: croppedDataUrl }));
    setLogoNotice('Logo adjusted! Uploading to server...');

    // 2. Upload to Supabase storage
    try {
      setIsUploadingLogo(true);
      const fileToUpload = new File([croppedBlob], `partner-logo-${Date.now()}.png`, { type: 'image/png' });
      const result = await uploadCompanyLogo(fileToUpload);

      if (result.success && result.publicUrl) {
        setCollabForm((prev) => ({
          ...prev,
          logoUrl: result.publicUrl,
          logoPath: result.storagePath || '',
        }));
        setLogoNotice('Logo cropped & uploaded to secure storage!');
      } else {
        setLogoNotice('Logo cropped and stored locally.');
      }
    } catch (err) {
      console.warn('Storage upload notice:', err);
      setLogoNotice('Logo cropped & applied.');
    } finally {
      setIsUploadingLogo(false);
      setTimeout(() => setLogoNotice(null), 3500);
    }
  };

  const handleSaveCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabForm.name.trim()) {
      alert('Company full name is required.');
      return;
    }
    if (collabForm.websiteUrl && !isValidHttpUrl(collabForm.websiteUrl)) {
      alert('Enter a valid URL (starting with https:// or http://)');
      return;
    }

    const cleanCollab = { 
      ...collabForm, 
      name: sanitizeString(collabForm.name, 250),
      type: sanitizeString(collabForm.type || 'Strategic Alliance', 100),
      partnershipTier: sanitizeString(collabForm.partnershipTier || 'Strategic Alliance', 80),
      location: sanitizeString(collabForm.location || '', 150),
      badgeText: sanitizeString(collabForm.badgeText || '', 80),
      websiteUrl: sanitizeString(collabForm.websiteUrl || '', 1000), 
      logoUrl: sanitizeString(collabForm.logoUrl || '', 2000),
      logoPath: sanitizeString(collabForm.logoPath || '', 500)
    };

    if (editingCollab) {
      await updateCollaboration({ ...editingCollab, ...cleanCollab });
      showSuccess(`Alliance "${cleanCollab.name}" updated successfully!`);
    } else {
      await addCollaboration(cleanCollab);
      showSuccess(`Alliance "${cleanCollab.name}" added successfully!`);
    }
    setIsCollabModalOpen(false);
  };

  const filteredCollaborations = useMemo(() => {
    const q = collabSearch.toLowerCase().trim();
    if (!q) return collaborations;
    return collaborations.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q)) ||
      (c.badgeText && c.badgeText.toLowerCase().includes(q))
    );
  }, [collaborations, collabSearch]);

  return (
    <div className="admin-page-container">
      {/* PAGE HEADER */}
      <div className="admin-page-header">
        <div className="admin-header-title-block">
          <h1 className="admin-page-title">Website Content & Settings</h1>
          <p className="admin-page-subtitle">Manage public contacts, strategic tie-ups, and Markdown about content.</p>
        </div>
      </div>

      {savedMessage && (
        <div className="admin-success-alert animate-fade-in">
          <CheckCircle2 size={18} /> {savedMessage}
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div className="admin-tabs-nav-container">
        <div className="admin-tabs-nav">
          <button 
            type="button" 
            className={`admin-tab-btn ${activeTab === 'contact' ? 'active' : ''}`} 
            onClick={() => setActiveTab('contact')}
          >
            <Phone size={16} /> Contacts & Location
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${activeTab === 'collaborations' ? 'active' : ''}`} 
            onClick={() => setActiveTab('collaborations')}
          >
            <Handshake size={16} /> Alliances & Tie-Ups ({collaborations.length})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${activeTab === 'about' ? 'active' : ''}`} 
            onClick={() => setActiveTab('about')}
          >
            <BookOpen size={16} /> About Page (Markdown)
          </button>
        </div>
      </div>

      {/* =========================================================
          TAB 1: CONTACTS & LOCATION
          ========================================================= */}
      {activeTab === 'contact' && (
        <form onSubmit={handleContactSubmit} className="admin-settings-section-card">
          <div className="settings-card-header-flex">
            <div>
              <h3 className="settings-section-heading"><Phone size={18} color="#2563eb" /> Official Contacts</h3>
            </div>
            {/* Save Button perfectly positioned at the top */}
            <button type="submit" className="btn btn-primary"><Save size={16} /> Save Contacts</button>
          </div>

          <div className="settings-form-body">
            <div className="form-group">
              <label className="form-label">
                <MapPin size={14} color="#2563eb" style={{ display: 'inline', marginRight: '5px' }}/> 
                Plant & Office Address *
              </label>
              <input 
                type="text" 
                required 
                className="form-control" 
                value={contactForm.address} 
                onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })} 
                placeholder="Surat, Gujarat, India" 
              />
            </div>

            <div className="form-divider" />

            <div className="form-section-header">
              <div>
                <h4 className="form-section-title">Team Representatives</h4>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setContactForm({ 
                  ...contactForm, 
                  contacts: [...contactForm.contacts, { id: `c-${Date.now()}`, name: '', title: 'Representative', phone: '', active: true }] 
                })}
              >
                <Plus size={14} /> Add Contact
              </button>
            </div>

            <div className="settings-contacts-list">
              {contactForm.contacts.map((contact) => (
                <div key={contact.id} className="settings-contact-tile" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label-sub">Name</label>
                      <input 
                        required 
                        className="form-control" 
                        value={contact.name} 
                        onChange={(e) => setContactForm({ ...contactForm, contacts: contactForm.contacts.map(c => c.id === contact.id ? { ...c, name: e.target.value } : c) })} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label-sub">Designation</label>
                      <input 
                        required 
                        className="form-control" 
                        value={contact.title} 
                        onChange={(e) => setContactForm({ ...contactForm, contacts: contactForm.contacts.map(c => c.id === contact.id ? { ...c, title: e.target.value } : c) })} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label-sub">Phone / WhatsApp</label>
                      <input 
                        required 
                        className="form-control" 
                        value={contact.phone} 
                        onChange={(e) => setContactForm({ ...contactForm, contacts: contactForm.contacts.map(c => c.id === contact.id ? { ...c, phone: e.target.value } : c) })} 
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label-sub">Email</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={contact.email || ''} 
                        onChange={(e) => setContactForm({ ...contactForm, contacts: contactForm.contacts.map(c => c.id === contact.id ? { ...c, email: e.target.value } : c) })} 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #cbd5e1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={contact.active} 
                        onChange={(e) => setContactForm({ ...contactForm, contacts: contactForm.contacts.map(c => c.id === contact.id ? { ...c, active: e.target.checked } : c) })} 
                      /> 
                      Visible on Website
                    </label>
                    <button 
                      type="button" 
                      className="admin-icon-btn danger" 
                      onClick={() => setContactForm({ ...contactForm, contacts: contactForm.contacts.filter(c => c.id !== contact.id) })}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* =========================================================
          TAB 2: TIE-UPS & ALLIANCES
          ========================================================= */}
      {activeTab === 'collaborations' && (
        <div className="admin-settings-section-card">
          {/* Header */}
          <div className="settings-card-header-flex" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
            <div>
              <h3 className="settings-section-heading">
                <Handshake size={20} color="#2563eb" /> Company Alliances & Tie-Ups
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Manage strategic corporate tie-ups, manufacturing partners, and client mills featured on the website.
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ gap: '0.4rem', whiteSpace: 'nowrap' }}
              onClick={handleOpenAddCollab}
            >
              <Plus size={16} /> Add Strategic Tie-Up
            </button>
          </div>

          {/* Stat Pills & Search Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            
            {/* Counts */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Alliances:</span>
                <span style={{ background: '#e2e8f0', color: '#0f172a', fontWeight: 700, fontSize: '0.8rem', padding: '0.15rem 0.55rem', borderRadius: '12px' }}>
                  {collaborations.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Active on Website:</span>
                <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.8rem', padding: '0.15rem 0.55rem', borderRadius: '12px' }}>
                  {collaborations.filter((c) => c.active !== false).length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Hidden:</span>
                <span style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: '0.8rem', padding: '0.15rem 0.55rem', borderRadius: '12px' }}>
                  {collaborations.filter((c) => c.active === false).length}
                </span>
              </div>
            </div>

            {/* Quick Search */}
            <div style={{ position: 'relative', minWidth: '240px', maxWidth: '340px', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.85rem' }}
                placeholder="Search company or location..."
                value={collabSearch}
                onChange={(e) => setCollabSearch(e.target.value)}
              />
              {collabSearch && (
                <button
                  type="button"
                  onClick={() => setCollabSearch('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

          </div>

          {/* Table */}
          {filteredCollaborations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '1.25rem' }}>
              <Handshake size={44} color="#94a3b8" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
                {collabSearch ? 'No matching alliances found' : 'No corporate tie-ups registered yet'}
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                {collabSearch 
                  ? 'Try modifying your search query or clear the filter.' 
                  : 'Add client manufacturing mills, supply partners, or industrial consortiums.'}
              </p>
              {collabSearch ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCollabSearch('')}>
                  Clear Search
                </button>
              ) : (
                <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenAddCollab}>
                  <Plus size={15} /> Add First Corporate Alliance
                </button>
              )}
            </div>
          ) : (
            <div className="admin-table-wrapper" style={{ marginTop: '1.25rem' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '42%' }}>Enterprise & Brand Details</th>
                    <th style={{ width: '22%' }}>Operational Hub</th>
                    <th style={{ width: '16%' }}>Official Link</th>
                    <th style={{ width: '10%' }}>Visibility</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollaborations.map((collab) => (
                    <tr key={collab.id}>
                      {/* Enterprise Details */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div 
                            style={{ 
                              width: '52px', 
                              height: '52px', 
                              minWidth: '52px',
                              background: '#ffffff', 
                              borderRadius: '8px', 
                              border: '1px solid #e2e8f0', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              overflow: 'hidden',
                              padding: '4px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                          >
                            {collab.logoUrl ? (
                              <img 
                                src={collab.logoUrl} 
                                alt={`${collab.name} logo`} 
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                              />
                            ) : (
                              <Building2 size={24} color="#94a3b8" />
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <strong style={{ color: '#0f172a', fontSize: '0.98rem', lineHeight: 1.35, wordBreak: 'break-word' }}>
                              {collab.name}
                            </strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                {collab.type || 'Strategic Alliance'}
                              </span>
                              {collab.badgeText && (
                                <span style={{ fontSize: '0.72rem', background: '#f8fafc', color: '#475569', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: 500 }}>
                                  {collab.badgeText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Operational Hub */}
                      <td>
                        {collab.location ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569', fontSize: '0.88rem' }}>
                            <MapPin size={14} color="#64748b" style={{ flexShrink: 0 }} />
                            <span>{collab.location}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      {/* Website */}
                      <td>
                        {collab.websiteUrl ? (
                          <a 
                            href={collab.websiteUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              color: '#2563eb', 
                              fontSize: '0.85rem', 
                              fontWeight: 600,
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.25rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              textDecoration: 'none'
                            }}
                          >
                            <span>Visit Site</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      {/* Visibility Toggle */}
                      <td>
                        <button 
                          type="button" 
                          className={`status-toggle-btn ${collab.active !== false ? 'active' : 'inactive'}`} 
                          onClick={() => toggleCollaborationActive(collab.id)}
                          title={collab.active !== false ? 'Click to hide from website' : 'Click to show on website'}
                        >
                          {collab.active !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                          <span>{collab.active !== false ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button 
                            type="button" 
                            className="admin-icon-btn" 
                            onClick={() => handleOpenEditCollab(collab)}
                            title="Edit Alliance Details & Logo"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            type="button" 
                            className="admin-icon-btn danger" 
                            onClick={() => { if (window.confirm(`Permanently remove "${collab.name}" from alliances?`)) deleteCollaboration(collab.id); }}
                            title="Delete Alliance"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 3: ABOUT PAGE CONTENT & MILESTONES
          ========================================================= */}
      {activeTab === 'about' && (
        <form onSubmit={handleAboutSubmit} className="admin-settings-section-card">
          <div className="settings-card-header-flex">
            <div>
              <h3 className="settings-section-heading">
                <BookOpen size={18} color="#2563eb" /> About Page Content
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Configure the company story narrative, mission & vision statements, and historical journey milestones.
              </p>
            </div>
            {/* Top Save Button */}
            <button type="submit" className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Save size={16} /> Save About Content
            </button>
          </div>

          <div className="settings-form-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
            
            {/* ── 1. About Company Section (Directly under video) ── */}
            <div className="admin-panel-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Sparkles size={18} color="#2563eb" /> About {companySettings?.companyName || 'Raghav Texchems Chemical Private Limited'}
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#2563eb', background: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}>
                  Under Video Section
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                This narrative is showcased prominently on the About page right below the video player. Write full paragraphs; separate multiple paragraphs with a blank line.
              </p>
              <textarea 
                className="form-control" 
                rows={9} 
                style={{ fontSize: '0.92rem', lineHeight: 1.6, padding: '0.85rem' }}
                value={storyParagraphsText} 
                onChange={(e) => {
                  setStoryParagraphsText(e.target.value);
                  const paras = e.target.value.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
                  setAboutForm(prev => ({
                    ...prev,
                    storyParagraphs: paras,
                    storyMarkdown: e.target.value,
                  }));
                }} 
                placeholder="Founded with a bold vision to bridge cutting-edge polymer research with heavy industrial utility, Raghav Texchems Chemical Private Limited has grown into an international manufacturer of specialty dyestuffs, polymer emulsions, and surface coatings.&#10;&#10;Our manufacturing units operate with strict quality parameters, ensuring batch-to-batch consistency and high environmental compliance for domestic and global export markets."
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {storyParagraphsText.split(/\n\n+/).filter(Boolean).length} paragraph(s) formatted
                </span>
              </div>
            </div>

            {/* ── 2. Mission & Vision Directives ── */}
            <div className="admin-panel-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Target size={18} color="#2563eb" /> Our Mission & Vision
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Inputs for the dual directive cards featured on the About page.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                
                {/* Mission Card */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Target size={16} color="#2563eb" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Mission Container</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Mission Heading</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Our Mission"
                      value={aboutForm.missionTitle || ''} 
                      onChange={(e) => setAboutForm({ ...aboutForm, missionTitle: e.target.value })} 
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Mission Statement</label>
                    <textarea 
                      className="form-control" 
                      rows={4}
                      style={{ fontSize: '0.85rem', lineHeight: 1.5 }}
                      placeholder="To engineer sustainable, high-yield chemical formulations that empower global textile, paper, and polymer industries..."
                      value={aboutForm.missionText || ''} 
                      onChange={(e) => setAboutForm({ ...aboutForm, missionText: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Vision Card */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={16} color="#0284c7" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>Vision Container</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Vision Heading</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Our Vision"
                      value={aboutForm.visionTitle || ''} 
                      onChange={(e) => setAboutForm({ ...aboutForm, visionTitle: e.target.value })} 
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Vision Statement</label>
                    <textarea 
                      className="form-control" 
                      rows={4}
                      style={{ fontSize: '0.85rem', lineHeight: 1.5 }}
                      placeholder="To be the most trusted international partner in specialty chemical connectivity, recognized for technical excellence..."
                      value={aboutForm.visionText || ''} 
                      onChange={(e) => setAboutForm({ ...aboutForm, visionText: e.target.value })} 
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ── 3. Milestones Timeline Cards Section ── */}
            <div className="admin-panel-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Calendar size={18} color="#2563eb" /> Key Milestones & Company Journey ({(aboutForm.milestones || []).length})
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Cards with year, heading, and description displayed along the About page timeline.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenAddMilestone}
                  style={{ gap: '0.35rem', padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <Plus size={15} /> Add Milestone Card
                </button>
              </div>

              {/* Milestones Cards Grid */}
              {(!aboutForm.milestones || aboutForm.milestones.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
                  <Calendar size={36} color="#94a3b8" style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                    No milestones registered yet
                  </p>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={handleOpenAddMilestone}
                    style={{ gap: '0.3rem' }}
                  >
                    <Plus size={14} /> Add First Milestone
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {aboutForm.milestones.map((ms, index) => (
                    <div 
                      key={ms.id || index}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                    >
                      <div>
                        {/* Top bar with year badge & actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                          <span style={{ 
                            background: '#2563eb', 
                            color: '#ffffff', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '6px', 
                            fontWeight: 700, 
                            fontSize: '0.82rem',
                            letterSpacing: '0.5px'
                          }}>
                            {ms.year}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              type="button"
                              className="admin-icon-btn"
                              style={{ width: '26px', height: '26px', padding: 0 }}
                              disabled={index === 0}
                              onClick={() => handleMoveMilestone(index, 'up')}
                              title="Move Earlier in Timeline"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn"
                              style={{ width: '26px', height: '26px', padding: 0 }}
                              disabled={index === (aboutForm.milestones?.length || 0) - 1}
                              onClick={() => handleMoveMilestone(index, 'down')}
                              title="Move Later in Timeline"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn"
                              style={{ width: '26px', height: '26px', padding: 0 }}
                              onClick={() => handleOpenEditMilestone(ms)}
                              title="Edit Milestone"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-btn danger"
                              style={{ width: '26px', height: '26px', padding: 0 }}
                              onClick={() => handleDeleteMilestone(ms.id)}
                              title="Delete Milestone"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Title / Heading */}
                        <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                          {ms.title}
                        </h5>

                        {/* Description */}
                        <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                          {ms.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 4. Video Showcase & Hero Overview ── */}
            <div className="admin-panel-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Video size={18} color="#2563eb" /> Hero Video Showcase & Overview
                </h4>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Manage the video header and title at the very top of the About page.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Hero Main Headline</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Directorate Overview & Chemical Excellence"
                    value={aboutForm.storyTitle || ''} 
                    onChange={(e) => setAboutForm({ ...aboutForm, storyTitle: e.target.value })} 
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Video Format</label>
                  <select 
                    className="form-control"
                    value={aboutForm.videoType || 'youtube'}
                    onChange={(e) => setAboutForm({ ...aboutForm, videoType: e.target.value as 'youtube' | 'direct' })}
                  >
                    <option value="youtube">YouTube Embed (URL / Watch ID)</option>
                    <option value="direct">Direct MP4 Video Link</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Video Source URL</label>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder={aboutForm.videoType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/video.mp4'}
                  value={aboutForm.videoUrl || ''} 
                  onChange={(e) => setAboutForm({ ...aboutForm, videoUrl: e.target.value })} 
                />
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button type="submit" className="btn btn-primary" style={{ gap: '0.4rem', padding: '0.65rem 1.4rem' }}>
                <Save size={16} /> Save About Content
              </button>
            </div>

          </div>
        </form>
      )}

      {/* =========================================================
          ALLIANCE MODAL WITH UPLOAD, URL, AND IMAGE CROPPING
          ========================================================= */}
      {isCollabModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCollabModalOpen(false)}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '580px', 
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {editingCollab ? 'Edit Tie-Up' : 'Add Tie-Up'}
              </h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                style={{ position: 'static', width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setIsCollabModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCollab}>
              
              {/* 1. Company Name */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Company Name *
                </label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  placeholder="e.g. Apex Global Textiles Ltd."
                  value={collabForm.name} 
                  onChange={(e) => setCollabForm({ ...collabForm, name: e.target.value })} 
                />
              </div>

              {/* 2. Industry Type & City */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Industry Type *
                  </label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    placeholder="e.g. Textile Manufacturing"
                    value={collabForm.type} 
                    onChange={(e) => setCollabForm({ ...collabForm, type: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                    City
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Surat, Gujarat"
                    value={collabForm.location} 
                    onChange={(e) => setCollabForm({ ...collabForm, location: e.target.value })} 
                  />
                </div>
              </div>

              {/* 3. Badge Tag & Website Link */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Badge Tag (Optional)
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Strategic Alliance"
                    value={collabForm.badgeText || ''} 
                    onChange={(e) => setCollabForm({ ...collabForm, badgeText: e.target.value })} 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Website URL (Optional)
                  </label>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="https://example.com" 
                    value={collabForm.websiteUrl} 
                    onChange={(e) => setCollabForm({ ...collabForm, websiteUrl: e.target.value })} 
                  />
                </div>
              </div>

              {/* 4. Company Logo - 2 Source Options + Crop & Adjust */}
              <div className="form-group" style={{ marginBottom: '1.25rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
                    Company Logo
                  </label>
                  
                  {/* Two Source Selection Buttons */}
                  <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setLogoSourceMode('upload')}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 0,
                        borderRadius: '5px',
                        background: logoSourceMode === 'upload' ? '#ffffff' : 'transparent',
                        color: logoSourceMode === 'upload' ? '#2563eb' : '#64748b',
                        boxShadow: logoSourceMode === 'upload' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Upload size={12} /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoSourceMode('url')}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 0,
                        borderRadius: '5px',
                        background: logoSourceMode === 'url' ? '#ffffff' : 'transparent',
                        color: logoSourceMode === 'url' ? '#2563eb' : '#64748b',
                        boxShadow: logoSourceMode === 'url' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <LinkIcon size={12} /> Image URL
                    </button>
                  </div>
                </div>

                {/* Option 1: File Upload */}
                {logoSourceMode === 'upload' ? (
                  <div>
                    <input 
                      ref={logoFileInputRef}
                      type="file" 
                      accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                      style={{ display: 'none' }}
                      onChange={handleLogoFileSelect} 
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => logoFileInputRef.current?.click()}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') logoFileInputRef.current?.click(); }}
                      style={{
                        padding: '1.25rem',
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: '8px',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.background = '#f0f7ff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      <ImagePlus size={24} color="#2563eb" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                        {collabForm.logoUrl ? 'Choose different file' : 'Click to select logo'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        PNG, JPG, WEBP, SVG • Interactive cropper opens automatically
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input 
                      type="url" 
                      className="form-control" 
                      placeholder="https://example.com/logo.png" 
                      value={collabForm.logoUrl} 
                      onChange={(e) => setCollabForm({ ...collabForm, logoUrl: e.target.value })} 
                    />
                  </div>
                )}

                {/* Logo Preview & Crop Trigger Card */}
                {collabForm.logoUrl && (
                  <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '48px', height: '48px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '4px' }}>
                        <img 
                          src={collabForm.logoUrl} 
                          alt="Logo preview" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                        Logo Ready
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '0.35rem', fontSize: '0.78rem', padding: '0.35rem 0.65rem', fontWeight: 600 }}
                        onClick={() => {
                          setCropImageSrc(collabForm.logoUrl || '');
                          setIsCropperOpen(true);
                        }}
                      >
                        <Crop size={13} color="#2563eb" />
                        <span>Crop & Adjust</span>
                      </button>

                      <button
                        type="button"
                        className="admin-icon-btn danger"
                        style={{ width: '30px', height: '30px' }}
                        onClick={() => setCollabForm({ ...collabForm, logoUrl: '', logoPath: '' })}
                        title="Remove Logo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {logoNotice && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                    <Sparkles size={13} /> {logoNotice}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsCollabModalOpen(false)}
                  disabled={isUploadingLogo}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isUploadingLogo}
                  style={{ gap: '0.4rem' }}
                >
                  <Save size={15} /> {isUploadingLogo ? 'Processing...' : editingCollab ? 'Save Changes' : 'Add Tie-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MILESTONE MODAL (YEAR, HEADING, DESCRIPTION)
          ========================================================= */}
      {isMilestoneModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMilestoneModalOpen(false)}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '480px', 
              padding: '1.75rem',
              borderRadius: '16px',
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={18} color="#2563eb" /> {editingMilestone ? 'Edit Milestone Card' : 'Add Milestone Card'}
              </h3>
              <button 
                type="button" 
                className="modal-close-btn" 
                style={{ position: 'static', width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setIsMilestoneModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone}>
              {/* Year */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Year *
                </label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  placeholder="e.g. 2015, 2019, 2024"
                  value={milestoneForm.year} 
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, year: e.target.value })} 
                />
              </div>

              {/* Title / Heading */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Heading / Title *
                </label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  placeholder="e.g. Automated Polymer Facility"
                  value={milestoneForm.title} 
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} 
                />
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Small Description *
                </label>
                <textarea 
                  required 
                  rows={4}
                  className="form-control" 
                  placeholder="e.g. Commissioned automated polymerization reactors for textile binders and paper sizing."
                  value={milestoneForm.description} 
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} 
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsMilestoneModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ gap: '0.4rem' }}
                >
                  <Save size={15} /> {editingMilestone ? 'Save Changes' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          INTERACTIVE IMAGE CROPPER MODAL
          ========================================================= */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={cropImageSrc}
        title="Crop & Adjust Partner Logo"
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />

    </div>
  );
};
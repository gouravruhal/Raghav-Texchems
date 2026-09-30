import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import type { Inquiry } from '../../types';
import { sanitizeSearchQuery } from '../../lib/validation';
import {
  Trash2,
  Search,
  Download,
  RotateCcw,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  ArrowLeft,
  User,
  Building2,
  Phone,
  Calendar,
  Layers,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  ArrowDownUp
} from 'lucide-react';

const ITEMS_PER_PAGE = 25;

export const AdminInquiriesPage: React.FC = () => {
  const { inquiries = [], updateInquiryStatus, deleteInquiry } = useData();
  const { id: urlInquiryId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const isSubdomain =
    typeof window !== 'undefined' &&
    (window.location.hostname.startsWith('admin.') ||
      window.location.hostname === 'admin.localhost');
  const basePath = isSubdomain ? '' : '/admin';

  // Active view: 'list' (Page 1: Inquiries List & Filters) or 'detail' (Page 2: Read-only Inquiry Dossier)
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  // Filters for Page 1
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest'); // Default: Time Latest First
  const [currentPage, setCurrentPage] = useState<number>(1);

  // UI state for copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper: check if inquiry is unread
  const isUnread = (inq: Inquiry | null | undefined): boolean => {
    if (!inq) return false;
    return inq.status === 'New' || inq.status === 'Unread';
  };

  // Toggle read/unread status
  const toggleReadStatus = (inq: Inquiry) => {
    const nextStatus: Inquiry['status'] = isUnread(inq) ? 'Read' : 'Unread';
    updateInquiryStatus(inq.id, nextStatus);
  };

  // Synchronize route URL parameter with selected inquiry
  useEffect(() => {
    if (urlInquiryId) {
      const match = inquiries.find((i) => i.id === urlInquiryId);
      if (match) {
        setSelectedInquiryId(match.id);
        setActiveView('detail');
      }
    }
  }, [urlInquiryId, inquiries]);

  // Selected inquiry object for Page 2
  const selectedInquiry = useMemo(() => {
    if (!selectedInquiryId) {
      return inquiries[0] || null;
    }
    return inquiries.find((i) => i.id === selectedInquiryId) || inquiries[0] || null;
  }, [selectedInquiryId, inquiries]);

  // Extract unique categories from inquiries for filtering
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach((i) => {
      if (i.productCategory) set.add(i.productCategory);
    });
    return Array.from(set);
  }, [inquiries]);

  // Helper to extract timestamp for chronologic sorting
  const getTimeValue = (inq: Inquiry): number => {
    if (inq.createdAt) {
      const t = new Date(inq.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (inq.date) {
      const t = new Date(inq.date).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    const idMatch = inq.id?.match(/inq-(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
    if (idMatch) {
      const year = parseInt(idMatch[1], 10);
      const month = parseInt(idMatch[2], 10) - 1;
      const day = parseInt(idMatch[3], 10);
      const hour = idMatch[4] ? parseInt(idMatch[4], 10) : 0;
      const min = idMatch[5] ? parseInt(idMatch[5], 10) : 0;
      const sec = idMatch[6] ? parseInt(idMatch[6], 10) : 0;
      return new Date(Date.UTC(year, month, day, hour, min, sec)).getTime();
    }
    return 0;
  };

  // Status counts for simplified Read / Unread metrics
  const unreadCount = useMemo(() => inquiries.filter(isUnread).length, [inquiries]);
  const readCount = useMemo(() => inquiries.filter((i) => !isUnread(i)).length, [inquiries]);

  // Reset pagination to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterCategory, sortOrder]);

  // Filtered and chronologically sorted inquiries (Default: Time Latest)
  const sortedAndFilteredInquiries = useMemo(() => {
    const query = sanitizeSearchQuery(searchQuery).toLowerCase();

    const filtered = inquiries.filter((inq) => {
      const unread = isUnread(inq);
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'unread' && unread) ||
        (filterStatus === 'read' && !unread);

      const matchesCategory =
        filterCategory === 'All' || inq.productCategory === filterCategory;

      const matchesQuery =
        !query ||
        inq.customerName?.toLowerCase().includes(query) ||
        (inq.companyName && inq.companyName.toLowerCase().includes(query)) ||
        inq.phone?.toLowerCase().includes(query) ||
        inq.email?.toLowerCase().includes(query) ||
        inq.productCategory?.toLowerCase().includes(query) ||
        inq.message?.toLowerCase().includes(query) ||
        inq.id?.toLowerCase().includes(query);

      return matchesStatus && matchesCategory && matchesQuery;
    });

    // Default: Time Latest First
    return filtered.sort((a, b) => {
      const timeA = getTimeValue(a);
      const timeB = getTimeValue(b);
      return sortOrder === 'latest' ? timeB - timeA : timeA - timeB;
    });
  }, [inquiries, searchQuery, filterStatus, filterCategory, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredInquiries.length / ITEMS_PER_PAGE));

  // Protect against page overflow after deletions or filter changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginate 25 inquiries per page
  const paginatedInquiries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredInquiries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredInquiries, currentPage]);

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
      const panel = document.getElementById('inquiries-table-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterCategory('All');
    setSortOrder('latest');
    setCurrentPage(1);
  };

  // Actions
  const handleOpenDetail = (inq: Inquiry) => {
    setSelectedInquiryId(inq.id);
    setActiveView('detail');
    navigate(`${basePath}/inquiries/${inq.id}`, { replace: true });
  };

  const handleBackToList = () => {
    setActiveView('list');
    navigate(`${basePath}/inquiries`, { replace: true });
  };

  const handlePrevInquiry = () => {
    if (!selectedInquiry) return;
    const currentIndex = sortedAndFilteredInquiries.findIndex((i) => i.id === selectedInquiry.id);
    if (currentIndex > 0) {
      const prev = sortedAndFilteredInquiries[currentIndex - 1];
      setSelectedInquiryId(prev.id);
      navigate(`${basePath}/inquiries/${prev.id}`, { replace: true });
    }
  };

  const handleNextInquiry = () => {
    if (!selectedInquiry) return;
    const currentIndex = sortedAndFilteredInquiries.findIndex((i) => i.id === selectedInquiry.id);
    if (currentIndex >= 0 && currentIndex < sortedAndFilteredInquiries.length - 1) {
      const next = sortedAndFilteredInquiries[currentIndex + 1];
      setSelectedInquiryId(next.id);
      navigate(`${basePath}/inquiries/${next.id}`, { replace: true });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete inquiry ${id} from "${name}"?`)) {
      deleteInquiry(id);
      if (selectedInquiryId === id) {
        handleBackToList();
      }
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (inquiries.length === 0) {
      alert('No customer inquiries to export.');
      return;
    }

    const headers = [
      'Inquiry ID',
      'Date',
      'Customer Name',
      'Company Name',
      'Phone',
      'Email',
      'Product Category',
      'Message / RFQ Details',
      'Status'
    ];

    const sanitizeCsvCell = (val: string | undefined | null): string => {
      if (!val) return '""';
      const clean = String(val).replace(/"/g, '""');
      return /^[=+\-@\t\r]/.test(clean) ? `"'${clean}"` : `"${clean}"`;
    };

    const rows = sortedAndFilteredInquiries.map((i) => [
      sanitizeCsvCell(i.id),
      sanitizeCsvCell(i.date),
      sanitizeCsvCell(i.customerName),
      sanitizeCsvCell(i.companyName),
      sanitizeCsvCell(i.phone),
      sanitizeCsvCell(i.email),
      sanitizeCsvCell(i.productCategory),
      sanitizeCsvCell(i.message),
      isUnread(i) ? '"Unread"' : '"Read"'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `raghav_texchems_inquiries_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentIdx = selectedInquiry
    ? sortedAndFilteredInquiries.findIndex((i) => i.id === selectedInquiry.id)
    : -1;

  return (
    <div className="admin-page-container">
      {/* =========================================================
          PAGE HEADER & VIEW NAVIGATION TABS
          ========================================================= */}
      <div className="admin-page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="admin-header-title-block">
          <h1 className="admin-page-title">Customer Inquiries</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Two-page View Switcher Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              borderRadius: '10px',
              padding: '0.25rem',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={handleBackToList}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: activeView === 'list' ? '#ffffff' : 'transparent',
                color: activeView === 'list' ? '#1d4ed8' : '#64748b',
                fontWeight: activeView === 'list' ? 700 : 500,
                boxShadow: activeView === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Filter size={15} />
              <span>1. Inquiries List ({inquiries.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedInquiry) {
                  setActiveView('detail');
                  navigate(`${basePath}/inquiries/${selectedInquiry.id}`, { replace: true });
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: activeView === 'detail' ? '#ffffff' : 'transparent',
                color: activeView === 'detail' ? '#1d4ed8' : '#64748b',
                fontWeight: activeView === 'detail' ? 700 : 500,
                boxShadow: activeView === 'detail' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Eye size={15} />
              <span>
                2. Inquiry Dossier {selectedInquiry ? `(${selectedInquiry.customerName})` : ''}
              </span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Export all inquiries to CSV"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', gap: '0.35rem' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          PAGE 1: INQUIRIES LIST & FILTERS
          ========================================================= */}
      {activeView === 'list' && (
        <div className="inquiries-list-page animate-fade-in">
          {/* Responsive Stat Cards matching Dashboard design */}
          <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="admin-stat-card">
              <div className="stat-icon-wrap" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                <MessageSquare size={20} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Total Inquiries</div>
                <div className="stat-number">{inquiries.length}</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <Mail size={20} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Unread Inquiries</div>
                <div className="stat-number" style={{ color: '#dc2626' }}>{unreadCount}</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrap" style={{ background: '#ecfdf5', color: '#047857' }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Read / Reviewed</div>
                <div className="stat-number" style={{ color: '#047857' }}>{readCount}</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrap" style={{ background: '#f8fafc', color: '#64748b' }}>
                <Clock size={20} />
              </div>
              <div className="stat-card-content">
                <div className="stat-label">Default Order</div>
                <div className="stat-number" style={{ fontSize: 'clamp(1rem, 1.2vw, 1.35rem)', color: '#0f172a' }}>
                  {sortOrder === 'latest' ? 'Time Latest' : 'Time Oldest'}
                </div>
              </div>
            </div>
          </div>

          {/* Search, Status & Category Filter Bar */}
          <div className="admin-panel-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              {/* Search Box */}
              <div className="search-box-wrapper" style={{ margin: 0, flex: '1 1 240px', maxWidth: '380px' }}>
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search customer, company, phone, brief..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status and Category Filter Controls */}
              <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Category Dropdown */}
                {availableCategories.length > 0 && (
                  <select
                    className="form-control"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', width: 'auto', minWidth: '150px' }}
                  >
                    <option value="All">All Categories ({availableCategories.length})</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}

                {/* Read / Unread Status Chips */}
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    type="button"
                    className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('all')}
                  >
                    All ({inquiries.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${filterStatus === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('unread')}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${filterStatus === 'read' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('read')}
                  >
                    Read ({readCount})
                  </button>
                </div>

                {/* Time Sorting Toggle Button (Default: Time Latest) */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSortOrder((prev) => (prev === 'latest' ? 'oldest' : 'latest'))}
                  title="Toggle Chronological Sorting"
                  style={{ gap: '0.35rem', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <ArrowDownUp size={13} />
                  <span>{sortOrder === 'latest' ? 'Time: Latest' : 'Time: Oldest'}</span>
                </button>

                {(searchQuery || filterStatus !== 'all' || filterCategory !== 'All' || sortOrder !== 'latest') && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleResetFilters}
                    style={{ gap: '0.3rem', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    title="Reset all filters"
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Inquiries Table Card (Responsive, Self-adjusting, Zero Horizontal Scroll) */}
          <div id="inquiries-table-panel" className="admin-panel-card">
            <div className="panel-card-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="panel-card-title">Customer Inquiries Register</h3>
                <p className="panel-card-subtitle" style={{ marginTop: '0.15rem' }}>
                  {sortedAndFilteredInquiries.length > 0 ? (
                    <>
                      Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–<strong>{Math.min(currentPage * ITEMS_PER_PAGE, sortedAndFilteredInquiries.length)}</strong> of <strong>{sortedAndFilteredInquiries.length}</strong> inquiries
                      {totalPages > 1 && (
                        <span style={{ color: '#64748b', fontWeight: 500 }}> (Page {currentPage} of {totalPages})</span>
                      )}
                    </>
                  ) : (
                    '0 inquiries found'
                  )}
                </p>
              </div>

              {sortedAndFilteredInquiries.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="admin-pagination-pill">25 per page</span>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
                    Default: Latest First
                  </span>
                </div>
              )}
            </div>

            {sortedAndFilteredInquiries.length === 0 ? (
              <div className="admin-empty-table" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                <MessageSquare size={44} style={{ opacity: 0.35, marginBottom: '0.75rem', color: '#64748b' }} />
                <h4 style={{ margin: '0 0 0.35rem', color: '#0f172a', fontWeight: 700, fontSize: '1rem' }}>No inquiries match your filters</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', maxWidth: '380px' }}>
                  Try clearing your search query or switching between Read and Unread tabs.
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
                        <th style={{ width: '27%' }}>Client & Enterprise</th>
                        <th style={{ width: '37%' }}>Category & Requirement</th>
                        <th style={{ width: '14%' }}>Received Date</th>
                        <th style={{ width: '10%' }}>Status</th>
                        <th style={{ width: '12%', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInquiries.map((inq) => {
                        const unread = isUnread(inq);
                        return (
                          <tr
                            key={inq.id}
                            style={{
                              cursor: 'pointer',
                              background: selectedInquiryId === inq.id ? '#f0f7ff' : unread ? '#fcfdff' : undefined,
                            }}
                            onClick={() => handleOpenDetail(inq)}
                          >
                            {/* Client & Enterprise */}
                            <td>
                              <div className="product-info-column">
                                <strong className="product-cell-name" title={inq.customerName}>
                                  {inq.customerName}
                                </strong>
                                <span className="product-cell-sub" title={inq.companyName || inq.phone}>
                                  {inq.companyName ? inq.companyName : inq.phone}
                                </span>
                              </div>
                            </td>

                            {/* Category & Requirement Brief */}
                            <td>
                              <div className="product-info-column">
                                <div>
                                  <span className="product-category-tag" title={inq.productCategory}>
                                    {inq.productCategory}
                                  </span>
                                </div>
                                <span
                                  className="product-cell-sub"
                                  title={inq.message}
                                  style={{ marginTop: '0.2rem' }}
                                >
                                  "{inq.message}"
                                </span>
                              </div>
                            </td>

                            {/* Received Date & ID */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span style={{ fontSize: 'clamp(0.78rem, 0.82vw, 0.86rem)', fontWeight: 600, color: '#334155' }}>
                                  {inq.date}
                                </span>
                                <span className="sku-badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }} title={inq.id}>
                                  {inq.id}
                                </span>
                              </div>
                            </td>

                            {/* Status: Read / Unread interactive toggle */}
                            <td onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className={`status-toggle-btn ${unread ? 'unread' : 'read'}`}
                                onClick={() => toggleReadStatus(inq)}
                                title={unread ? 'Click to mark as Read' : 'Click to mark as Unread'}
                              >
                                {unread ? (
                                  <>
                                    <span className="status-indicator-dot unread" />
                                    <span>Unread</span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={12} />
                                    <span>Read</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Actions: View Dossier & Delete */}
                            <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenDetail(inq)}
                                  style={{ padding: '0.2rem 0.5rem', fontSize: 'clamp(0.72rem, 0.75vw, 0.78rem)' }}
                                  title="View Inquiry Dossier"
                                >
                                  <Eye size={12} /> View
                                </button>
                                <button
                                  type="button"
                                  className="admin-icon-btn danger"
                                  onClick={() => handleDelete(inq.id, inq.customerName)}
                                  title={`Delete inquiry ${inq.id}`}
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

                {/* Paging Footer Bar */}
                <div className="admin-pagination-bar">
                  <div className="admin-pagination-info">
                    <span>
                      Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong>{Math.min(currentPage * ITEMS_PER_PAGE, sortedAndFilteredInquiries.length)}</strong> of <strong>{sortedAndFilteredInquiries.length}</strong> inquiries
                    </span>
                    <span className="admin-pagination-pill">25 per page</span>
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
        </div>
      )}

      {/* =========================================================
          PAGE 2: INQUIRY DOSSIER & DETAIL VIEW (READ-ONLY)
          ========================================================= */}
      {activeView === 'detail' && (
        <div className="inquiry-detail-page animate-fade-in">
          {/* Top Navigation & Action Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBackToList}
              style={{ gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} /> Back to Inquiries List
            </button>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Inquiry {currentIdx >= 0 ? currentIdx + 1 : 1} of {sortedAndFilteredInquiries.length}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={currentIdx <= 0}
                onClick={handlePrevInquiry}
                title="Previous Inquiry"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={currentIdx >= sortedAndFilteredInquiries.length - 1}
                onClick={handleNextInquiry}
                title="Next Inquiry"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {!selectedInquiry ? (
            <div className="admin-panel-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3>No inquiry selected</h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Select an inquiry from the list to view its complete specifications.</p>
              <button type="button" className="btn btn-primary" onClick={handleBackToList}>
                Go to Inquiries List
              </button>
            </div>
          ) : (
            <div className="admin-form-two-col">
              {/* Left Column: Full Chemical Requirement Dossier */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="admin-panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        REF: {selectedInquiry.id}
                      </span>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0.2rem 0' }}>
                        {selectedInquiry.customerName}
                      </h2>
                      {selectedInquiry.companyName && (
                        <div style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Building2 size={16} color="#64748b" />
                          <span>{selectedInquiry.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className={`status-toggle-btn ${isUnread(selectedInquiry) ? 'unread' : 'read'}`}
                        onClick={() => toggleReadStatus(selectedInquiry)}
                        title="Click to toggle Read/Unread"
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.84rem' }}
                      >
                        {isUnread(selectedInquiry) ? (
                          <>
                            <span className="status-indicator-dot unread" />
                            <span>Unread</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Read</span>
                          </>
                        )}
                      </button>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        <Calendar size={13} /> {selectedInquiry.date}
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', height: '1px', background: '#e2e8f0', margin: '1.25rem 0' }} />

                  {/* Chemical Category */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                      PRODUCT CATEGORY / CHEMICAL CLASSIFICATION
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.4rem 0.85rem', borderRadius: '8px', color: '#15803d', fontWeight: 700, fontSize: '0.9rem' }}>
                      <Layers size={16} />
                      <span>{selectedInquiry.productCategory}</span>
                    </div>
                  </div>

                  {/* Verbatim Message Requirement */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        TECHNICAL SPECIFICATIONS & CLIENT REQUIREMENTS
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(selectedInquiry.message, selectedInquiry.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedId === selectedInquiry.id ? '#16a34a' : '#2563eb',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontWeight: 600,
                        }}
                      >
                        {copiedId === selectedInquiry.id ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy Brief</>}
                      </button>
                    </div>

                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1.25rem 1.5rem',
                        fontSize: '0.95rem',
                        lineHeight: 1.7,
                        color: '#1e293b',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                      }}
                    >
                      {selectedInquiry.message}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact Dossier & Read Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Contact Card */}
                <div className="admin-panel-card">
                  <h3 className="panel-card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={18} color="#2563eb" />
                    <span>Client Details</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>FULL NAME</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        {selectedInquiry.customerName}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>PHONE / CONTACT NUMBER</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={14} color="#2563eb" />
                        <a href={`tel:${selectedInquiry.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          +91 {selectedInquiry.phone}
                        </a>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>OFFICIAL EMAIL</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1d4ed8', wordBreak: 'break-all' }}>
                        <a href={`mailto:${selectedInquiry.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {selectedInquiry.email}
                        </a>
                      </div>
                    </div>

                    {selectedInquiry.companyName && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>REGISTERED ENTERPRISE</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                          {selectedInquiry.companyName}
                        </div>
                      </div>
                    )}
                  </div>

                  <hr style={{ border: 'none', height: '1px', background: '#e2e8f0', margin: '1.25rem 0' }} />

                  {/* Mark as Read / Unread Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className={isUnread(selectedInquiry) ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => toggleReadStatus(selectedInquiry)}
                      style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', gap: '0.5rem', fontWeight: 700 }}
                    >
                      {isUnread(selectedInquiry) ? (
                        <>
                          <Check size={16} /> Mark as Read
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} /> Mark as Unread
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', color: '#dc2626', borderColor: '#fecaca', padding: '0.65rem', gap: '0.5rem' }}
                      onClick={() => handleDelete(selectedInquiry.id, selectedInquiry.customerName)}
                    >
                      <Trash2 size={15} /> Delete Inquiry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

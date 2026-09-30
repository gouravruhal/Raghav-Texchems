import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Product,
  Category,
  Inquiry,
  CompanySettings,
  StatItem,
  Collaboration,
  AboutContent,
} from '../types';
import { supabase } from '../lib/supabase';
import { logAdminAction } from '../lib/audit';
import { INITIAL_COMPANY_SETTINGS, INITIAL_ABOUT_CONTENT, CATEGORIES } from '../data/initialData';

interface DataContextType {
  products: Product[];
  categories: Category[];
  inquiries: Inquiry[];
  companySettings: CompanySettings;
  stats: StatItem[];
  collaborations: Collaboration[];
  aboutContent: AboutContent;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  toggleProductActive: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addCategory: (name: string) => Promise<{ success: boolean; error?: string; category?: Category }>;
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; deletedProductsCount: number; error?: string }>;
  
  addInquiry: (inquiry: Omit<Inquiry, 'id' | 'date' | 'status'>) => Promise<{ success: boolean; error?: string }>;
  updateInquiryStatus: (id: string, status: Inquiry['status']) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;
  updateStat: (id: string, updated: Partial<StatItem>) => Promise<void>;
  addStat: () => Promise<void>;
  deleteStat: (id: string) => Promise<void>;
  setAllStats: (newStats: StatItem[]) => Promise<void>;
  
  addCollaboration: (collab: Omit<Collaboration, 'id'>) => Promise<void>;
  updateCollaboration: (collab: Collaboration) => Promise<void>;
  deleteCollaboration: (id: string) => Promise<void>;
  toggleCollaborationActive: (id: string) => Promise<void>;
  
  updateAboutContent: (content: AboutContent) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CACHE_KEY = 'raghav_texchems_ui_cache_v2';

const getCache = () => {
  try {
    localStorage.removeItem('raghav_texchems_ui_cache');
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn('Cache read error', e);
  }
  return null;
};

const EMPTY_COMPANY_SETTINGS: CompanySettings = {
  ...INITIAL_COMPANY_SETTINGS,
};

const EMPTY_ABOUT_CONTENT: AboutContent = {
  ...INITIAL_ABOUT_CONTENT,
};

function mapDbToProduct(row: any): Product {
  return {
    id: row.id, name: row.name, code: row.code, category: row.category, description: row.description,
    imageUrl: row.image_url || '', imagePath: row.image_path || '', appearance: row.appearance || '',
    ph: row.ph || '', activeContent: row.active_content || '', viscosity: row.viscosity || '',
    ionicNature: row.ionic_nature || 'Non-Ionic', solubility: row.solubility || 'Easily soluble in cold water',
    shelfLife: row.shelf_life || '12 Months in original sealed container', packaging: Array.isArray(row.packaging) ? row.packaging : [],
    tdsUrl: row.tds_url || '', sdsUrl: row.sds_url || '',
    applications: Array.isArray(row.applications) ? row.applications : [], featured: Boolean(row.featured),
    active: row.active !== false, stockStatus: row.stock_status || 'In Stock',
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
  };
}

function mapProductToDb(p: Partial<Product>) {
  return {
    id: p.id, name: p.name, code: p.code, category: p.category, description: p.description,
    image_url: p.imageUrl, image_path: p.imagePath, appearance: p.appearance || '', ph: p.ph || '',
    active_content: p.activeContent || '', viscosity: p.viscosity || '',
    ionic_nature: p.ionicNature || 'Non-Ionic', solubility: p.solubility || 'Easily soluble in cold water',
    shelf_life: p.shelfLife || '12 Months in original sealed container', packaging: p.packaging || [],
    tds_url: p.tdsUrl || null, sds_url: p.sdsUrl || null,
    applications: p.applications || [], featured: p.featured ?? false, active: p.active ?? true,
    stock_status: p.stockStatus || 'In Stock', updated_at: new Date().toISOString(),
  };
}

function mapDbToInquiry(row: any): Inquiry {
  return {
    id: row.id, customerName: row.customer_name, phone: row.phone, email: row.email,
    companyName: row.company_name || '', productCategory: row.product_category, message: row.message,
    status: row.status || 'New', 
    date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    createdAt: row.created_at || '',
    assignedTo: row.assigned_to || '',
  };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialCache = getCache();

  // Initialize with cached data to prevent flickering
  const [products, setProducts] = useState<Product[]>(initialCache?.products || []);
  const [categories, setCategories] = useState<Category[]>(initialCache?.categories || []);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]); // Never cache sensitive inquiries
  const [companySettings, setCompanySettings] = useState<CompanySettings>(initialCache?.companySettings || EMPTY_COMPANY_SETTINGS);
  const [stats, setStats] = useState<StatItem[]>(initialCache?.stats || []);
  const [collaborations, setCollaborations] = useState<Collaboration[]>(initialCache?.collaborations || []);
  const [aboutContent, setAboutContent] = useState<AboutContent>(initialCache?.aboutContent || EMPTY_ABOUT_CONTENT);
  
  // If we have cached settings, we don't need to block the UI with a loading state
  const [loading, setLoading] = useState(!initialCache?.companySettings?.companyName);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const newCache: any = getCache() || {};

      const { data: catData, error: catErr } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (!catErr && catData && catData.length > 0) {
        const parsedCats = catData.map((c: any) => ({
          id: c.id, name: c.name, code: c.code, active: c.active !== false, sortOrder: c.sort_order || 0
        }));
        setCategories(parsedCats);
        newCache.categories = parsedCats;
      } else if (!newCache.categories || newCache.categories.length === 0) {
        const defaultCats = CATEGORIES.filter((c) => c !== 'All Products').map((name, i) => ({
          id: `cat-${i + 1}`,
          name,
          code: name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
          active: true,
          sortOrder: i + 1,
        }));
        setCategories(defaultCats);
        newCache.categories = defaultCats;
      }

      const { data: productsData, error: prodErr } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!prodErr && productsData) {
        const p = productsData.map(mapDbToProduct);
        setProducts(p);
        newCache.products = p;
      }

      const { data: inqData, error: inqErr } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
      if (!inqErr && inqData) setInquiries(inqData.map(mapDbToInquiry));

      const { data: settingsData, error: setErr } = await supabase.from('company_settings').select('*').eq('id', 'primary').maybeSingle();
      if (!setErr && settingsData) {
        const s: CompanySettings = {
          ...INITIAL_COMPANY_SETTINGS,
          companyName: settingsData.company_name || INITIAL_COMPANY_SETTINGS.companyName, 
          shortName: settingsData.short_name || INITIAL_COMPANY_SETTINGS.shortName,
          tagline: settingsData.tagline || INITIAL_COMPANY_SETTINGS.tagline,
          subTagline: settingsData.sub_tagline || INITIAL_COMPANY_SETTINGS.subTagline,
          heroHeadline: settingsData.hero_headline || INITIAL_COMPANY_SETTINGS.heroHeadline,
          heroHighlightText: settingsData.hero_highlight_text || INITIAL_COMPANY_SETTINGS.heroHighlightText,
          heroDescription: settingsData.hero_description || INITIAL_COMPANY_SETTINGS.heroDescription,
          heroPrimaryCtaText: settingsData.hero_primary_cta_text || INITIAL_COMPANY_SETTINGS.heroPrimaryCtaText,
          heroPrimaryCtaLink: settingsData.hero_primary_cta_link || INITIAL_COMPANY_SETTINGS.heroPrimaryCtaLink,
          heroSecondaryCtaText: settingsData.hero_secondary_cta_text || INITIAL_COMPANY_SETTINGS.heroSecondaryCtaText,
          heroSecondaryCtaLink: settingsData.hero_secondary_cta_link || INITIAL_COMPANY_SETTINGS.heroSecondaryCtaLink,
          heroActive: settingsData.hero_active ?? INITIAL_COMPANY_SETTINGS.heroActive,
          contact1Name: settingsData.contact1_name || INITIAL_COMPANY_SETTINGS.contact1Name, 
          contact1Phone: settingsData.contact1_phone || INITIAL_COMPANY_SETTINGS.contact1Phone,
          contact2Name: settingsData.contact2_name || INITIAL_COMPANY_SETTINGS.contact2Name, 
          contact2Phone: settingsData.contact2_phone || INITIAL_COMPANY_SETTINGS.contact2Phone,
          email: settingsData.email || INITIAL_COMPANY_SETTINGS.email, 
          address: settingsData.address || INITIAL_COMPANY_SETTINGS.address, 
          contacts: Array.isArray(settingsData.contacts) && settingsData.contacts.length > 0 ? settingsData.contacts : INITIAL_COMPANY_SETTINGS.contacts,
          logoUrl: settingsData.logo_url || INITIAL_COMPANY_SETTINGS.logoUrl,
          logoPath: settingsData.logo_path || INITIAL_COMPANY_SETTINGS.logoPath,
          logoIconUrl: settingsData.logo_icon_url || INITIAL_COMPANY_SETTINGS.logoIconUrl,
          logoIconPath: settingsData.logo_icon_path || INITIAL_COMPANY_SETTINGS.logoIconPath,
          faviconUrl: settingsData.favicon_url || INITIAL_COMPANY_SETTINGS.faviconUrl,
          cin: settingsData.cin || INITIAL_COMPANY_SETTINGS.cin,
          gstin: settingsData.gstin || INITIAL_COMPANY_SETTINGS.gstin,
        };
        setCompanySettings(s);
        newCache.companySettings = s;
      }

      const { data: statsData, error: statsErr } = await supabase.from('stats').select('*').order('sort_order', { ascending: true });
      if (!statsErr && statsData) {
        const st = statsData.map((s: any) => ({
          id: s.id, value: s.value, prefix: s.prefix || '', suffix: s.suffix || '', label: s.label,
          description: s.description || '', iconType: s.icon_type, category: s.category || 'general',
          sortOrder: s.sort_order ?? 0, active: s.active !== false,
        }));
        setStats(st);
        newCache.stats = st;
      } else {
        setStats([]);
        newCache.stats = [];
      }

      const { data: collabData, error: collabErr } = await supabase.from('collaborations').select('*').order('sort_order', { ascending: true });
      if (!collabErr && collabData) {
        const c = collabData.map((col: any) => ({
          id: col.id, name: col.name, type: col.type, partnershipTier: col.partnership_tier || 'Strategic Alliance',
          location: col.location, logoUrl: col.logo_url || '', logoPath: col.logo_path || '', badgeText: col.badge_text || '',
          websiteUrl: col.website_url || '', description: col.description || '', active: col.active !== false, sortOrder: col.sort_order ?? 0,
        }));
        setCollaborations(c);
        newCache.collaborations = c;
      } else {
        setCollaborations([]);
        newCache.collaborations = [];
      }

      const { data: aboutData, error: aboutErr } = await supabase.from('about_content').select('*').eq('id', 'primary').maybeSingle();
      if (!aboutErr && aboutData) {
        const a: AboutContent = {
          ...INITIAL_ABOUT_CONTENT,
          videoUrl: aboutData.video_url || INITIAL_ABOUT_CONTENT.videoUrl,
          videoType: aboutData.video_type || INITIAL_ABOUT_CONTENT.videoType,
          storyTitle: aboutData.story_title || INITIAL_ABOUT_CONTENT.storyTitle,
          storyParagraphs: Array.isArray(aboutData.story_paragraphs) && aboutData.story_paragraphs.length > 0
            ? aboutData.story_paragraphs
            : (aboutData.story_markdown ? aboutData.story_markdown.split(/\n\n+/).filter(Boolean) : INITIAL_ABOUT_CONTENT.storyParagraphs),
          missionTitle: aboutData.mission_title || INITIAL_ABOUT_CONTENT.missionTitle,
          missionText: aboutData.mission_text || INITIAL_ABOUT_CONTENT.missionText,
          visionTitle: aboutData.vision_title || INITIAL_ABOUT_CONTENT.visionTitle,
          visionText: aboutData.vision_text || INITIAL_ABOUT_CONTENT.visionText,
          milestones: Array.isArray(aboutData.milestones) && aboutData.milestones.length > 0
            ? aboutData.milestones.map((m: any, idx: number) => ({
                id: m.id || `m-${idx + 1}-${m.year || Date.now()}`,
                year: String(m.year || ''),
                title: m.title || '',
                description: m.description || m.desc || '',
              }))
            : INITIAL_ABOUT_CONTENT.milestones,
          coreValues: Array.isArray(aboutData.core_values) && aboutData.core_values.length > 0
            ? aboutData.core_values.map((v: any, idx: number) => ({
                id: v.id || `v-${idx + 1}`,
                title: v.title || '',
                description: v.description || v.desc || '',
                iconType: v.iconType || v.icon_type || 'flask',
              }))
            : INITIAL_ABOUT_CONTENT.coreValues,
          storyMarkdown: aboutData.story_markdown || '',
          progressMarkdown: aboutData.progress_markdown || '',
        };
        setAboutContent(a);
        newCache.aboutContent = a;
      }

      // Save valid fetch to cache for the next reload
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));

    } catch (err: any) {
      console.warn('Backend fetch notice:', err.message || err);
      setError(err.message || 'Error connecting to database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase.channel('live-db-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stats' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborations' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'about_content' }, () => fetchData())
        .subscribe();
    } catch (channelErr) {
      console.warn('Realtime channel sync could not be initialized:', channelErr);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // Ignore cleanup error
        }
      }
    };
  }, [fetchData]);

  const addCategory = async (name: string): Promise<{ success: boolean; error?: string; category?: Category }> => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'Category name cannot be empty.' };
    }

    // Enforce unique category name (case-insensitive check)
    const duplicate = categories.find(
      (c) => c?.name?.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      return { 
        success: false, 
        error: `Category "${duplicate.name}" already exists. Category names must be unique.` 
      };
    }

    const newId = `cat-${Date.now()}`;
    const code = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
    const newCat: Category = { 
      id: newId, 
      name: trimmed, 
      code, 
      hindiTitle: '',
      description: '',
      iconName: 'FlaskConical',
      active: true, 
      sortOrder: categories.length + 1 
    };

    setCategories((prev) => [...prev, newCat]);

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.categories = [...(parsed.categories || []), newCat];
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache write notice:', e);
    }

    try {
      const { error } = await supabase.from('categories').insert([{ 
        id: newId, 
        name: trimmed, 
        code, 
        hindi_title: '',
        description: '',
        icon_name: 'FlaskConical',
        active: true, 
        sort_order: newCat.sortOrder 
      }]);
      if (error) {
        console.warn('Supabase add category error:', error.message);
        return { success: false, error: error.message };
      }
      await logAdminAction('CREATE_CATEGORY', newId, { name: trimmed });
      return { success: true, category: newCat };
    } catch (err: any) { 
      console.error('Add category error:', err);
      return { success: true, category: newCat };
    }
  };

  const deleteCategory = async (categoryId: string): Promise<{ success: boolean; deletedProductsCount: number; error?: string }> => {
    const targetCat = categories.find((c) => c.id === categoryId);
    if (!targetCat) {
      return { success: false, deletedProductsCount: 0, error: 'Category not found.' };
    }

    // 1. Identify all products associated with this category by name or categoryId
    const targetNameLower = targetCat.name.trim().toLowerCase();
    const associatedProducts = products.filter(
      (p) => (p.category && p.category.trim().toLowerCase() === targetNameLower) || p.categoryId === targetCat.id
    );
    const deletedProductsCount = associatedProducts.length;
    const associatedIds = associatedProducts.map((p) => p.id);

    // 2. Optimistically update local state
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    if (deletedProductsCount > 0) {
      setProducts((prev) => prev.filter((p) => !associatedIds.includes(p.id)));
    }

    // 3. Update localStorage cache immediately
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.categories = (parsed.categories || []).filter((c: any) => c.id !== categoryId);
        if (deletedProductsCount > 0) {
          parsed.products = (parsed.products || []).filter((p: any) => !associatedIds.includes(p.id));
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache write notice:', e);
    }

    // 4. Delete associated products from database
    try {
      if (deletedProductsCount > 0) {
        const { error: prodErr } = await supabase
          .from('products')
          .delete()
          .in('id', associatedIds);
        if (prodErr) {
          console.warn('Delete associated products notice:', prodErr.message);
        }
      }

      // 5. Delete category from database
      const { error: catErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (catErr) {
        console.warn('Delete category notice:', catErr.message);
      }

      await logAdminAction('DELETE_CATEGORY', categoryId, {
        name: targetCat.name,
        deletedProductsCount,
      });

      return { success: true, deletedProductsCount };
    } catch (err: any) {
      console.error('Delete category exception:', err);
      return { success: true, deletedProductsCount };
    }
  };

  const addProduct = async (newProd: Omit<Product, 'id' | 'createdAt'>) => {
    const newId = `prod-${Date.now()}`;
    const fullProduct: Product = { ...newProd, id: newId, createdAt: new Date().toISOString().split('T')[0] };
    setProducts((prev) => [fullProduct, ...prev]);
    try {
      const dbRow = { ...mapProductToDb(fullProduct), created_at: new Date().toISOString() };
      const { error: insertErr } = await supabase.from('products').insert([dbRow]);
      if (!insertErr) await logAdminAction('CREATE_PRODUCT', fullProduct.code, { id: newId, name: fullProduct.name, category: fullProduct.category });
    } catch (err) { console.error(err); }
  };

  const updateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    try {
      const { error: updateErr } = await supabase.from('products').update(mapProductToDb(updated)).eq('id', updated.id);
      if (!updateErr) await logAdminAction('UPDATE_PRODUCT', updated.code, { id: updated.id, name: updated.name });
    } catch (err) { console.error(err); }
  };

  const toggleProductActive = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const newStatus = target.active === false;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, active: newStatus } : p)));
    try {
      const { error } = await supabase.from('products').update({ active: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (!error) await logAdminAction(newStatus ? 'ENABLE_PRODUCT' : 'DISABLE_PRODUCT', target.code, { id, newStatus });
    } catch (err) { console.error(err); }
  };

  const deleteProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error && target) await logAdminAction('DELETE_PRODUCT', target.code, { id, name: target.name });
    } catch (err) { console.error(err); }
  };

  const addInquiry = async (inq: Omit<Inquiry, 'id' | 'date' | 'status'>): Promise<{ success: boolean; error?: string }> => {
    const newId = `inq-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const newInquiry: Inquiry = {
      ...inq,
      id: newId,
      status: 'New',
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const { error } = await supabase.from('inquiries').insert([{
        id: newId,
        customer_name: inq.customerName.trim(),
        phone: inq.phone.trim(),
        email: inq.email.trim(),
        company_name: inq.companyName?.trim() || '',
        product_category: inq.productCategory.trim(),
        message: inq.message.trim(),
        status: 'New',
        assigned_to: inq.assignedTo?.trim() || 'Sales Team',
        created_at: new Date().toISOString(),
      }]);

      if (error) {
        console.error('Supabase inquiries insert error:', error.message);
        return { success: false, error: error.message };
      }

      setInquiries((prev) => [newInquiry, ...prev]);
      return { success: true };
    } catch (err: any) {
      console.error('Inquiries network error:', err);
      return { success: false, error: err?.message || 'Failed to submit inquiry to server.' };
    }
  };

  const updateInquiryStatus = async (id: string, status: Inquiry['status']) => {
    setInquiries((prev) => prev.map((inq) => (inq.id === id ? { ...inq, status } : inq)));
    try {
      const { error } = await supabase.from('inquiries').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (!error) await logAdminAction('UPDATE_INQUIRY_STATUS', id, { status });
    } catch (err) { console.error(err); }
  };

  const deleteInquiry = async (id: string) => {
    setInquiries((prev) => prev.filter((inq) => inq.id !== id));
    try {
      const { error } = await supabase.from('inquiries').delete().eq('id', id);
      if (!error) await logAdminAction('DELETE_INQUIRY', id);
    } catch (err) { console.error(err); }
  };

  const updateCompanySettings = async (settings: CompanySettings) => {
    setCompanySettings(settings);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.companySettings = settings;
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache write notice:', e);
    }

    try {
      const payload: Record<string, any> = {
        id: 'primary', 
        company_name: settings.companyName, 
        short_name: settings.shortName,
        contact1_name: settings.contact1Name, 
        contact1_phone: settings.contact1Phone, 
        contact2_name: settings.contact2Name, 
        contact2_phone: settings.contact2Phone, 
        email: settings.email, 
        address: settings.address, 
        contacts: settings.contacts,
        logo_url: settings.logoUrl,
        logo_path: settings.logoPath,
        logo_icon_url: settings.logoIconUrl,
        logo_icon_path: settings.logoIconPath,
        favicon_url: settings.faviconUrl,
        cin: settings.cin,
        gstin: settings.gstin,
        updated_at: new Date().toISOString(),
      };
      if (settings.tagline !== undefined) payload.tagline = settings.tagline;
      if (settings.subTagline !== undefined) payload.sub_tagline = settings.subTagline;
      if (settings.heroHeadline !== undefined) payload.hero_headline = settings.heroHeadline;
      if (settings.heroHighlightText !== undefined) payload.hero_highlight_text = settings.heroHighlightText;
      if (settings.heroDescription !== undefined) payload.hero_description = settings.heroDescription;
      if (settings.heroPrimaryCtaText !== undefined) payload.hero_primary_cta_text = settings.heroPrimaryCtaText;
      if (settings.heroPrimaryCtaLink !== undefined) payload.hero_primary_cta_link = settings.heroPrimaryCtaLink;
      if (settings.heroSecondaryCtaText !== undefined) payload.hero_secondary_cta_text = settings.heroSecondaryCtaText;
      if (settings.heroSecondaryCtaLink !== undefined) payload.hero_secondary_cta_link = settings.heroSecondaryCtaLink;
      if (settings.heroActive !== undefined) payload.hero_active = settings.heroActive;

      const { error } = await supabase.from('company_settings').upsert(payload);
      if (error) {
        console.warn('Company settings upsert notice:', error.message);
        // Fallback: If DB schema dropped hero columns, upsert base fields only
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const corePayload = {
            id: 'primary',
            company_name: settings.companyName,
            short_name: settings.shortName,
            contact1_name: settings.contact1Name,
            contact1_phone: settings.contact1Phone,
            contact2_name: settings.contact2Name,
            contact2_phone: settings.contact2Phone,
            email: settings.email,
            address: settings.address,
            contacts: settings.contacts,
            logo_url: settings.logoUrl,
            logo_path: settings.logoPath,
            cin: settings.cin,
            gstin: settings.gstin,
            updated_at: new Date().toISOString(),
          };
          await supabase.from('company_settings').upsert(corePayload);
        }
      } else {
        await logAdminAction('UPDATE_SETTINGS', 'company_settings');
      }
    } catch (err) { 
      console.error('Company settings update error:', err); 
    }
  };

  const updateStat = async (id: string, updated: Partial<StatItem>) => {
    setStats((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    try {
      const target = stats.find((s) => s.id === id);
      const merged = { ...target, ...updated };
      await supabase.from('stats').upsert({
        id, value: merged.value, prefix: merged.prefix || '', suffix: merged.suffix || '', label: merged.label,
        description: merged.description || '', icon_type: merged.iconType || 'trending', category: merged.category || 'general',
        sort_order: merged.sortOrder ?? 0, active: merged.active !== false, updated_at: new Date().toISOString(),
      });
      await logAdminAction('UPDATE_STAT', id);
    } catch (err) { console.error(err); }
  };

  const addStat = async () => {
    const newId = `stat-${Date.now()}`;
    const newStat: StatItem = { id: newId, value: '0', prefix: '', suffix: '+', label: 'New Metric', description: 'Add a short description.', iconType: 'trending', category: 'general', sortOrder: stats.length + 1, active: true };
    setStats((prev) => [...prev, newStat]);
    try {
      await supabase.from('stats').insert([{
        id: newId, value: newStat.value, prefix: newStat.prefix || '', suffix: newStat.suffix || '', label: newStat.label,
        description: newStat.description, icon_type: newStat.iconType, category: newStat.category, sort_order: newStat.sortOrder, active: true,
      }]);
      await logAdminAction('CREATE_STAT', newId);
    } catch (err) { console.error(err); }
  };

  const deleteStat = async (id: string) => {
    setStats((prev) => prev.filter((stat) => stat.id !== id));
    try {
      await supabase.from('stats').delete().eq('id', id);
      await logAdminAction('DELETE_STAT', id);
    } catch (err) { console.error(err); }
  };

  const setAllStats = async (newStats: StatItem[]) => setStats(newStats);

  const addCollaboration = async (collab: Omit<Collaboration, 'id'>) => {
    const newId = `collab-${Date.now()}`;
    const newCollab: Collaboration = { ...collab, id: newId };
    setCollaborations((prev) => [...prev, newCollab]);

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.collaborations = [...(parsed.collaborations || []), newCollab];
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache write notice:', e);
    }

    try {
      const { error } = await supabase.from('collaborations').insert([{
        id: newId, 
        name: collab.name, 
        type: collab.type, 
        partnership_tier: collab.partnershipTier || 'Strategic Alliance',
        location: collab.location || '', 
        logo_url: collab.logoUrl || null, 
        logo_path: collab.logoPath || null, 
        badge_text: collab.badgeText || 'Official Alliance',
        website_url: collab.websiteUrl || '', 
        description: collab.description || '', 
        active: collab.active !== false, 
        sort_order: (collab.sortOrder ?? collaborations.length) + 1,
      }]);
      if (!error) {
        await logAdminAction('CREATE_COLLABORATION', newId, { name: collab.name });
      } else {
        console.warn('Supabase add collaboration notice:', error.message);
      }
    } catch (err) { 
      console.error('Error adding collaboration:', err); 
    }
  };

  const updateCollaboration = async (collab: Collaboration) => {
    setCollaborations((prev) => prev.map((c) => (c.id === collab.id ? collab : c)));

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.collaborations = (parsed.collaborations || []).map((c: any) => c.id === collab.id ? collab : c);
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache write notice:', e);
    }

    try {
      const { error } = await supabase.from('collaborations').update({
        name: collab.name, 
        type: collab.type, 
        partnership_tier: collab.partnershipTier || 'Strategic Alliance', 
        location: collab.location || '',
        logo_url: collab.logoUrl || null, 
        logo_path: collab.logoPath || null, 
        badge_text: collab.badgeText || 'Official Alliance', 
        website_url: collab.websiteUrl || '',
        description: collab.description || '', 
        active: collab.active !== false, 
        sort_order: collab.sortOrder ?? 0, 
        updated_at: new Date().toISOString(),
      }).eq('id', collab.id);
      if (!error) {
        await logAdminAction('UPDATE_COLLABORATION', collab.id, { name: collab.name });
      } else {
        console.warn('Supabase update collaboration notice:', error.message);
      }
    } catch (err) { 
      console.error('Error updating collaboration:', err); 
    }
  };

  const deleteCollaboration = async (id: string) => {
    setCollaborations((prev) => prev.filter((c) => c.id !== id));

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.collaborations = (parsed.collaborations || []).filter((c: any) => c.id !== id);
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache write notice:', e);
    }

    try {
      const { error } = await supabase.from('collaborations').delete().eq('id', id);
      if (!error) {
        await logAdminAction('DELETE_COLLABORATION', id);
      } else {
        console.warn('Supabase delete collaboration notice:', error.message);
      }
    } catch (err) { 
      console.error('Error deleting collaboration:', err); 
    }
  };

  const toggleCollaborationActive = async (id: string) => {
    const target = collaborations.find((c) => c.id === id);
    if (!target) return;
    const newActive = !target.active;
    setCollaborations((prev) => prev.map((c) => (c.id === id ? { ...c, active: newActive } : c)));

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.collaborations = (parsed.collaborations || []).map((c: any) => c.id === id ? { ...c, active: newActive } : c);
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache write notice:', e);
    }

    try {
      const { error } = await supabase.from('collaborations').update({ active: newActive }).eq('id', id);
      if (!error) {
        await logAdminAction('TOGGLE_COLLABORATION', id, { active: newActive });
      } else {
        console.warn('Supabase toggle collaboration notice:', error.message);
      }
    } catch (err) { 
      console.error('Error toggling collaboration active state:', err); 
    }
  };

  const updateAboutContent = async (content: AboutContent) => {
    setAboutContent(content);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.aboutContent = content;
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn('Cache write notice:', e);
    }

    try {
      const payload: Record<string, any> = {
        id: 'primary',
        updated_at: new Date().toISOString(),
      };
      if (content.storyMarkdown !== undefined) payload.story_markdown = content.storyMarkdown;
      if (content.progressMarkdown !== undefined) payload.progress_markdown = content.progressMarkdown;
      if (content.videoUrl !== undefined) payload.video_url = content.videoUrl;
      if (content.videoType !== undefined) payload.video_type = content.videoType;
      if (content.storyTitle !== undefined) payload.story_title = content.storyTitle;
      if (content.storyParagraphs !== undefined) payload.story_paragraphs = content.storyParagraphs;
      if (content.missionTitle !== undefined) payload.mission_title = content.missionTitle;
      if (content.missionText !== undefined) payload.mission_text = content.missionText;
      if (content.visionTitle !== undefined) payload.vision_title = content.visionTitle;
      if (content.visionText !== undefined) payload.vision_text = content.visionText;
      if (content.milestones !== undefined) payload.milestones = content.milestones;
      if (content.coreValues !== undefined) payload.core_values = content.coreValues;

      const { error } = await supabase.from('about_content').upsert(payload);
      if (error) {
        console.warn('Supabase about_content upsert notice:', error.message);
        // Fallback: If DB schema dropped jsonb fields, save markdown columns
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const minimalPayload = {
            id: 'primary',
            updated_at: new Date().toISOString(),
            story_markdown: content.storyMarkdown || (content.storyParagraphs || []).join('\n\n'),
            progress_markdown: content.progressMarkdown || '',
          };
          await supabase.from('about_content').upsert(minimalPayload);
        }
      } else {
        await logAdminAction('UPDATE_ABOUT_CONTENT', 'about_content');
      }
    } catch (err) { 
      console.error('About content update exception:', err); 
    }
  };

  return (
    <DataContext.Provider
      value={{
        products, categories, inquiries, companySettings, stats, collaborations, aboutContent, loading, error, refreshData: fetchData,
        addProduct, updateProduct, toggleProductActive, deleteProduct, addCategory, deleteCategory, addInquiry, updateInquiryStatus, deleteInquiry,
        updateCompanySettings, updateStat, addStat, deleteStat, setAllStats, addCollaboration, updateCollaboration,
        deleteCollaboration, toggleCollaborationActive, updateAboutContent,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
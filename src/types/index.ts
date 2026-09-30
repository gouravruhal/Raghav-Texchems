export interface Category {
  id: string;
  name: string;
  code: string;
  active: boolean;
  sortOrder: number;
  hindiTitle?: string;
  description?: string;
  iconName?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  categoryId?: string;
  description: string;
  imageUrl?: string;
  imagePath?: string;
  appearance?: string;
  ph?: string;
  activeContent?: string;
  viscosity?: string;
  ionicNature?: string;
  solubility?: string;
  shelfLife?: string;
  packaging: string[];
  tdsUrl?: string;
  sdsUrl?: string;
  applications: string[];
  featured: boolean;
  active: boolean;
  stockStatus: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  companyName?: string;
  productCategory: string;
  message: string;
  status: 'New' | 'Under Evaluation' | 'In Progress' | 'Quotation Sent' | 'Sample Dispatched' | 'Closed' | 'Read' | 'Unread';
  date: string;
  createdAt?: string;
  assignedTo?: string;
}

export interface StatItem {
  id: string;
  value: string;
  prefix?: string;
  suffix?: string;
  label: string;
  description?: string;
  iconType: string;
  category: string;
  sortOrder: number;
  active: boolean;
}

export interface Collaboration {
  id: string;
  name: string;
  type: string;
  partnershipTier?: string;
  location: string;
  logoUrl?: string;
  logoPath?: string;
  badgeText?: string;
  websiteUrl?: string;
  description?: string;
  active: boolean;
  sortOrder?: number;
}

export interface CompanyContact {
  id: string;
  name: string;
  title: string;
  phone: string;
  email?: string;
  active: boolean;
}

export interface CompanySettings {
  companyName: string;
  shortName: string;
  tagline: string;
  subTagline?: string;
  heroHeadline?: string;
  heroHighlightText?: string;
  heroDescription?: string;
  heroPrimaryCtaText?: string;
  heroPrimaryCtaLink?: string;
  heroSecondaryCtaText?: string;
  heroSecondaryCtaLink?: string;
  heroActive?: boolean;
  contact1Name: string;
  contact1Phone: string;
  contact2Name: string;
  contact2Phone: string;
  email: string;
  address: string;
  contacts: CompanyContact[];
  logoUrl?: string;
  logoPath?: string;
  logoIconUrl?: string;
  logoIconPath?: string;
  faviconUrl?: string;
  cin?: string;
  gstin?: string;
}

export interface AboutMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface AboutValue {
  id: string;
  title: string;
  description: string;
  iconType: string;
}

export interface AboutContent {
  videoUrl?: string;
  videoType?: 'youtube' | 'direct';
  storyTitle?: string;
  storyParagraphs?: string[];
  missionTitle?: string;
  missionText?: string;
  visionTitle?: string;
  visionText?: string;
  milestones?: AboutMilestone[];
  coreValues?: AboutValue[];
  storyMarkdown?: string;
  progressMarkdown?: string;
}
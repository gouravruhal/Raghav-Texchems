/**
 * Application-wide Validation & Sanitization Engine
 * 
 * Enforces strict input limits, character filtering, OWASP Top 10 XSS defense (DOMPurify),
 * SSRF mitigation, URL sanitization, and MIME-type restrictions.
 */

import DOMPurify from 'dompurify';

// Maximum field length constants
export const LIMITS = {
  PRODUCT_NAME: 150,
  PRODUCT_CODE: 50,
  PRODUCT_CATEGORY: 60,
  PRODUCT_DESCRIPTION: 3000,
  PRODUCT_SPEC: 150,
  PRODUCT_APPLICATIONS_MAX: 20,
  PRODUCT_APPLICATION_LEN: 80,
  // Hardened & reduced inquiry limits to prevent payload attacks
  CUSTOMER_NAME: 50,
  CUSTOMER_PHONE: 15,
  CUSTOMER_EMAIL: 60,
  CUSTOMER_COMPANY: 60,
  CUSTOMER_MESSAGE: 300,
  SEARCH_QUERY: 100,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_LOGO_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
};

// Allowed image MIME types & extensions
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

/**
 * Sanitize plain string (OWASP A03: Injection defense):
 * - Strips all executable HTML/XSS using DOMPurify
 * - Strips null bytes and ASCII control characters
 * - Trims whitespace
 * - Caps max length
 */
export function sanitizeString(input: string | undefined | null, maxLength = 3000): string {
  if (!input) return '';
  
  // Use DOMPurify to strip any HTML tags or script injection
  const purified = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return purified
    .replace(/\0/g, '') // remove null bytes
    // oxlint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '') // remove ASCII control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize search query:
 * - Trims
 * - Removes non-printable or malicious characters
 * - Caps to 100 chars
 */
export function sanitizeSearchQuery(query: string | undefined | null): string {
  if (!query) return '';
  const purified = DOMPurify.sanitize(query, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return purified
    .trim()
    .replace(/[\0\r\n\t]/g, ' ')
    .slice(0, LIMITS.SEARCH_QUERY);
}

/**
 * Validate standard Email address (RFC 5322 subset)
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > LIMITS.CUSTOMER_EMAIL) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate international / domestic phone numbers
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || phone.length > LIMITS.CUSTOMER_PHONE) return false;
  // Allow digits, spaces, hyphens, plus prefix, parentheses
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  return phoneDigits.length >= 7 && phoneDigits.length <= 15;
}

/**
 * Validate URL to prevent XSS protocols and SSRF private IP targeting (OWASP A10):
 * - Blocks 'javascript:', 'data:', 'vbscript:', 'file:'
 * - Blocks private intranet IP ranges (127.0.0.1, 10.*, 192.168.*, 172.16-31.*, 169.254.169.254)
 * - Enforces http / https protocol
 */
export function isValidHttpUrl(urlStr: string): boolean {
  if (!urlStr || urlStr.length > 2048) return false;
  const trimmed = urlStr.trim().toLowerCase();

  // Reject pseudo-protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(urlStr.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Check for SSRF private network addresses & metadata targets
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '169.254.169.254' || // AWS/cloud metadata
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate file upload (Product image)
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 5 MB limit (file is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  const mime = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
    return {
      valid: false,
      error: 'Invalid file format. Allowed formats: PNG, JPEG, WebP, SVG.',
    };
  }

  const fileName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Invalid file extension. Please select a valid image file (.png, .jpg, .jpeg, .webp, .svg).',
    };
  }

  return { valid: true };
}

/**
 * Validate website logo upload (PNG, SVG, JPG, WebP)
 */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No logo file provided.' };
  }

  if (file.size > LIMITS.MAX_LOGO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Logo size exceeds the 5 MB limit (file is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  const mime = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
    return {
      valid: false,
      error: 'Invalid logo format. Recommended formats: transparent SVG or PNG (JPEG and WebP also supported).',
    };
  }

  const fileName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Invalid file extension. Please select an SVG, PNG, JPG, or WebP logo file.',
    };
  }

  return { valid: true };
}

/**
 * Validate Product Data
 */
export function validateProductData(data: {
  name: string;
  code: string;
  category: string;
  description: string;
  imageUrl?: string;
  ph?: string;
  appearance?: string;
  activeContent?: string;
  viscosity?: string;
  applications?: string[];
}): { valid: boolean; error?: string } {
  const name = sanitizeString(data.name, LIMITS.PRODUCT_NAME);
  if (!name) {
    return { valid: false, error: 'Product name is required.' };
  }
  if (name.length > LIMITS.PRODUCT_NAME) {
    return { valid: false, error: `Product name cannot exceed ${LIMITS.PRODUCT_NAME} characters.` };
  }

  const code = sanitizeString(data.code, LIMITS.PRODUCT_CODE);
  if (!code) {
    return { valid: false, error: 'Product SKU code is required.' };
  }
  if (code.length > LIMITS.PRODUCT_CODE) {
    return { valid: false, error: `Product code cannot exceed ${LIMITS.PRODUCT_CODE} characters.` };
  }

  const category = sanitizeString(data.category, LIMITS.PRODUCT_CATEGORY);
  if (!category) {
    return { valid: false, error: 'Product category is required.' };
  }

  const description = sanitizeString(data.description, LIMITS.PRODUCT_DESCRIPTION);
  if (!description) {
    return { valid: false, error: 'Product description is required.' };
  }

  if (data.imageUrl && !data.imageUrl.startsWith('blob:')) {
    if (!isValidHttpUrl(data.imageUrl)) {
      return { valid: false, error: 'Product Image URL must be a valid HTTP or HTTPS link.' };
    }
  }

  return { valid: true };
}

/**
 * Strict character whitelist for inquiry fields:
 * Only letters, numbers, spaces, and the specific punctuation: . , - ( )
 * Disallows quotes, semicolons, HTML/script tags, curly/square brackets, etc.
 */
export function isValidInquiryText(input: string): boolean {
  if (!input) return true;
  // Allow letters, numbers, spaces, linebreaks, and only . , - ( )
  return /^[a-zA-Z0-9\s.,\-()]*$/.test(input);
}

export function isValidInquiryName(input: string): boolean {
  if (!input) return false;
  // Name: letters, spaces, and only . , - ( )
  return /^[a-zA-Z\s.,\-()]+$/.test(input);
}

export function isValidInquiryPhone(phone: string): boolean {
  if (!phone) return false;
  // Phone: digits, spaces, +, and only . , - ( )
  if (!/^[0-9+\s.,\-()]+$/.test(phone)) return false;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Validate Customer RFQ / Inquiry Form with strict security rules:
 * - Character limits reduced on all fields
 * - Strict whitelist: only alphanumeric, spaces, and . , - ( ) allowed
 */
export function validateInquiryData(data: {
  customerName: string;
  phone: string;
  email: string;
  companyName?: string;
  productCategory: string;
  message: string;
}): { valid: boolean; error?: string } {
  // 1. Name validation (max 50 chars, only letters, spaces, . , - ( ))
  const name = sanitizeString(data.customerName, LIMITS.CUSTOMER_NAME);
  if (!name || name.length < 2) {
    return { valid: false, error: 'Please enter your name (minimum 2 characters).' };
  }
  if (name.length > LIMITS.CUSTOMER_NAME) {
    return { valid: false, error: `Name cannot exceed ${LIMITS.CUSTOMER_NAME} characters.` };
  }
  if (!isValidInquiryName(name)) {
    return { valid: false, error: 'Name can only contain letters, spaces, and . , - ( ) characters.' };
  }

  // 2. Phone validation (max 15 chars, 7-15 digits, +, . , - ( ))
  const phone = data.phone?.trim() || '';
  if (!phone || phone.length > LIMITS.CUSTOMER_PHONE || !isValidInquiryPhone(phone)) {
    return { valid: false, error: `Phone must be between 7 and ${LIMITS.CUSTOMER_PHONE} digits. Allowed: digits, +, spaces, . , - ( )` };
  }

  // 3. Email validation (max 60 chars, valid email pattern)
  const email = data.email?.trim() || '';
  if (!email || email.length > LIMITS.CUSTOMER_EMAIL || !isValidEmail(email)) {
    return { valid: false, error: `Please enter a valid email address (max ${LIMITS.CUSTOMER_EMAIL} characters).` };
  }

  // 4. Company Name validation (optional, max 60 chars, only alphanumeric and . , - ( ))
  if (data.companyName) {
    const company = sanitizeString(data.companyName, LIMITS.CUSTOMER_COMPANY);
    if (company.length > LIMITS.CUSTOMER_COMPANY) {
      return { valid: false, error: `Company name cannot exceed ${LIMITS.CUSTOMER_COMPANY} characters.` };
    }
    if (!isValidInquiryText(company)) {
      return { valid: false, error: 'Company name can only contain letters, numbers, spaces, and . , - ( ) characters.' };
    }
  }

  // 5. Product Category validation (max 60 chars)
  const category = sanitizeString(data.productCategory, LIMITS.PRODUCT_CATEGORY);
  if (!category) {
    return { valid: false, error: 'Please select a product category.' };
  }
  if (category.length > LIMITS.PRODUCT_CATEGORY || !isValidInquiryText(category)) {
    return { valid: false, error: 'Product category contains invalid characters.' };
  }

  // 6. Message validation (max 300 chars, min 5 chars, only alphanumeric, spaces, and . , - ( ))
  const message = sanitizeString(data.message, LIMITS.CUSTOMER_MESSAGE);
  if (!message || message.length < 5) {
    return { valid: false, error: 'Please describe your inquiry or chemical requirement (minimum 5 characters).' };
  }
  if (message.length > LIMITS.CUSTOMER_MESSAGE) {
    return { valid: false, error: `Message cannot exceed ${LIMITS.CUSTOMER_MESSAGE} characters.` };
  }
  if (!isValidInquiryText(message)) {
    return { valid: false, error: 'Message can only contain letters, numbers, spaces, and . , - ( ) characters.' };
  }

  return { valid: true };
}

/**
 * Secure Supabase Storage Management
 *
 * Enforces file validation, unique random UUID filenames to prevent path traversal
 * and overwrite collisions, and retrieves public URLs.
 * Manages 'product-images' and 'company-assets' (logo & visual branding).
 */

import { supabase } from './supabase';
import { validateImageFile, validateLogoFile } from './validation';

export interface StorageUploadResult {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Upload product technical image to Supabase 'product-images' bucket
 */
export async function uploadProductImage(file: File): Promise<StorageUploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Invalid image file.',
    };
  }

  try {
    // Generate secure random path to prevent directory traversal and overwrite attacks
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const randomId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const storagePath = `products/${randomId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Product image storage upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image to storage.',
      };
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      storagePath: data.path,
    };
  } catch (err) {
    console.error('Product image upload exception:', err);
    return {
      success: false,
      error: 'Unexpected error during image upload.',
    };
  }
}

/**
 * Upload official company website logo to Supabase 'company-assets' bucket
 */
export async function uploadCompanyLogo(file: File): Promise<StorageUploadResult> {
  const validation = validateLogoFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Invalid logo file.',
    };
  }

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const randomId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const storagePath = `branding/logo-${randomId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('company-assets')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Logo upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload logo to storage.',
      };
    }

    const { data: urlData } = supabase.storage
      .from('company-assets')
      .getPublicUrl(data.path);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      storagePath: data.path,
    };
  } catch (err) {
    console.error('Logo upload exception:', err);
    return {
      success: false,
      error: 'Unexpected error during logo upload.',
    };
  }
}

/**
 * Delete a file from a Supabase storage bucket
 */
export async function deleteStorageFile(bucket: 'product-images' | 'company-assets', path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn(`Failed to delete storage file from ${bucket}/${path}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Storage delete exception:`, err);
    return false;
  }
}

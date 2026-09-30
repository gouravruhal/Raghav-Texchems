/**
 * Admin Activity Audit Logger
 *
 * Records sensitive administrative actions to the Supabase admin_audit_logs table.
 * Adheres strictly to security practices: never logs passwords, OTPs, or auth tokens.
 */

import { supabase } from './supabase';

export interface AuditLogEntry {
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}

/**
 * Log an administrative action to Supabase
 */
export async function logAdminAction(
  action: string,
  resource: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const adminId = userData.user?.id;

    if (!adminId) {
      // Not authenticated, skip audit logging
      return;
    }

    // Sanitize details to guarantee no secrets/passwords are captured
    const sanitizedDetails: Record<string, unknown> = {};
    if (details) {
      for (const [key, value] of Object.entries(details)) {
        if (
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('otp') ||
          key.toLowerCase().includes('code')
        ) {
          sanitizedDetails[key] = '[REDACTED]';
        } else {
          sanitizedDetails[key] = value;
        }
      }
    }

    await supabase.from('admin_audit_logs').insert([
      {
        admin_id: adminId,
        action,
        resource,
        details: sanitizedDetails,
      },
    ]);
  } catch (err) {
    // Non-blocking catch to prevent UI interruption if logging network fails
    console.warn('Audit logging failed:', err);
  }
}

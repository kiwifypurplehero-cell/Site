const cfg = window.PLUMP_CONFIG || {};
const placeholder = (value = '') => !value || value.includes('COLOQUE_');
const publicKey = cfg.SUPABASE_PUBLIC_KEY || cfg.SUPABASE_ANON_KEY;
export const configured = Boolean(window.supabase && !placeholder(cfg.SUPABASE_URL) && !placeholder(publicKey));
export const db = configured ? window.supabase.createClient(cfg.SUPABASE_URL, publicKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;
export const REDIRECT_URL = 'https://site.kiwifypurplehero.workers.dev/';

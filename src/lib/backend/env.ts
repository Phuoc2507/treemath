// Centralized runtime config for the backend base URL/key.
// Uses environment variables with Lovable Cloud fallbacks

// Lovable Cloud project configuration (public values - safe to include)
const LOVABLE_CLOUD_PROJECT_ID = 'vijsarilxqwghzyaygcm';
const LOVABLE_CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpanNhcmlseHF3Z2h6eWF5Z2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTQ0MDAsImV4cCI6MjA4MTczMDQwMH0.ERDFx8HWNcWWzxGzglucpihqycL4rgIdMLMqGjfTZUY';

export const getBackendBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl) return envUrl;
  
  // Fallback to Lovable Cloud URL pattern
  return `https://${LOVABLE_CLOUD_PROJECT_ID}.supabase.co`;
};

export const getBackendPublishableKey = (): string => {
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (envKey) return envKey;
  
  // Fallback to Lovable Cloud anon key (publishable, safe to include)
  return LOVABLE_CLOUD_ANON_KEY;
};

export const isBackendConfigured = (): boolean => {
  // Always configured for Lovable Cloud projects
  return true;
};

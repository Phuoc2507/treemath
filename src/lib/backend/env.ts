// Centralized runtime config for the backend base URL/key.
// Uses environment variables with fallbacks for reliability

// Fallback values for development/edge cases where env vars may not load
const FALLBACK_URL = "https://vijsarilxqwghzyaygcm.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpanNhcmlseHF3Z2h6eWF5Z2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTQ0MDAsImV4cCI6MjA4MTczMDQwMH0.ERDFx8HWNcWWzxGzglucpihqycL4rgIdMLMqGjfTZUY";

export const getBackendBaseUrl = (): string => {
  // Prefer environment variable for easy key rotation
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  return envUrl || FALLBACK_URL;
};

export const getBackendPublishableKey = (): string => {
  // Prefer environment variable for easy key rotation
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return envKey || FALLBACK_KEY;
};

export const isBackendConfigured = (): boolean => {
  // Check if either env vars or fallbacks are available
  const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;
  return !!(url && key);
};

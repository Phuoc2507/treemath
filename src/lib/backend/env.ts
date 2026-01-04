// Centralized runtime config for the backend base URL/key.
// Hardcoded values to ensure they're always available

const SUPABASE_PROJECT_ID = "vijsarilxqwghzyaygcm";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpanNhcmlseHF3Z2h6eWF5Z2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTQ0MDAsImV4cCI6MjA4MTczMDQwMH0.ERDFx8HWNcWWzxGzglucpihqycL4rgIdMLMqGjfTZUY";

export const getBackendBaseUrl = (): string => {
  return `https://${SUPABASE_PROJECT_ID}.supabase.co`;
};

export const getBackendPublishableKey = (): string => {
  return SUPABASE_ANON_KEY;
};

export const isBackendConfigured = (): boolean => {
  return true;
};

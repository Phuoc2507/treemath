// Centralized runtime config for the backend base URL/key.
// Uses environment variables - no hardcoded fallbacks for easier key rotation

export const getBackendBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!envUrl) {
    throw new Error('Missing required environment variable: VITE_SUPABASE_URL');
  }
  return envUrl;
};

export const getBackendPublishableKey = (): string => {
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!envKey) {
    throw new Error('Missing required environment variable: VITE_SUPABASE_PUBLISHABLE_KEY');
  }
  return envKey;
};

export const isBackendConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return !!(url && key);
};

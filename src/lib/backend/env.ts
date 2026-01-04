// Centralized runtime config for the backend base URL/key.
// NOTE: We avoid importing the auto-generated Supabase client here to prevent app-wide crashes
// when env vars are temporarily missing in preview builds.

export const getBackendBaseUrl = (): string => {
  const direct = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (direct && direct.trim()) return direct;

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
  if (projectId && projectId.trim()) {
    return `https://${projectId}.supabase.co`;
  }

  return "";
};

export const getBackendPublishableKey = (): string => {
  return (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || "";
};

export const isBackendConfigured = (): boolean => {
  return Boolean(getBackendBaseUrl() && getBackendPublishableKey());
};

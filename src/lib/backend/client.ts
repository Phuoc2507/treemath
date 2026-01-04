import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getBackendBaseUrl, getBackendPublishableKey, isBackendConfigured } from "./env";

let _client: SupabaseClient<Database> | null = null;

export const getBackendClient = (): SupabaseClient<Database> | null => {
  if (_client) return _client;
  if (!isBackendConfigured()) return null;

  _client = createClient<Database>(getBackendBaseUrl(), getBackendPublishableKey(), {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return _client;
};

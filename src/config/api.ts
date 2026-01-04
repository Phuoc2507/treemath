import { getBackendBaseUrl } from "@/lib/backend/env";

// Cấu hình API URL
// Sử dụng Edge Function proxy - không cần thay đổi code khi khởi động lại ngrok
export const API_CONFIG = {
  // Edge Function proxy cho phân tích ảnh (URL backend được lưu trong secrets)
  TREE_ANALYSIS_URL: `${getBackendBaseUrl()}/functions/v1/analyze-tree`,
} as const;

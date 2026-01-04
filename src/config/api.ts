// Cấu hình API URL
// Sử dụng Edge Function proxy - không cần thay đổi code khi khởi động lại ngrok
// Bạn chỉ cần update secret 'PERCEPTREE_API_URL' trên Supabase Dashboard
export const API_CONFIG = {
  // Edge Function proxy cho phân tích ảnh (URL backend được lưu trong secrets)
  TREE_ANALYSIS_URL: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-tree`,
} as const;

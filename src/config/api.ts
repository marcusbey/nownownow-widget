export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  VERSION: '/api/v1',
  ENDPOINTS: {
    WIDGET: {
      USER_INFO: '/widget/user-info',
      USER_POSTS: '/widget/user-posts'
    }
  }
} as const;

export function getApiUrl(path: string): string {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.VERSION}${path}`;
}

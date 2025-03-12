import { type WidgetUserInfo, type WidgetPost } from '@/types/api';

import { API_CONFIG, getApiUrl } from '@/config/api';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

async function fetchWithAuth<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(getApiUrl(path), {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Export a type-safe API client
export const api = {
  getUserInfo: (token: string, userId: string): Promise<ApiResponse<WidgetUserInfo>> => 
    fetchWithAuth<WidgetUserInfo>(`${API_CONFIG.ENDPOINTS.WIDGET.USER_INFO}?userId=${encodeURIComponent(userId)}`, token),

  getUserPosts: (token: string, userId: string): Promise<ApiResponse<WidgetPost[]>> => 
    fetchWithAuth<WidgetPost[]>(`${API_CONFIG.ENDPOINTS.WIDGET.USER_POSTS}?userId=${encodeURIComponent(userId)}`, token)
} as const;

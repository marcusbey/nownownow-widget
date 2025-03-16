import { type WidgetOrgInfo, type WidgetPost } from '@/types/api';

import { apiStore, getApiUrl } from '@/config/api';

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
  getOrgInfo: (token: string, orgId: string): Promise<ApiResponse<WidgetOrgInfo>> => 
    fetchWithAuth<WidgetOrgInfo>(`${apiStore.config.ENDPOINTS.WIDGET.ORG_INFO}?orgId=${encodeURIComponent(orgId)}`, token),

  getOrgPosts: (token: string, orgId: string): Promise<ApiResponse<WidgetPost[]>> => 
    fetchWithAuth<WidgetPost[]>(`${apiStore.config.ENDPOINTS.WIDGET.ORG_POSTS}?orgId=${encodeURIComponent(orgId)}`, token)
} as const;

import { type User, type Post } from '@/types/api';

const API_BASE = 'https://nownownow.io/api';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

async function fetchWithAuth<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, success: true };
  } catch (error) {
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export async function fetchUserInfo(token: string): Promise<ApiResponse<User>> {
  return fetchWithAuth<User>('/users/me', token);
}

export async function fetchUserPosts(token: string): Promise<ApiResponse<Post[]>> {
  return fetchWithAuth<Post[]>('/users/me/posts', token);
}

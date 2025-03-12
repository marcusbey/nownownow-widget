export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  status?: string;
  displayName?: string;
  followers?: number;
}

export interface PostAttachment {
  type: string;
  url: string;
}

export interface PostStats {
  likes: number;
  comments: number;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  attachments?: PostAttachment[];
  _count?: PostStats;
}

export interface WidgetConfig {
  token: string;
  theme?: 'light' | 'dark';
  locale?: string;
}

export interface WidgetApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface WidgetOrgInfo {
  id: string;
  name: string;
  image?: string;
  bio?: string;
}

export interface WidgetPost {
  id: string;
  content: string;
  createdAt: string;
  _count?: {
    comments: number;
    likes: number;
  };
}

export const API_ENDPOINTS = {
  ORG_INFO: '/api/v1/widget/org-info',
  ORG_POSTS: '/api/v1/widget/org-posts',
} as const;

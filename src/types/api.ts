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

export interface WidgetConfig {
  orgId: string;
  token: string;
  theme: 'light' | 'dark';
  position: 'left' | 'right';
  buttonColor: string;
  buttonSize?: number;
  buttonBackgroundColor?: string;
  updated?: boolean;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  bookmarks: number;
}

export interface Organization {
  id: string;
  name: string;
  image: string;
  bio: string;
  followers: number;
}
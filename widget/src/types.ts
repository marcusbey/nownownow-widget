export interface WidgetConfig {
  userId: string;
  token: string;
  theme: 'light' | 'dark';
  position: 'left' | 'right';
  buttonColor: string;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  bookmarks: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
}
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
  image?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
}

export interface WidgetUser {
  id: string;
  name: string;
  displayName?: string;
  image?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
}

export interface OrgInfoResponse {
  organization: WidgetOrgInfo;
  user: WidgetUser;
}

export interface WidgetPost {
  id: string;
  content: string;
  title?: string;
  createdAt: string;
  isPinned?: boolean;
  scheduledAt?: string;
  image?: string;
  author?: {
    id?: string;
    name?: string;
    image?: string;
  };
  user?: {
    id: string;
    name: string;
    image?: string | null;
    bio?: string | null;
  };
  userId?: string;
  organizationId?: string;
  attachments?: {
    type: string;
    url: string;
  }[];
  media?: {
    id: string;
    url: string;
    type: string;
  }[];
  comments?: any[];
  _count?: {
    comments: number;
    likes: number;
    views?: number;
  };
}

export interface FeedbackItem {
  id: string;
  content: string;
  votes: number;
  status: 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  hasVoted: boolean;
}

export interface FeedbackPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FeedbackResponse {
  feedback: FeedbackItem[];
  pagination: FeedbackPagination;
}

export interface SubmitFeedbackRequest {
  content: string;
  email: string | null;
  organizationId: string;
}

export interface VoteFeedbackRequest {
  feedbackId: string;
  organizationId: string;
}

export const API_ENDPOINTS = {
  ORG_INFO: '/api/v1/widget/org-info',
  ORG_POSTS: '/api/v1/widget/org-posts',
  FEEDBACK: '/api/v1/widget/feedback'
} as const;

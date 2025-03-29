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
  subscription?: string | null;
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
  title?: string;
  content: string;
  createdAt: string;
  media?: any[];
  attachments?: any[];
  commentCount?: number;
  likeCount?: number;
  viewCount?: number;
  hasLiked?: boolean;
  user?: {
    id?: string;
    name?: string;
    image?: string | null;
  };
  _count?: {
    comments: number;
    likes: number;
    views: number;
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
  ORG_INFO: '/api/v1/organization/info',
  USER_ORG_LIST: '/api/v1/user/organizations',
  FEEDBACK: '/api/v1/widget/feedback',
  WIDGET: {
    ORG_INFO: '/api/v1/widget/org-info',
    ORG_POSTS: '/api/v1/widget/org-posts',
    POST_COMMENTS: '/api/v1/widget/post-comments',
    ADD_COMMENT: '/api/v1/widget/add-comment',
    TOGGLE_LIKE: '/api/v1/widget/toggle-like',
    TRACK_VIEW: '/api/v1/widget/track-view'
  }
} as const;

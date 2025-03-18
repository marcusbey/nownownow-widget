import { type OrgInfoResponse, type WidgetPost } from '@/types/api';

import { apiStore, getApiUrl } from '@/config/api';

import {
  API_ENDPOINTS,
  FeedbackResponse,
  SubmitFeedbackRequest,
  VoteFeedbackRequest,
  WidgetApiResponse
} from "../types/api";

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
  getOrgInfo: (token: string, orgId: string): Promise<ApiResponse<OrgInfoResponse>> =>
    fetchWithAuth<OrgInfoResponse>(`${apiStore.config.ENDPOINTS.WIDGET.ORG_INFO}?orgId=${encodeURIComponent(orgId)}`, token),

  getOrgPosts: (token: string, orgId: string, cursor?: string, limit: number = 10): Promise<ApiResponse<{ posts: WidgetPost[], nextCursor?: string, hasMore: boolean }>> => {
    let url = `${apiStore.config.ENDPOINTS.WIDGET.ORG_POSTS}?orgId=${encodeURIComponent(orgId)}&limit=${limit}`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    return fetchWithAuth<{ posts: WidgetPost[], nextCursor?: string, hasMore: boolean }>(url, token);
  },

  async getFeedback(
    token: string,
    orgId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<WidgetApiResponse<FeedbackResponse>> {
    try {
      const url = new URL(`${API_ENDPOINTS.FEEDBACK}`, apiStore.baseUrl);
      url.searchParams.append("orgId", orgId);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Origin: window.location.origin,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return {
        success: false,
        data: { feedback: [], pagination: { total: 0, page: 1, limit, pages: 0 } },
        error: error instanceof Error ? error.message : "Failed to fetch feedback",
      };
    }
  },

  async submitFeedback(
    token: string,
    request: SubmitFeedbackRequest
  ): Promise<WidgetApiResponse<{ feedback: { id: string; content: string; votes: number; createdAt: string } }>> {
    try {
      const response = await fetch(`${apiStore.baseUrl}${API_ENDPOINTS.FEEDBACK}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Origin: window.location.origin,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return {
        success: false,
        data: { feedback: { id: "", content: "", votes: 0, createdAt: "" } },
        error: error instanceof Error ? error.message : "Failed to submit feedback",
      };
    }
  },

  async voteFeedback(
    token: string,
    request: VoteFeedbackRequest
  ): Promise<WidgetApiResponse<{ feedback: { id: string; content: string; votes: number; createdAt: string } }>> {
    try {
      const response = await fetch(`${apiStore.baseUrl}${API_ENDPOINTS.FEEDBACK}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Origin: window.location.origin,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error voting on feedback:", error);
      return {
        success: false,
        data: { feedback: { id: "", content: "", votes: 0, createdAt: "" } },
        error: error instanceof Error ? error.message : "Failed to vote on feedback",
      };
    }
  },
} as const;

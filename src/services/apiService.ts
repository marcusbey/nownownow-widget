import { type OrgInfoResponse, type WidgetComment, type WidgetPost } from '@/types/api';

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

// Function to fetch data with optional authentication
async function fetchData<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const fullUrl = getApiUrl(path);
    console.log(`Making request to ${path}`);
    
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
    
    // Add authorization header if token is provided
    if (token) {
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      headers.append('Authorization', formattedToken);
      console.log(`Added authorization token (preview): ${formattedToken.substring(0, 10)}...`);
    } else {
      console.log('No authentication token provided, proceeding as anonymous');
    }
    
    // Add any additional headers from options
    if (options.headers) {
      const optionHeaders = options.headers as Record<string, string>;
      Object.keys(optionHeaders).forEach(key => {
        const headerValue = optionHeaders[key];
        if (key.toLowerCase() !== 'authorization' && headerValue !== undefined) {
          headers.append(key, headerValue);
        }
      });
    }
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      const statusCode = response.status;
      let errorMessage = `Request failed: ${statusCode}`;
      
      // Handle specific error codes
      if (statusCode === 401) {
        errorMessage = 'Authentication failed: Invalid or expired token';
        console.error('Authentication error:', errorMessage);
      } else if (statusCode === 403) {
        errorMessage = 'Authorization failed: Insufficient permissions';
      }
      
      throw new Error(errorMessage);
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

// Function for authenticated requests (for backward compatibility)
async function fetchWithAuth<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    if (!token) {
      console.error('Missing authentication token');
      return { success: false, data: null, error: 'Missing authentication token' };
    }
    
    // Ensure token is properly formatted
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Log the token being used (first 10 chars only for security)
    const tokenPreview = formattedToken.substring(0, 16) + '...';
    console.log(`Making authenticated request to ${path} with token: ${tokenPreview}`);
    
    const fullUrl = getApiUrl(path);
    console.log(`Full URL: ${fullUrl}`);
    
    // Create headers with proper authorization
    const headers = new Headers({
      'Authorization': formattedToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
    
    // Add any additional headers from options
    if (options.headers) {
      const optionHeaders = options.headers as Record<string, string>;
      Object.keys(optionHeaders).forEach(key => {
        const headerValue = optionHeaders[key];
        if (key.toLowerCase() !== 'authorization' && headerValue !== undefined) { // Don't override authorization
          headers.append(key, headerValue);
        }
      });
    }
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      const statusCode = response.status;
      let errorMessage = `Request failed: ${statusCode}`;
      
      // Handle specific error codes
      if (statusCode === 401) {
        errorMessage = 'Authentication failed: Invalid or expired token';
        console.error('Authentication error:', errorMessage);
      } else if (statusCode === 403) {
        errorMessage = 'Authorization failed: Insufficient permissions';
      }
      
      throw new Error(errorMessage);
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

  getOrgPosts: (token: string, orgId: string, cursor?: string, limit: number = 10, options?: {
    includeComments?: boolean | string[],
  }): Promise<ApiResponse<{ posts: WidgetPost[], nextCursor?: string, hasMore: boolean }>> => {
    let url = `${apiStore.config.ENDPOINTS.WIDGET.ORG_POSTS}?orgId=${encodeURIComponent(orgId)}&limit=${limit}`;
    
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }
    
    // Handle includeComments parameter
    if (options?.includeComments) {
      if (options.includeComments === true) {
        url += '&includeComments=true';
      } else if (Array.isArray(options.includeComments) && options.includeComments.length > 0) {
        // If it's an array of post IDs, format it as a comma-separated list
        url += `&includeComments=${options.includeComments.join(',')}`;
      }
      console.log(`Fetching posts with comments for selective loading`);
    }
    
    return fetchWithAuth<{ posts: WidgetPost[], nextCursor?: string, hasMore: boolean }>(url, token);
  },

  /**
   * Track a post view when it becomes visible in the viewport
   * @param token - Authentication token
   * @param postId - ID of the post to track
   * @returns Promise with success status
   */
  trackPostView: async (token: string, postId: string) => {
    try {
      if (!postId) {
        console.error('Missing postId for view tracking');
        return { success: false, error: 'Missing postId' };
      }

      // Skip if already tracked in this session
      try {
        const viewedPosts = JSON.parse(sessionStorage.getItem('viewedPosts') || '[]');
        if (viewedPosts.includes(postId)) {
          console.log(`Post ${postId} already viewed in this session, skipping tracking`);
          return { success: true, data: { alreadyTracked: true } };
        }
        
        // Add to viewed posts
        viewedPosts.push(postId);
        sessionStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
      } catch (storageError) {
        // Continue even if sessionStorage fails
        console.warn('Session storage error:', storageError);
      }

      const response = await fetch(`${apiStore.baseUrl}/api/v1/widget/track-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error tracking post view:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to track view'
      };
    }
  },

  getPostComments: async (token: string | undefined, postId: string) => {
    try {
      // Validate post ID
      if (!postId) {
        console.error('Missing post ID for fetching comments');
        return { success: false, data: [], error: 'Missing post ID' };
      }
      
      // Comments API requires authentication - return early with clear error if no token
      if (!token) {
        console.log('No authentication token available for comments');
        return { success: false, data: [], error: 'Authentication required' };
      }
      
      // Get the full API URL
      const endpoint = apiStore.config.ENDPOINTS.WIDGET.POST_COMMENTS;
      const apiUrl = getApiUrl(endpoint);
      
      console.log(`Fetching comments from: ${apiUrl} for post ${postId} with authentication`);
      
      // Use fetchWithAuth since the API requires authentication
      const response = await fetchWithAuth<WidgetComment[]>(
        endpoint,
        token,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId })
        }
      );
      
      if (!response.success) {
        console.warn(`Failed to fetch comments for post ${postId}:`, response.error);
      } else {
        console.log(`Successfully fetched comments for post ${postId}`);
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error fetching comments for post ${postId}:`, errorMessage);
      return { success: false, data: [], error: errorMessage };
    }
  },

  addComment: async (token: string, postId: string, comment: string) => {
    try {
      const response = await fetchWithAuth(
        apiStore.config.ENDPOINTS.WIDGET.ADD_COMMENT,
        token,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, comment })
        }
      );
      return response;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  toggleLike: async (token: string, postId: string, isLiked: boolean) => {
    try {
      const response = await fetchWithAuth(
        apiStore.config.ENDPOINTS.WIDGET.TOGGLE_LIKE,
        token,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, isLiked })
        }
      );
      return response;
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
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
  /**
   * Track a post view
   * @param postId - The ID of the post to track a view for
   * @param token - Authentication token
   */
  async trackView(postId: string, token: string): Promise<WidgetApiResponse<{success: boolean; viewerId?: string}>> {
    try {
      if (!postId) {
        return { success: false, data: { success: false }, error: 'Missing postId' };
      }

      const response = await fetch(`${apiStore.baseUrl}${API_ENDPOINTS.WIDGET.TRACK_VIEW}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': window.location.origin,
        },
        body: JSON.stringify({ postId }),
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
      console.error('Error tracking view:', error);
      return {
        success: false,
        data: { success: false },
        error: error instanceof Error ? error.message : 'Failed to track view'
      };
    }
  },
} as const;

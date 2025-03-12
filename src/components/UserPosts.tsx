import { h } from 'preact';
import type { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { fetchUserPosts, formatDate } from '@/services/apiService';
import type { Post } from '@/types';

interface UserPostsProps {
  token: string;
  theme?: 'light' | 'dark';
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  _count?: {
    comments: number;
    likes: number;
  };
}

export function UserPosts({ token, theme = 'light' }: UserPostsProps): FunctionComponent {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPosts(cursor?: string): Promise<void> {
    try {
      const response = await fetchUserPosts(token, cursor);
      
      if (response.success && response.data) {
        setPosts(prev => cursor 
          ? [...prev, ...response.data.posts]
          : response.data.posts
        );
        setHasMore(response.data.hasMore);
        setNextCursor(response.data.nextCursor);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } catch (error) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [token, loadPosts]);

  if (isLoading && !posts.length) {
    return (
      <div class={`org-posts ${theme}`}>
        <div class="loading-skeleton">Loading posts...</div>
      </div>
    );
  }

  if (hasError && !posts.length) {
    return (
      <div class={`org-posts ${theme} error`}>
        Failed to load posts
      </div>
    );
  }

  return (
    <div class={`org-posts ${theme}`}>
      {posts.map(post => (
        <div key={post.id} class="post">
          <div class="post-header">
            <div class="post-meta">
              <span class="post-time">{formatDate(post.createdAt)}</span>
            </div>
          </div>
          
          <div class="post-content">{post.content}</div>
          
          {post.hashtags && post.hashtags.length > 0 && (
            <div class="hashtags">
              {post.hashtags.map(tag => (
                <span key={tag} class="hashtag">#{tag}</span>
              ))}
            </div>
          )}
          
          <div class="post-stats">
            <span class="stat">
              <span class="stat-icon">❤️</span>
              {post.likes}
            </span>
            <span class="stat">
              <span class="stat-icon">💬</span>
              {post.comments}
            </span>
          </div>
        </div>
      ))}

      {hasMore && (
        <button 
          class="load-more"
          onClick={() => loadPosts(nextCursor)}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load more'}
        </button>
      )}

      <style>{`
        .org-posts {
          padding: 1rem;
        }

        .post {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          transition: all 0.2s ease;
          border: 1px solid ${theme === 'light' ? '#e2e8f0' : '#2d3748'};
        }

        .light .post {
          background: #ffffff;
          color: #1a1a1a;
        }

        .dark .post {
          background: #1a1a1a;
          color: #ffffff;
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .post-time {
          font-size: 0.875rem;
          color: ${theme === 'light' ? '#718096' : '#a0aec0'};
        }

        .post-content {
          font-size: 0.9375rem;
          line-height: 1.5;
          margin-bottom: 0.75rem;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .hashtags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .hashtag {
          font-size: 0.875rem;
          color: #3182ce;
          cursor: pointer;
        }

        .hashtag:hover {
          text-decoration: underline;
        }

        .post-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: ${theme === 'light' ? '#4a5568' : '#a0aec0'};
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .stat-icon {
          font-size: 1rem;
        }

        .load-more {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 0.375rem;
          background: ${theme === 'light' ? '#e2e8f0' : '#2d3748'};
          color: inherit;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .load-more:hover:not(:disabled) {
          background: ${theme === 'light' ? '#cbd5e0' : '#4a5568'};
        }

        .load-more:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-skeleton {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${theme === 'light' ? '#f7fafc' : '#2d3748'};
          border-radius: 0.5rem;
          color: ${theme === 'light' ? '#718096' : '#a0aec0'};
        }

        .error {
          padding: 1rem;
          text-align: center;
          color: #e53e3e;
          background: ${theme === 'light' ? '#fff5f5' : '#2a2020'};
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}

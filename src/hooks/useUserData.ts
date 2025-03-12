import { useState, useEffect } from 'preact/hooks';
import { fetchOrgInfo, fetchUserPosts } from '@/services/apiService';
import type { User, Post } from '@/types/api';

interface UseUserDataResult {
  user: User | null;
  posts: Post[];
  isLoading: boolean;
  error: string | null;
}

export function useUserData(token: string): UseUserDataResult {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          fetchOrgInfo(token),
          fetchUserPosts(token),
        ]);

        if (!userResponse.success) {
          throw new Error(userResponse.error || 'Failed to fetch user data');
        }

        if (!postsResponse.success) {
          throw new Error(postsResponse.error || 'Failed to fetch posts');
        }

        setUser(userResponse.data);
        setPosts(postsResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      setUser(null);
      setPosts([]);
      setError(null);
    };
  }, [token]);

  return { user, posts, isLoading, error };
}

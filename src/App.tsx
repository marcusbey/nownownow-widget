import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface Props {
  theme?: 'light' | 'dark';
  userId: string;
  token: string;
}

interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

interface UserPost {
  id: string;
  content: string;
  createdAt: string;
}

export default function App({ theme = 'light', userId, token }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user info
        const userResponse = await fetch(
          `http://localhost:3000/api/widget/user-info?userId=${encodeURIComponent(userId)}`, 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
          }
        );
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          throw new Error(`User info failed: ${userResponse.status} ${userResponse.statusText} - ${errorText}`);
        }
        const userData = await userResponse.json();
        if (userData.user) {
          setUserInfo({
            id: userData.user.id,
            name: userData.user.name,
            avatar: userData.user.image,
            bio: userData.user.bio
          });
        }

        // Fetch user posts
        const postsResponse = await fetch(
          `http://localhost:3000/api/widget/user-posts?userId=${encodeURIComponent(userId)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
          }
        );

        if (!postsResponse.ok) {
          const errorText = await postsResponse.text();
          console.error('Posts response:', {
            status: postsResponse.status,
            statusText: postsResponse.statusText,
            headers: Object.fromEntries(postsResponse.headers.entries()),
            body: errorText
          });
          throw new Error(`Posts failed: ${postsResponse.status} ${postsResponse.statusText} - ${errorText || 'No response body'}`);
        }

        const postsData = await postsResponse.json();
        if (postsData.posts) {
          setPosts(postsData.posts);
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId, token]);

  if (isLoading) {
    return (
      <div class="panel-content loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div class={`panel-content ${theme} error`}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div class={`panel-content ${theme}`}>
      {userInfo && (
        <div class="user-info">
          {userInfo.avatar && (
            <img 
              src={userInfo.avatar} 
              alt={userInfo.name} 
              class="user-avatar"
            />
          )}
          <h2>{userInfo.name}</h2>
          {userInfo.bio && <p class="user-bio">{userInfo.bio}</p>}
        </div>
      )}
      
      <div class="posts-section">
        <h3>Latest Updates</h3>
        {posts.length > 0 ? (
          <div class="posts-list">
            {posts.map(post => (
              <div key={post.id} class="post-item">
                <p>{post.content}</p>
                <span class="post-date">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>No updates yet</p>
        )}
      </div>
    </div>
  );
}

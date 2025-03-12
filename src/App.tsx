import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { UserProfile } from './components/UserProfile';
import { PostCard } from './components/PostCard';
import { IntegrationTutorial } from './components/IntegrationTutorial';
import { api } from './services/apiService';
import { type WidgetOrgInfo, type WidgetPost, API_ENDPOINTS } from './types/api';
import './components/IntegrationTutorial.css';

interface Props {
  theme?: 'light' | 'dark';
  orgId: string;
  token: string;
}

export default function App({ theme = 'light', orgId, token }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setOrgInfo] = useState<WidgetOrgInfo | null>(null);
  const [posts, setPosts] = useState<WidgetPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'integration'>('feed');

  useEffect(() => {
    async function fetchData() {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          api.getOrgInfo(token, orgId),
          api.getUserPosts(token, orgId)
        ]);

        if (!userResponse.success) {
          throw new Error(userResponse.error || 'Failed to fetch user info');
        }

        if (!postsResponse.success) {
          throw new Error(postsResponse.error || 'Failed to fetch posts');
        }

        setOrgInfo(userResponse.data);
        setPosts(postsResponse.data ?? []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [orgId, token]);

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
      <div class="panel-tabs">
        <button 
          class={`panel-tab ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          Feed
        </button>
        <button 
          class={`panel-tab ${activeTab === 'integration' ? 'active' : ''}`}
          onClick={() => setActiveTab('integration')}
        >
          Integration
        </button>
      </div>
      
      {activeTab === 'feed' ? (
        <>
          <UserProfile userInfo={userInfo} theme={theme} />
          <div class="posts-section">
            <h3 class="section-title">Latest Updates</h3>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard
                  content={post.content}
                  createdAt={post.createdAt}
                  comments={post._count?.comments ?? 0}
                  likes={post._count?.likes ?? 0}
                  theme={theme}
                />
              ))
            ) : (
              <p>No updates yet</p>
            )}
          </div>
        </>
      ) : (
        <IntegrationTutorial 
          theme={theme} 
          orgId={orgId} 
          token={token} 
        />
      )}
    </div>
  );
}

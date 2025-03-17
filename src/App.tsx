import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { OrganizationProfile } from './components/OrganizationProfile';
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
  const [orgInfo, setOrgInfo] = useState<WidgetOrgInfo | null>(null);
  const [posts, setPosts] = useState<WidgetPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'integration'>('feed');

  useEffect(() => {
    async function fetchData() {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          api.getOrgInfo(token, orgId),
          api.getOrgPosts(token, orgId)
        ]);

        if (!userResponse.success) {
          throw new Error(userResponse.error || 'Failed to fetch user info');
        }

        if (!postsResponse.success) {
          throw new Error(postsResponse.error || 'Failed to fetch posts');
        }

        // Extract organization info from the response
        if (userResponse.data) {
          setOrgInfo(userResponse.data.organization);
        }
        
        // Extract posts from the response
        if (postsResponse.data && postsResponse.data.posts) {
          setPosts(postsResponse.data.posts);
        } else {
          setPosts([]);
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
  }, [orgId, token]);

  // Reference for scroll area
  const scrollAreaRef = { current: null as HTMLDivElement | null };
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div class={`w-full h-full flex flex-col items-center justify-center ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
        <div class={`w-8 h-8 border-2 rounded-full border-t-transparent animate-spin mb-4 ${isDark ? 'border-slate-600' : 'border-slate-300'}`}></div>
        <p class="text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div class={`w-full h-full flex flex-col items-center justify-center p-6 ${isDark ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
        <div class={`mb-4 p-3 rounded-full ${isDark ? 'bg-red-900/20' : 'bg-red-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" class={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <p class="text-center">{error}</p>
      </div>
    );
  }

  // Handle scroll event to show/hide scroll to top button
  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    setShowScrollTop(target.scrollTop > 300);
  };

  // Scroll to top function
  const scrollToTop = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll);
      return () => scrollArea.removeEventListener('scroll', handleScroll);
    }
    return undefined; // Explicit return for when scrollArea is null
  }, [activeTab]); // Re-add listener when tab changes

  return (
    <div class={`w-full h-full relative ${isDark ? 'bg-slate-900' : 'bg-slate-50'} text-xs`}>
      <div class={`flex border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <button 
          class={`px-3 py-2 text-xs transition-colors ${activeTab === 'feed' 
            ? (isDark ? 'text-white border-b border-blue-500' : 'text-slate-900 border-b border-blue-600') 
            : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')}`}
          onClick={() => setActiveTab('feed')}
        >
          Feed
        </button>
        <button 
          class={`px-3 py-2 text-xs transition-colors ${activeTab === 'integration' 
            ? (isDark ? 'text-white border-b border-blue-500' : 'text-slate-900 border-b border-blue-600') 
            : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')}`}
          onClick={() => setActiveTab('integration')}
        >
          Integration
        </button>
      </div>
      
      {activeTab === 'feed' ? (
        <>
          <OrganizationProfile orgInfo={orgInfo} theme={theme} />
          
          <div 
            class={`overflow-auto h-[calc(100%-100px)]`}
            ref={(el) => { scrollAreaRef.current = el; }}
          >
            <div class="p-3 space-y-2">
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    content={post.content}
                    createdAt={post.createdAt}
                    comments={post._count?.comments ?? 0}
                    likes={post._count?.likes ?? 0}
                    theme={theme}
                  />
                ))
              ) : (
                <p class={`text-center py-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No updates yet
                </p>
              )}
            </div>
          </div>
          
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              class={`absolute bottom-2 right-2 rounded-full p-1.5 shadow-sm transition-opacity duration-300 hover:opacity-80 ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}
              aria-label="Scroll to top"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          )}
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

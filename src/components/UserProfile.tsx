import { h } from 'preact';
import type { FunctionComponent } from 'preact';

import { fetchUserInfo } from '@/services/apiService';
import type { UserResponse } from '@/types';

interface UserProfileProps {
  token: string;
  theme?: 'light' | 'dark';
}

export function UserProfile({ token, theme = 'light' }: UserProfileProps): FunctionComponent {
  const [userInfo, setUserInfo] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  async function loadUserInfo(): Promise<void> {
    setIsLoading(true);
    try {
      const response = await fetchUserInfo(token);
      
      if (response.success && response.data) {
        setUserInfo(response.data);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUserInfo();
  }, [token]);

  if (isLoading) {
    return (
      <div class={`user-profile ${theme}`}>
        <div class="loading-skeleton">Loading...</div>
      </div>
    );
  }

  if (hasError || !userInfo) {
    return (
      <div class={`user-profile ${theme} error`}>
        Failed to load user information
      </div>
    );
  }

  const { user, stats } = userInfo;

  return (
    <div class={`user-profile ${theme}`}>
      <div class="profile-header">
        <div class="avatar-container">
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.displayName || user.name || 'User avatar'} 
              class="avatar"
            />
          ) : (
            <div class="avatar-placeholder">
              {(user.displayName || user.name || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div class="user-info">
          <h2 class="display-name">
            {user.displayName || user.name || 'Anonymous User'}
          </h2>
          {user.bio && <p class="bio">{user.bio}</p>}
          {user.websiteUrl && (
            <a 
              href={user.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="website"
            >
              {user.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-value">{stats.posts}</span>
          <span class="stat-label">Posts</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{stats.followers}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{stats.following}</span>
          <span class="stat-label">Following</span>
        </div>
      </div>

      <style>{`
        .user-profile {
          padding: 1.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .user-profile.light {
          background: #ffffff;
          color: #1a1a1a;
        }

        .user-profile.dark {
          background: #1a1a1a;
          color: #ffffff;
        }

        .profile-header {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .avatar-container {
          width: 64px;
          height: 64px;
          flex-shrink: 0;
        }

        .avatar, .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          background: #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .display-name {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .bio {
          margin: 0.5rem 0;
          font-size: 0.875rem;
          line-height: 1.5;
          color: ${theme === 'light' ? '#4a5568' : '#a0aec0'};
        }

        .website {
          display: inline-block;
          font-size: 0.875rem;
          color: #3182ce;
          text-decoration: none;
          margin-top: 0.25rem;
        }

        .website:hover {
          text-decoration: underline;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          padding: 1rem 0;
          border-top: 1px solid ${theme === 'light' ? '#e2e8f0' : '#2d3748'};
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1;
        }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: ${theme === 'light' ? '#718096' : '#a0aec0'};
          margin-top: 0.25rem;
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

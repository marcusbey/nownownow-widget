import { h } from 'preact';

interface UserInfo {
  id: string;
  name: string;
  image?: string;
  bio?: string;
  _count?: {
    followers: number;
  };
}

interface UserProfileProps {
  userInfo: UserInfo | null;
  theme?: 'light' | 'dark';
}

export function UserProfile({ userInfo, theme = 'light' }: UserProfileProps) {
  if (!userInfo) return null;

  return (
    <div class={`user-profile ${theme}`}>
      <div class="user-avatar-container">
        {userInfo.image ? (
          <img 
            src={userInfo.image} 
            alt={userInfo.name}
            class="user-avatar"
          />
        ) : (
          <div class="user-avatar-placeholder">
            {userInfo.name[0].toUpperCase()}
          </div>
        )}
      </div>
      <div class="user-info">
        <h2 class="user-name">{userInfo.name}</h2>
        <div class="user-meta">
          {userInfo._count?.followers || 0} followers
        </div>
      </div>
    </div>
  );
}

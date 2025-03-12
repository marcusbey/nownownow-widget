import { h, FunctionComponent } from 'preact';

type Theme = 'light' | 'dark';

interface UserInfo {
  id: string;
  name: string;
  image?: string | null;
  bio?: string | null;
  _count?: {
    followers: number;
  } | null;
}

interface UserProfileProps {
  userInfo: UserInfo | null;
  theme?: Theme;
}

const getInitial = (name: string): string => name.charAt(0).toUpperCase();

const getFollowerCount = (count: { followers: number } | null | undefined): number => count?.followers ?? 0;

export const UserProfile: FunctionComponent<UserProfileProps> = ({ userInfo, theme = 'light' }) => {
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
            {getInitial(userInfo.name)}
          </div>
        )}
      </div>
      <div class="org-info">
        <h2 class="user-name">{userInfo.name}</h2>
        {userInfo.bio && (
          <p class="user-bio">{userInfo.bio}</p>
        )}
        <div class="user-meta">
          {getFollowerCount(userInfo._count)} followers
        </div>
      </div>
    </div>
  );
}

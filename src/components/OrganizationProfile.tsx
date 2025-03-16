import { h, FunctionComponent } from 'preact';

type Theme = 'light' | 'dark';

interface OrgInfo {
  id: string;
  name: string;
  image?: string | null;
  bio?: string | null;
  _count?: {
    followers: number;
  } | null;
}

interface OrganizationProfileProps {
  orgInfo: OrgInfo | null;
  theme?: Theme;
}

const getInitial = (name: string): string => name.charAt(0).toUpperCase();

const getFollowerCount = (count: { followers: number } | null | undefined): number => count?.followers ?? 0;

export const OrganizationProfile: FunctionComponent<OrganizationProfileProps> = ({ orgInfo, theme = 'light' }) => {
  if (!orgInfo) return null;

  return (
    <div class={`org-profile ${theme}`}>
      <div class="org-avatar-container">
        {orgInfo.image ? (
          <img 
            src={orgInfo.image} 
            alt={orgInfo.name}
            class="org-avatar"
          />
        ) : (
          <div class="org-avatar-placeholder">
            {getInitial(orgInfo.name)}
          </div>
        )}
      </div>
      <div class="org-info">
        <h2 class="org-name">{orgInfo.name}</h2>
        {orgInfo.bio && (
          <p class="org-bio">{orgInfo.bio}</p>
        )}
        <div class="org-meta">
          {getFollowerCount(orgInfo._count)} followers
        </div>
      </div>
    </div>
  );
}

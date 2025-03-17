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

// No longer needed as we're using initials from the name split

const getFollowerCount = (count: { followers: number } | null | undefined): number => count?.followers ?? 0;

export const OrganizationProfile: FunctionComponent<OrganizationProfileProps> = ({ orgInfo, theme = 'light' }) => {
  if (!orgInfo) return null;
  
  const isDark = theme === 'dark';
  const initials = orgInfo.name.split(' ').map(n => n[0]).join('');
  const followerCount = getFollowerCount(orgInfo._count);

  return (
    <div className={`p-3 border-b sticky top-0 z-10 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {orgInfo.image ? (
            <img 
              src={orgInfo.image} 
              alt={orgInfo.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm bg-slate-100 text-slate-500 border border-slate-200">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-col">
            <h2 className="text-sm font-medium text-slate-900">{orgInfo.name}</h2>
            {orgInfo.bio && (
              <p className="text-xs text-slate-500">{orgInfo.bio}</p>
            )}
            {followerCount > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">{followerCount} followers</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

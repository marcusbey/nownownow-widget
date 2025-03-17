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
    <div class={`p-4 border-b sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
      <div class="flex items-center space-x-3">
        {orgInfo.image ? (
          <div class={`w-10 h-10 rounded-full overflow-hidden ring-1 ring-offset-1 ${isDark ? 'ring-blue-500/50 ring-offset-slate-900' : 'ring-blue-500/30 ring-offset-white'}`}>
            <img 
              src={orgInfo.image} 
              alt={orgInfo.name}
              class="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div class={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm ${isDark ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'}`}>
            {initials}
          </div>
        )}
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h2 class={`text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{orgInfo.name}</h2>
              {orgInfo.bio && (
                <p class={`text-xs mt-0.5 leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{orgInfo.bio}</p>
              )}
            </div>
            <div class={`flex items-center px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span class="text-xs">{followerCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

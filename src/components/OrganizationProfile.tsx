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
    <div class={`p-2 border-b sticky top-0 z-10 backdrop-blur-sm ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
      <div class="flex items-start space-x-2">
        <div class="flex-shrink-0 mt-1">
          {orgInfo.image ? (
            <img 
              src={orgInfo.image} 
              alt={orgInfo.name}
              class="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div class={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
              {initials}
            </div>
          )}
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h2 class={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{orgInfo.name}</h2>
              {orgInfo.bio && (
                <p class={`text-[10px] mt-0.5 leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{orgInfo.bio}</p>
              )}
            </div>
            {followerCount > 0 && (
              <div class={`flex items-center px-1.5 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-2 h-2 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <span class="text-[9px]">{followerCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

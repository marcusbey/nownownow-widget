import { h } from 'preact';
import type { FunctionComponent } from 'preact';

interface PostCardProps {
  content: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  theme?: 'light' | 'dark';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    if (diffInHours === 0) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    return `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString();
}

function formatHashtags(content: string): h.JSX.Element[] {
  const words = content.split(' ');
  return words.map((word, index) => {
    if (word.startsWith('#')) {
      return <span key={index} class="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer transition-colors">{word}</span>;
    }
    return <span key={index}>{word} </span>;
  });
}

export function PostCard({ content, createdAt, likes = 0, comments = 0, theme = 'light' }: PostCardProps): FunctionComponent {
  const isDark = theme === 'dark';
  
  return (
    <div class={`rounded-xl p-5 mb-4 transition-all duration-200 hover:-translate-y-0.5 ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}`}>
      <div class={`flex items-center gap-2 text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <span class="w-1 h-1 rounded-full bg-current opacity-50" />
        {formatTimeAgo(createdAt)}
      </div>
      
      <div class={`text-[15px] leading-relaxed mb-4 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        {formatHashtags(content)}
      </div>
      
      <div class={`flex gap-6 pt-3 ${isDark ? 'border-t border-slate-700/50' : 'border-t border-slate-200'}`}>
        <button class={`flex items-center gap-1.5 text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'}`}>
          <span class="text-lg">💬</span>
          {comments}
        </button>
        <button class={`flex items-center gap-1.5 text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-600'}`}>
          <span class="text-lg">❤️</span>
          {likes}
        </button>
      </div>
    </div>
  );
}

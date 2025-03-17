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

function sanitizeHtml(html: string): string {
  // Simple sanitization to prevent script injection
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

function renderContent(content: string): h.JSX.Element {
  // If the content appears to be HTML, render it as HTML
  if (content.includes('<') && content.includes('>')) {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} 
        class="post-content"
      />
    );
  }
  
  // Otherwise, handle it as plain text with hashtag formatting
  const words = content.split(' ');
  return (
    <div class="post-content">
      {words.map((word, index) => {
        if (word.startsWith('#')) {
          return <span key={index} class="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer transition-colors">{word} </span>;
        }
        return <span key={index}>{word} </span>;
      })}
    </div>
  );
}

export const PostCard: FunctionComponent<PostCardProps> = ({ content, createdAt, likes = 0, comments = 0, theme = 'light' }) => {
  const isDark = theme === 'dark';
  
  return (
    <div class={`rounded-lg p-3 ${isDark ? 'bg-slate-800/50 text-slate-200 hover:bg-slate-800' : 'bg-white text-slate-700 hover:bg-slate-50'} transition-colors shadow-sm`}>
      <div class={`flex justify-between items-center mb-2`}>
        <div class={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {formatTimeAgo(createdAt)}
        </div>
        
        <div class="flex items-center space-x-2">
          <div class={`flex items-center space-x-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="text-xs">{comments}</span>
          </div>
          
          <div class={`flex items-center space-x-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span class="text-xs">{likes}</span>
          </div>
        </div>
      </div>
      
      <div class={`${isDark ? 'text-slate-200' : 'text-slate-700'} text-xs leading-normal`}>
        {renderContent(content)}
      </div>
    </div>
  );
}

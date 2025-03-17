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
        className="post-content"
      />
    );
  }
  
  // Otherwise, handle it as plain text with hashtag formatting
  const words = content.split(' ');
  return (
    <div className="post-content">
      {words.map((word, index) => {
        if (word.startsWith('#')) {
          return <span key={index} className="text-blue-500 font-medium hover:underline cursor-pointer">{word} </span>;
        }
        return <span key={index}>{word} </span>;
      })}
    </div>
  );
}

export const PostCard: FunctionComponent<PostCardProps> = ({ content, createdAt, likes = 0, comments = 0, theme = 'light' }) => {
  const isDark = theme === 'dark';
  
  return (
    <div className={`border-b ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-100 text-slate-700'} pb-3 mb-3`}>
      <div className="mb-2">
        <div className="text-xs text-slate-500 mb-1">
          {formatTimeAgo(createdAt)}
        </div>
        
        <div className="text-sm leading-5">
          {renderContent(content)}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span className="text-xs">{likes}</span>
        </div>
        
        <div className="flex items-center space-x-1 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span className="text-xs">{comments}</span>
        </div>
      </div>
    </div>
  );
}

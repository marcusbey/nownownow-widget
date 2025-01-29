import { h } from 'preact';
import { X, MessageCircle, Bookmark } from 'lucide-preact';
import type { User, Post } from '../types';
import { cn } from '../utils/cn';

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  posts: Post[];
  position: 'left' | 'right';
  theme: 'light' | 'dark';
}

export function Panel({ isOpen, onClose, user, posts, position, theme }: PanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900',
          'transform transition-transform duration-300 ease-in-out',
          position === 'left' ? 'left-0' : 'right-0',
          theme === 'dark' ? 'dark' : ''
        )}
      >
        <div className="h-full flex flex-col">
          <header className="p-6 border-b dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">Now</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="font-bold dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.followers.toLocaleString()} followers
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {user.bio}
                  </p>
                </div>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-y-auto">
            {posts.map((post) => (
              <article
                key={post.id}
                className="p-6 border-b dark:border-gray-800"
              >
                <p className="text-gray-900 dark:text-white mb-4">
                  {post.content}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <time>{new Date(post.createdAt).toLocaleDateString()}</time>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {post.comments}
                  </div>
                  <div className="flex items-center gap-1">
                    <Bookmark className="w-4 h-4" />
                    {post.bookmarks}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
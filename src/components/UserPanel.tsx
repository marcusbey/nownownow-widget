import { h, FunctionComponent } from 'preact';
import type { User, Post } from '../types/api';

interface UserPanelProps {
  user: User;
  posts: Post[];
  theme: string;
}

export const UserPanel: FunctionComponent<UserPanelProps> = ({ user, posts, theme }) => {
  return (
    <div className={`user-panel ${theme}`}>
      <div className="org-info">
        {user.avatar && (
          <img 
            src={user.avatar} 
            alt={user.displayName || user.name}
            className="user-avatar" 
          />
        )}
        <div className="user-details">
          <h2>{user.displayName || user.name}</h2>
          {user.bio && <p className="user-bio">{user.bio}</p>}
          {user.status && <p className="user-status">{user.status}</p>}
          {user.followers !== undefined && (
            <p className="user-followers">{user.followers} followers</p>
          )}
        </div>
      </div>
      
      <div className="posts-container">
        {posts.map((post: Post) => (
          <div key={post.id} className="post">
            <p className="post-content">{post.content}</p>
            {post.attachments?.map((attachment: { type: string; url: string }, index: number) => {
              return attachment.type === 'image' ? (
                <img 
                  key={index}
                  src={attachment.url}
                  alt="Post attachment"
                  className="post-image"
                />
              ) : null;
            })}
            <div className="post-stats">
              {post._count && (
                <>
                  <span>{post._count.likes} likes</span>
                  <span>{post._count.comments} comments</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

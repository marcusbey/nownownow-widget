# Post API Guidelines for Widget Integration

## Overview

To properly display posts in the widget with user information, the backend API should include user information directly with each post, rather than requiring a separate API call.

## API Response Format

The `/api/v1/widget/org-posts` endpoint should include the author information with each post. Here's the recommended structure:

```typescript
interface PostResponse {
  id: string;
  content: string;
  title?: string;
  createdAt: string;
  isPinned: boolean;
  scheduledAt?: string;
  author: {
    id: string;
    name: string;
    image?: string | null;
    bio?: string | null;
  };
  comments?: CommentResponse[];
  media?: {
    id: string;
    url: string;
    type: string;
  }[];
  _count: {
    comments: number;
    likes: number;
    views: number;
  };
}
```

## Backend Implementation

When implementing the posts endpoint, you should include the user data by joining the User table. Here's an example of how to implement this with Prisma:

```typescript
// Example of fetching posts with user data using Prisma
const posts = await prisma.post.findMany({
  where: {
    organizationId: orgId,
    // Other filters...
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
      },
    },
    media: true,
    _count: {
      select: {
        comments: true,
        likes: true,
        views: true,
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
  take: limit,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
});

// Transform post data to expected format
const formattedPosts = posts.map((post) => ({
  id: post.id,
  content: post.content,
  title: post.title,
  createdAt: post.createdAt.toISOString(),
  isPinned: post.isPinned,
  scheduledAt: post.scheduledAt?.toISOString(),
  author: {
    id: post.user.id,
    name: post.user.name,
    image: post.user.image,
    bio: post.user.bio,
  },
  media: post.media.map((m) => ({
    id: m.id,
    url: m.url,
    type: m.type,
  })),
  _count: {
    comments: post._count.comments,
    likes: post._count.likes,
    views: post._count.views,
  },
}));
```

## Comments

Similarly, when returning comments, include the author information with each comment:

```typescript
interface CommentResponse {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image?: string | null;
  };
}
```

## Frontend Benefits

By including user data directly in the post response:

1. Eliminates the need for additional API calls
2. Simplifies the frontend code
3. Reduces network traffic
4. Improves performance
5. Results in a better user experience with faster loading

The current widget code is designed to handle user information from either the `author` or `user` field, so either naming convention can be used when sending the data from the backend.

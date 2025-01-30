# Now Widget (Preact)

## Overview

Now Widget is a modern, lightweight widget built with Preact and TypeScript that seamlessly integrates into any website to display user posts and information. It features an engaging animated button and a smooth sliding panel, providing an interactive and polished user experience.

## Features

### 1. Animated Now Button

The widget displays a floating circular button with sophisticated animations:

- **Dynamic Text Ring**: Features "NOW" text rotating around the button in a circular pattern
- **Interactive Animations**:
  - Default rotation speed: 6 seconds per revolution
  - Speeds up to 3 seconds per revolution on hover
  - Smooth scale transition on hover (110% scale)
- **Smart Visibility**:
  - Automatically hides when scrolling past 300px
  - Configurable position (left or right side)
  - Customizable button color
- **Accessibility**:
  - Keyboard navigable
  - ARIA labels for screen readers
  - High contrast text for readability (WIP)

### 2. Side Panel

A sleek sliding panel that displays user information and posts:

- **Smooth Transitions**:
  - Slides in from the configured side (left/right)
  - Overlay backdrop with fade effect
  - Smooth closing animations
- **User Profile Section**:
  - Profile picture
  - Display name
  - Follower count
  - Bio
- **Posts Feed**:
  - Scrollable post list
  - Post content
  - Timestamps
  - Engagement metrics (comments, bookmarks)
- **Theme Support**:
  - Light and dark mode
  - Automatic system preference detection
  - Runtime theme switching

### 3. Technical Features

- **State Management**:
  - Efficient state handling with Preact Signals
  - Centralized store for data management
  - Optimized re-renders
- **Performance**:
  - Lazy loading of panel content
  - Minimal bundle size with tree shaking
  - Optimized animations using CSS transforms
- **TypeScript Support**:
  - Full type safety
  - Comprehensive interfaces
  - Enhanced developer experience

## Installation

### 1. Install the package:

\`\`\`bash
npm install @your-org/now-widget
\`\`\`

### 2. Add to your website:

\`\`\`html
<script
  defer
  src="path/to/now-widget.js"
  data-user-id="user123"
  data-token="your-jwt-token"
  data-theme="light"
  data-position="right"
  data-button-color="#0066FF"
></script>
\`\`\`

## Configuration

The widget can be customized using data attributes:

| Attribute | Type | Description | Default |
|-----------|------|-------------|---------|
| data-user-id | string | User ID to fetch posts for | Required |
| data-token | string | JWT authentication token | Required |
| data-theme | 'light' \| 'dark' | Widget theme | 'light' |
| data-position | 'left' \| 'right' | Button and panel position | 'right' |
| data-button-color | string | Button background color (hex/rgb) | '#0066FF' |

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd now-widget
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Start development server:
\`\`\`bash
npm run dev
\`\`\`

### Building

Build for production:
\`\`\`bash
npm run build
\`\`\`

## Architecture

### Component Structure

\`\`\`
src/
├── components/
│   ├── NowButton.tsx    # Animated floating button
│   └── Panel.tsx        # Sliding panel component
├── store.ts            # State management using signals
├── types.ts           # TypeScript interfaces
└── Widget.tsx         # Main widget component
\`\`\`

### State Management

The widget uses Preact Signals for efficient state management:

- **WidgetStore**: Central store managing:
  - Panel visibility state
  - User data
  - Posts data
  - Loading states
  - Error handling

### Event Handling

- **Panel Toggle**: Managed through store actions
- **Scroll Detection**: Automatic button visibility
- **Click Outside**: Panel auto-close
- **Keyboard Navigation**: ESC key support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Chrome for Android

## License

MIT

## Support

For issues and feature requests, please open an issue on the repository.
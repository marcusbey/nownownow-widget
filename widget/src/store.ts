import { Signal, signal } from '@preact/signals';
import type { User, Post, WidgetConfig } from './types';

class WidgetStore {
  config: WidgetConfig;
  isOpen: Signal<boolean>;
  user: Signal<User | null>;
  posts: Signal<Post[]>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.isOpen = signal(false);
    this.user = signal(null);
    this.posts = signal([]);
    this.isLoading = signal(false);
    this.error = signal(null);
  }

  async fetchData() {
    try {
      this.isLoading.value = true;
      this.error.value = null;

      // Simulate API calls - replace with actual API endpoints
      const userData = await fetch(`/api/users/${this.config.userId}`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`
        }
      }).then(res => res.json());

      const postsData = await fetch(`/api/users/${this.config.userId}/posts`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`
        }
      }).then(res => res.json());

      this.user.value = userData;
      this.posts.value = postsData;
    } catch (err) {
      this.error.value = 'Failed to load data';
      console.error(err);
    } finally {
      this.isLoading.value = false;
    }
  }

  togglePanel() {
    this.isOpen.value = !this.isOpen.value;
    if (this.isOpen.value && !this.user.value) {
      this.fetchData();
    }
  }
}
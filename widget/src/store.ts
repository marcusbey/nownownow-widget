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

      const { VITE_API_URL = 'http://localhost:3000' } = import.meta.env;
      const API_VERSION = '/api/v1';
      const API_ENDPOINTS = {
        USER_INFO: '/widget/user-info',
        USER_POSTS: '/widget/user-posts'
      } as const;

      const headers = {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      } as const;

      const fetchOptions = {
        headers,
        mode: 'cors' as const,
        credentials: 'omit' as const
      };

      const [userData, postsData] = await Promise.all([
        fetch(`${VITE_API_URL}${API_VERSION}${API_ENDPOINTS.USER_INFO}?userId=${encodeURIComponent(this.config.userId)}`, fetchOptions)
          .then(async res => {
            if (!res.ok) throw new Error(`User info failed: ${res.status}`);
            return res.json();
          }),

        fetch(`${VITE_API_URL}${API_VERSION}${API_ENDPOINTS.USER_POSTS}?userId=${encodeURIComponent(this.config.userId)}`, fetchOptions)
          .then(async res => {
            if (!res.ok) throw new Error(`Posts failed: ${res.status}`);
            return res.json();
          })
      ]);

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
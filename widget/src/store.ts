import { Signal, signal } from '@preact/signals';
import type { Organization, Post, WidgetConfig } from './types';
import { apiStore } from '../../src/config/api';

class WidgetStore {
  config: WidgetConfig;
  isOpen: Signal<boolean>;
  organization: Signal<Organization | null>;
  posts: Signal<Post[]>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.isOpen = signal(false);
    this.organization = signal(null);
    this.posts = signal([]);
    this.isLoading = signal(false);
    this.error = signal(null);
  }

  async fetchData() {
    try {
      this.isLoading.value = true;
      this.error.value = null;

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

      const { config } = apiStore;
      const [orgData, postsData] = await Promise.all([
        fetch(`${apiStore.baseUrl}${config.VERSION}${config.ENDPOINTS.WIDGET.ORG_INFO}?orgId=${encodeURIComponent(this.config.orgId)}`, fetchOptions)
          .then(async res => {
            if (!res.ok) throw new Error(`User info failed: ${res.status}`);
            return res.json();
          }),

        fetch(`${apiStore.baseUrl}${config.VERSION}${config.ENDPOINTS.WIDGET.ORG_POSTS}?orgId=${encodeURIComponent(this.config.orgId)}`, fetchOptions)
          .then(async res => {
            if (!res.ok) throw new Error(`Posts failed: ${res.status}`);
            return res.json();
          })
      ]);

      this.organization.value = orgData;
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
    if (this.isOpen.value && !this.organization.value) {
      this.fetchData();
    }
  }
}
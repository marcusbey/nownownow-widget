// Define the API configuration type for type safety
interface ApiConfig {
  readonly VERSION: string;
  readonly ENDPOINTS: {
    readonly WIDGET: {
      readonly ORG_INFO: string;
      readonly ORG_POSTS: string;
    };
  };
}

// Create a mutable store for runtime configuration
type ApiStore = {
  config: ApiConfig;
  baseUrl: string;
};

// Initialize with default values
export const apiStore: ApiStore = {
  baseUrl: 'http://localhost:3000',
  config: {
    VERSION: '/api/v1',
    ENDPOINTS: {
      WIDGET: {
        ORG_INFO: '/widget/org-info',
        ORG_POSTS: '/widget/org-posts'
      }
    }
  }
};

// Safe way to update the base URL at runtime
export function updateApiConfig(baseUrl: string): void {
  apiStore.baseUrl = baseUrl;
}

// Type-safe URL builder
export function getApiUrl(path: string): string {
  return `${apiStore.baseUrl}${apiStore.config.VERSION}${path}`;
}

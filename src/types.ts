export interface WidgetProps {
  // Add any widget-specific props here
  theme?: 'light' | 'dark';
  locale?: string;
}

export interface MountOptions {
  target: HTMLElement;
  props?: WidgetProps;
}

export interface WidgetInstance {
  unmount: () => Promise<void>;
}

export type MountFunction = (options: MountOptions) => WidgetInstance;

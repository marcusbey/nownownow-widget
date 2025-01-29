export interface WidgetProps {
  // Add any widget-specific props here
  locale?: string;
}

export interface MountOptions {
  target: HTMLElement;
  props?: WidgetProps;
}

export interface WidgetInstance {
  unmount: () => void;
}

export type MountFunction = (options: MountOptions) => WidgetInstance;

export interface WidgetConfig {
  userId: string;
  token: string;
  theme?: 'light' | 'dark';
  position?: 'right' | 'left';
  buttonColor?: string;
  buttonSize?: number;
}

export interface ButtonConfig {
  position?: 'right' | 'left';
  size?: number;
  theme?: 'light' | 'dark';
  color?: string;
}

export const defaultButtonConfig = {
  position: 'right',
  size: 60,
  theme: 'light',
  color: '#000000',
} as const;

export type Position = typeof defaultButtonConfig.position;
export type Theme = typeof defaultButtonConfig.theme;

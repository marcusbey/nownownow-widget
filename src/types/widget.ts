// Widget position and theme types
export type WidgetPosition = 'left' | 'right';
export type WidgetTheme = 'light' | 'dark';
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg';

export interface WidgetConfig {
  orgId: string;
  token: string;
  theme?: WidgetTheme;
  position?: WidgetPosition;
  buttonColor?: string;
  buttonSize?: number;
  apiUrl?: string;
}

import { Signal } from '@preact/signals';

export interface WidgetStateData {
  initialized: boolean;
  instance: WidgetInstance | null;
  config: WidgetConfig | null;
  mountAttempts: number;
  maxAttempts: number;
  initializationPromise: Promise<void> | null;
  lastPathChecked: string;
  // Use number type for better cross-environment compatibility
  // This allows the widget to work in both browser and Node.js environments
  pollIntervalId?: number | undefined;
}

export type WidgetState = Signal<WidgetStateData>;

export interface WidgetInstance {
  unmount: () => void;
}

export interface WidgetProps {
  theme: WidgetTheme;
  orgId: string;
  token: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export interface NowButtonProps {
  size: string;
  color: string;
  position: WidgetPosition;
  onClick: () => void;
  isOpen?: boolean;
  isVisible?: boolean;
  updated?: boolean;
  sizeVariant?: SizeVariant;
}

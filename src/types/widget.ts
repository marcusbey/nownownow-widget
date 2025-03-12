// Widget position and theme types
export type WidgetPosition = 'left' | 'right';
export type WidgetTheme = 'light' | 'dark';

export interface WidgetConfig {
  orgId: string;
  token: string;
  theme?: WidgetTheme;
  position?: WidgetPosition;
  buttonColor?: string;
  buttonSize?: number;
}

import { Signal } from '@preact/signals';

export interface WidgetStateData {
  initialized: boolean;
  instance: WidgetInstance | null;
  config: WidgetConfig | null;
  mountAttempts: number;
  maxAttempts: number;
  initializationPromise: Promise<void> | null;
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

export interface SpinningButtonProps {
  size: string;
  color: string;
  position: WidgetPosition;
  onClick: () => void;
  isOpen?: boolean;
  isVisible?: boolean;
}

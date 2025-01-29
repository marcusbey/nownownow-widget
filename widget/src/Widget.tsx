import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { NowButton } from './components/NowButton';
import { Panel } from './components/Panel';
import { WidgetStore } from './store';
import type { WidgetConfig } from './types';

interface Props {
  config: WidgetConfig;
}

export function Widget({ config }: Props) {
  const store = new WidgetStore(config);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && store.isOpen.value) {
        store.isOpen.value = false;
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [store]);

  return (
    <>
      <NowButton
        color={config.buttonColor}
        onClick={() => store.togglePanel()}
        position={config.position}
      />
      <Panel
        isOpen={store.isOpen.value}
        onClose={() => store.isOpen.value = false}
        user={store.user.value}
        posts={store.posts.value}
        position={config.position}
        theme={config.theme}
      />
    </>
  );
}
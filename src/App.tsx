import { useUserData } from './hooks/useUserData';
import { UserPanel } from './components/UserPanel';
import { RotatingButton } from './components/RotatingButton';
import type { WidgetConfig } from './types/api';
import styles from './App.module.css';

export default function App({ theme = 'light', locale = 'en' }: WidgetConfig) {
  const token = document.currentScript?.getAttribute('data-token') || '';
  const { user, posts, isLoading, error } = useUserData(token);

  if (isLoading) {
    return (
      <div className={styles['now-widget-loading']}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['now-widget-error']}>
        <p>{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles['now-widget-error']}>
        <p>No user data available</p>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <RotatingButton />
      <UserPanel user={user} posts={posts} theme={theme} />
    </div>
  );
}

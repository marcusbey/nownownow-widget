import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface Props {
  theme?: 'light' | 'dark';
}

export default function App({ theme = 'light' }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div class="panel-content loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div class={`panel-content ${theme}`}>
      <h1>Now Panel</h1>
      <p>Your content here...</p>
    </div>
  );
}

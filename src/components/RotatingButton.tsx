import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import styles from './RotatingButton.module.css';

export function RotatingButton() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const text = 'now . ';
    const repeatedText = text.repeat(3); // "now . now . now . "
    if (textRef.current) {
      textRef.current.innerHTML = repeatedText;
    }
  }, []);

  return (
    <button className={styles['rotating-button']}>
      <div className={styles['rotating-text']} ref={textRef}></div>
    </button>
  );
}

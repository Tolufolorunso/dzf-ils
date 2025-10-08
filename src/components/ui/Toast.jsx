import { useEffect } from 'react';
import styles from './style.module.css';

export default function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) {
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return <div className={`${styles.toast} ${styles[type]}`}>{message}</div>;
}

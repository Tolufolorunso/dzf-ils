import styles from './style.module.css';

export default function Alert({ type = 'info', message, onClose }) {
  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      <span className={styles.alertMessage}>{message}</span>
      {onClose && (
        <button onClick={onClose} className={styles.alertClose}>
          ✕
        </button>
      )}
    </div>
  );
}

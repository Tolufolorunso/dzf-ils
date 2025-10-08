import styles from './style.module.css';

export default function Avatar({
  src,
  initial = 'DZ',
  alt = 'Avatar',
  size = 'md',
}) {
  return (
    <div className={`${styles.avatar} ${styles[size]}`}>
      {src ? (
        <img src={src} alt={alt} className={styles.avatarImg} />
      ) : (
        <span className={styles.avatarFallback}>{initial}</span>
      )}
    </div>
  );
}

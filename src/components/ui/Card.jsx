import styles from './style.module.css';

export default function Card({ title, children, footer }) {
  return (
    <div className={styles.card}>
      {title && <div className={styles.cardHeader}>{title}</div>}
      <div className={styles.cardBody}>{children}</div>
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  );
}

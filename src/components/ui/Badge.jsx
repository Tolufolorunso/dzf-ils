import styles from './style.module.css';

export default function Badge({ label, variant = 'default' }) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{label}</span>;
}

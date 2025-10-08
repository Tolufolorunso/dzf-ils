import styles from './style.module.css';

export default function Loader({ size = 'medium' }) {
  return <div className={`${styles.loader} ${styles[size]}`}></div>;
}

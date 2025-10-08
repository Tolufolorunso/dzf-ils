import styles from './stats.module.css'

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend = null,
}) {
  return (
    <div className={`${styles.statsCard} ${styles[color]}`}>
      <div className={styles.statsIcon}>{icon}</div>
      <div className={styles.statsContent}>
        <div className={styles.statsValue}>{value}</div>
        <div className={styles.statsTitle}>{title}</div>
        {subtitle && <div className={styles.statsSubtitle}>{subtitle}</div>}
        {trend && (
          <div className={`${styles.statsTrend} ${styles[trend.type]}`}>
            {trend.icon} {trend.value}
          </div>
        )}
      </div>
    </div>
  )
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './StudentNav.module.css';

export default function StudentNav() {
  const pathname = usePathname();

  const studentPages = [
    { href: '/submit-summary', label: '📝 Submit Summary', icon: '📝' },
    { href: '/leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
    { href: '/transcomm', label: '👑 TRANSCOMM', icon: '👑' },
  ];

  return (
    <nav className={styles.studentNav}>
      <div className={styles.navContainer}>
        <div className={styles.navBrand}>
          <span className={styles.brandIcon}>📚</span>
          <span className={styles.brandText}>Student Portal</span>
        </div>

        <div className={styles.navLinks}>
          {studentPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className={`${styles.navLink} ${
                pathname === page.href ? styles.active : ''
              }`}
            >
              <span className={styles.linkIcon}>{page.icon}</span>
              <span className={styles.linkText}>{page.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

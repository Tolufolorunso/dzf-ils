'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import NavigationLoader from '@/components/ui/NavigationLoader';
import styles from './layout.module.css';

export default function MainLayout({ children }) {
  const pathname = usePathname();

  // Don't show header/footer on auth pages and student-only pages
  const isAuthPage = pathname?.startsWith('/auth');
  const isStudentPage =
    (pathname?.startsWith('/submit-summary') ||
      pathname?.startsWith('/leaderboard') ||
      pathname?.startsWith('/transcomm')) &&
    !pathname?.startsWith('/transcomm/manage');

  if (isAuthPage || isStudentPage) {
    return (
      <>
        <NavigationLoader />
        {children}
      </>
    );
  }

  return (
    <div className={styles.mainLayout}>
      <NavigationLoader />
      <Header />
      <main className={styles.mainContent}>{children}</main>
      <Footer />
    </div>
  );
}

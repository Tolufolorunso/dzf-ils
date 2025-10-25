'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import NavigationLoader from '@/components/ui/NavigationLoader';
import styles from './layout.module.css';

export default function MainLayout({ children }) {
  const pathname = usePathname();

  // Don't show header/footer on auth pages
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
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

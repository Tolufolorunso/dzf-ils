'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './NavigationLoader.module.css';

export default function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let progressTimer;
    let loadingTimer;

    const startLoading = () => {
      setLoading(true);
      setProgress(0);

      // Simulate progress
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 100);
    };

    const stopLoading = () => {
      setProgress(100);
      loadingTimer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    };

    // Listen for navigation events
    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.href) {
        const targetUrl = new URL(target.href);
        const currentUrl = new URL(window.location.href);

        // Only show loader for different pages
        if (
          targetUrl.pathname !== currentUrl.pathname &&
          targetUrl.origin === currentUrl.origin
        ) {
          startLoading();
        }
      }
    };

    // Listen for form submissions
    const handleFormSubmit = (e) => {
      const form = e.target;
      if (form.method === 'get' || form.action) {
        startLoading();
      }
    };

    // Listen for browser back/forward
    const handlePopState = () => {
      startLoading();
    };

    document.addEventListener('click', handleLinkClick);
    document.addEventListener('submit', handleFormSubmit);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick);
      document.removeEventListener('submit', handleFormSubmit);
      window.removeEventListener('popstate', handlePopState);
      if (progressTimer) clearInterval(progressTimer);
      if (loadingTimer) clearTimeout(loadingTimer);
    };
  }, []);

  // Stop loading when pathname changes (page loaded)
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, loading]);

  if (!loading) return null;

  return (
    <div className={styles.navigationLoader}>
      <div className={styles.loaderBar} style={{ width: `${progress}%` }}></div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import styles from './layout.module.css';

function LogoMark() {
  return (
    <svg
      viewBox='0 0 24 24'
      className={styles.logoMark}
      aria-hidden='true'
      focusable='false'
    >
      <path
        d='M4 5.5C4 4.67 4.67 4 5.5 4H10v14H5.5A1.5 1.5 0 0 0 4 19.5V5.5Zm16 0V19.5A1.5 1.5 0 0 0 18.5 18H14V4h4.5c.83 0 1.5.67 1.5 1.5Z'
        fill='currentColor'
      />
      <path d='M11.25 4h1.5v14h-1.5z' fill='currentColor' />
    </svg>
  );
}

function ChevronIcon({ open = false }) {
  return (
    <svg
      viewBox='0 0 20 20'
      className={`${styles.chevronIcon} ${open ? styles.chevronOpen : ''}`}
      aria-hidden='true'
      focusable='false'
    >
      <path
        d='M5.5 7.5L10 12l4.5-4.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setOpenMobileSection('');
    setIsStaffDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => {
      const next = !prev;
      if (!next) {
        setOpenMobileSection('');
      }
      return next;
    });
  };

  const toggleStaffDropdown = () => {
    setIsStaffDropdownOpen(!isStaffDropdownOpen);
  };

  const toggleMobileSection = (sectionName) => {
    setOpenMobileSection((prev) => (prev === sectionName ? '' : sectionName));
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setOpenMobileSection('');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (user) => {
    if (!user) return 'DZ';
    let [first, last] = user?.name.split(' ');
    first = first?.charAt(0) || '';
    last = last?.surname?.charAt(0) || '';
    return (first + last).toUpperCase() || 'DZ';
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.headerContent}>
          <Link href='/' className={styles.logo} onClick={closeMobileMenu}>
            <div className={styles.logoIcon}>
              <LogoMark />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>DZUELS</span>
              <span className={styles.logoSubtitle}>Library System</span>
            </div>
          </Link>

          <nav
            id='main-navigation'
            className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}
          >
            <Link
              href='/dashboard'
              className={styles.navLink}
              onClick={closeMobileMenu}
            >
              Dashboard
            </Link>
            {!loading && user?.role === 'admin' && (
              <Link href='/admin' className={styles.navLink} onClick={closeMobileMenu}>
                Admin
              </Link>
            )}

            <div className={styles.dropdown}>
              <button
                className={styles.dropdownButton}
                onClick={() => toggleMobileSection('catalogs')}
                type='button'
              >
                Catalogs{' '}
                <span className={styles.dropdownArrow}>
                  <ChevronIcon open={openMobileSection === 'catalogs'} />
                </span>
              </button>
              <div
                className={`${styles.dropdownContent} ${
                  openMobileSection === 'catalogs' ? styles.mobileDropdownOpen : ''
                }`}
              >
                <Link href='/catalog' className={styles.dropdownLink} onClick={closeMobileMenu}>
                  Catalogs
                </Link>
                <Link
                  href='/catalog/new'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  New Catalog
                </Link>
              </div>
            </div>

            <div className={styles.dropdown}>
              <button
                className={styles.dropdownButton}
                onClick={() => toggleMobileSection('circulation')}
                type='button'
              >
                Circulation{' '}
                <span className={styles.dropdownArrow}>
                  <ChevronIcon open={openMobileSection === 'circulation'} />
                </span>
              </button>
              <div
                className={`${styles.dropdownContent} ${
                  openMobileSection === 'circulation' ? styles.mobileDropdownOpen : ''
                }`}
              >
                <Link
                  href='/circulations/checkout'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Checkout
                </Link>
                <Link
                  href='/circulations/checkin'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Check-in
                </Link>
                <Link
                  href='/circulations/summaries'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Book Summaries
                </Link>
                <Link
                  href='/circulations/summaries/review'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Review Summaries
                </Link>
                <Link
                  href='/circulations/holds'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Holds
                </Link>
                <Link
                  href='/circulations/overdues'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Overdues
                </Link>
                <Link
                  href='/circulations/renewal'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Renewal
                </Link>
              </div>
            </div>

            <div className={styles.dropdown}>
              <button
                className={styles.dropdownButton}
                onClick={() => toggleMobileSection('patrons')}
                type='button'
              >
                Patrons{' '}
                <span className={styles.dropdownArrow}>
                  <ChevronIcon open={openMobileSection === 'patrons'} />
                </span>
              </button>
              <div
                className={`${styles.dropdownContent} ${
                  openMobileSection === 'patrons' ? styles.mobileDropdownOpen : ''
                }`}
              >
                <Link href='/patrons' className={styles.dropdownLink} onClick={closeMobileMenu}>
                  List Patrons
                </Link>
                <Link
                  href='/patrons/new'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  New Patron
                </Link>
                <Link
                  href='/patrons/generate-barcode'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Generate Barcode
                </Link>
              </div>
            </div>

            <div className={styles.dropdown}>
              <button
                className={styles.dropdownButton}
                onClick={() => toggleMobileSection('activities')}
                type='button'
              >
                Activities{' '}
                <span className={styles.dropdownArrow}>
                  <ChevronIcon open={openMobileSection === 'activities'} />
                </span>
              </button>
              <div
                className={`${styles.dropdownContent} ${
                  openMobileSection === 'activities' ? styles.mobileDropdownOpen : ''
                }`}
              >
                <Link
                  href='/attendance'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Mark Attendance
                </Link>
                <Link
                  href='/analytics'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Analytics & Leaderboard
                </Link>
                <Link
                  href='/transcomm/manage'
                  className={styles.dropdownLink}
                  onClick={closeMobileMenu}
                >
                  Manage TRANSCOMM
                </Link>
              </div>
            </div>
          </nav>

          <div className={styles.headerActions}>
            {!loading && user && (
              <div className={styles.staffDropdown}>
                <button
                  className={styles.staffButton}
                  onClick={toggleStaffDropdown}
                  onMouseEnter={() => setIsStaffDropdownOpen(true)}
                >
                  <Avatar size='sm'>
                    {user?.image_url ? (
                      <img
                        src={user?.image_url}
                        alt={`${user?.name}`}
                        className='avatar-img'
                      />
                    ) : (
                      <div className='avatar-fallback'>{getInitials(user)}</div>
                    )}
                  </Avatar>
                  <div className={styles.staffInfo}>
                    <span className={styles.staffName}>{user?.name}</span>
                    <span className={styles.staffRole}>{user?.role}</span>
                  </div>
                  <span className={styles.dropdownArrow}>
                    <ChevronIcon open={isStaffDropdownOpen} />
                  </span>
                </button>

                {isStaffDropdownOpen && (
                  <div
                    className={styles.staffDropdownContent}
                    onMouseLeave={() => setIsStaffDropdownOpen(false)}
                  >
                    <div className={styles.staffDropdownHeader}>
                      <Avatar size='md'>
                        {user?.image_url ? (
                          <img
                            src={user?.image_url}
                            alt={`${user?.name}`}
                            className='avatar-img'
                          />
                        ) : (
                          <div className='avatar-fallback'>{getInitials(user)}</div>
                        )}
                      </Avatar>
                      <div className={styles.staffDropdownInfo}>
                        <div className={styles.staffDropdownName}>{user?.name}</div>
                        <div className={styles.staffDropdownRole}>{user?.role}</div>
                      </div>
                    </div>
                    <div className={styles.staffDropdownDivider}></div>
                    <p className={styles.staffDropdownLink}>{getInitials(user)}</p>
                    <button className={styles.staffDropdownLink} onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className={styles.mobileMenuButton}
            onClick={toggleMenu}
            aria-label='Toggle menu'
            aria-expanded={isMenuOpen}
            aria-controls='main-navigation'
          >
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <button
          type='button'
          className={styles.mobileNavBackdrop}
          onClick={closeMobileMenu}
          aria-label='Close menu overlay'
        />
      )}
    </header>
  );
}

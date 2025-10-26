'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import styles from './layout.module.css';

export default function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleStaffDropdown = () => {
    setIsStaffDropdownOpen(!isStaffDropdownOpen);
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
          <Link href='/' className={styles.logo}>
            <div className={styles.logoIcon}>📚</div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>DZUELS</span>
              <span className={styles.logoSubtitle}>Library System</span>
            </div>
          </Link>

          <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
            <Link href='/dashboard' className={styles.navLink}>
              Dashboard
            </Link>
            <div className={styles.dropdown}>
              <button className={styles.dropdownButton}>
                Catalogs <span className={styles.dropdownArrow}>▼</span>
              </button>
              <div className={styles.dropdownContent}>
                <Link href='/catalog' className={styles.dropdownLink}>
                  Catalogs
                </Link>
                <Link href='/catalog/new' className={styles.dropdownLink}>
                  New Catalog
                </Link>
              </div>
            </div>
            <div className={styles.dropdown}>
              <button className={styles.dropdownButton}>
                Circulation <span className={styles.dropdownArrow}>▼</span>
              </button>
              <div className={styles.dropdownContent}>
                <Link
                  href='/circulations/checkout'
                  className={styles.dropdownLink}
                >
                  Checkout
                </Link>
                <Link
                  href='/circulations/checkin'
                  className={styles.dropdownLink}
                >
                  Check-in
                </Link>
                <Link
                  href='/circulations/summaries'
                  className={styles.dropdownLink}
                >
                  Book Summaries
                </Link>
                <Link
                  href='/circulations/summaries/review'
                  className={styles.dropdownLink}
                >
                  Review Summaries
                </Link>
                <Link
                  href='/circulations/holds'
                  className={styles.dropdownLink}
                >
                  Holds
                </Link>
                <Link
                  href='/circulations/overdues'
                  className={styles.dropdownLink}
                >
                  Overdues
                </Link>
                <Link
                  href='/circulations/renewal'
                  className={styles.dropdownLink}
                >
                  Renewal
                </Link>
              </div>
            </div>
            <div className={styles.dropdown}>
              <button className={styles.dropdownButton}>
                Patrons <span className={styles.dropdownArrow}>▼</span>
              </button>
              <div className={styles.dropdownContent}>
                <Link href='/patrons' className={styles.dropdownLink}>
                  List Patrons
                </Link>
                <Link href='/patrons/new' className={styles.dropdownLink}>
                  New Patron
                </Link>
                <Link
                  href='/patrons/generate-barcode'
                  className={styles.dropdownLink}
                >
                  Generate Barcode
                </Link>
              </div>
            </div>
            <div className={styles.dropdown}>
              <button className={styles.dropdownButton}>
                Activities <span className={styles.dropdownArrow}>▼</span>
              </button>
              <div className={styles.dropdownContent}>
                <Link href='/attendance' className={styles.dropdownLink}>
                  Mark Attendance
                </Link>
                <Link href='/analytics' className={styles.dropdownLink}>
                  Analytics & Leaderboard
                </Link>
                <Link href='/transcomm/manage' className={styles.dropdownLink}>
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
                  <span className={styles.dropdownArrow}>▼</span>
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
                          <div className='avatar-fallback'>
                            {getInitials(user)}
                          </div>
                        )}
                      </Avatar>
                      <div className={styles.staffDropdownInfo}>
                        <div className={styles.staffDropdownName}>
                          {user?.name}
                        </div>
                        <div className={styles.staffDropdownRole}>
                          {user?.role}
                        </div>
                      </div>
                    </div>
                    <div className={styles.staffDropdownDivider}></div>
                    <p className={styles.staffDropdownLink}>
                      {getInitials(user)}
                    </p>
                    <button
                      className={styles.staffDropdownLink}
                      onClick={handleLogout}
                    >
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
          >
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
          </button>
        </div>
      </div>
    </header>
  );
}

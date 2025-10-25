'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import StatsCard from '@/components/ui/StatsCard';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      if (data.status) {
        setDashboardData(data.data);
      } else {
        setError(data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Library Management Dashboard</h1>
        <p className={styles.dashboardSubtitle}>
          Welcome to the Dzuels Library Management System! Dzuels-ILS is a
          web-based library management system designed to simplify the process
          of managing library resources and patrons.
        </p>
        {dashboardData && (
          <div className={styles.refreshContainer}>
            <Button
              variant='secondary'
              onClick={fetchDashboardData}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Data'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert type='error' message={error} onClose={() => setError('')} />
      )}

      {/* Library Statistics */}
      <div className={styles.statsSection}>
        <h2 className={styles.statsTitle}>Library Statistics</h2>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading dashboard statistics...</p>
          </div>
        ) : dashboardData ? (
          <div className={styles.statsGrid}>
            <StatsCard
              title='Total Borrowed'
              value={dashboardData.circulation.totalBorrowed.toString()}
              icon='📚'
              color='primary'
            />
            <StatsCard
              title='Total Overdues'
              value={dashboardData.circulation.totalOverdues.toString()}
              icon='⚠️'
              color='warning'
            />
            <StatsCard
              title='Overdue Over a Month'
              value={dashboardData.circulation.overdueOverMonth.toString()}
              icon='🔴'
              color='danger'
            />
            <StatsCard
              title='Total Students'
              value={dashboardData.patrons.totalStudents.total.toString()}
              icon='👨‍🎓'
              color='info'
            />
            <StatsCard
              title='Total Staff'
              value={dashboardData.patrons.totalStaff.toString()}
              icon='👨‍💼'
              color='secondary'
            />
            <StatsCard
              title='Total Guests'
              value={dashboardData.patrons.totalGuests.toString()}
              icon='👤'
              color='default'
            />
            <StatsCard
              title='Total Teachers'
              value={dashboardData.patrons.totalTeachers.toString()}
              icon='👩‍🏫'
              color='success'
            />
            <StatsCard
              title='Female Students'
              value={dashboardData.patrons.totalStudents.female.toString()}
              icon='👩'
              color='info'
            />
            <StatsCard
              title='Male Students'
              value={dashboardData.patrons.totalStudents.male.toString()}
              icon='👨'
              color='primary'
            />
            <StatsCard
              title='Active Patrons'
              value={dashboardData.patrons.activePatrons.toString()}
              icon='✅'
              color='success'
            />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No data available</p>
            <Button variant='primary' onClick={fetchDashboardData}>
              Retry
            </Button>
          </div>
        )}
      </div>

      <div className={styles.dashboardGrid}>
        <Card title='Circulation Management'>
          <div className={styles.cardContent}>
            <p className={styles.cardDescription}>
              Manage book checkouts and returns for library patrons.
            </p>
            <div className={styles.cardActions}>
              <Link href='/circulations/checkout'>
                <Button variant='primary' className={styles.actionButton}>
                  Checkout Books
                </Button>
              </Link>
              <Link href='/circulations/checkin'>
                <Button variant='secondary' className={styles.actionButton}>
                  Check-in Books
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card title='Quick Actions'>
          <div className={styles.cardContent}>
            <div className={styles.quickActions}>
              <Link
                href='/circulations/checkout'
                className={styles.quickAction}
              >
                <div className={styles.quickActionIcon}>📚</div>
                <span>Checkout</span>
              </Link>
              <Link href='/circulations/checkin' className={styles.quickAction}>
                <div className={styles.quickActionIcon}>↩️</div>
                <span>Check-in</span>
              </Link>
              <Link href='/circulations/holds' className={styles.quickAction}>
                <div className={styles.quickActionIcon}>🔒</div>
                <span>Holds</span>
              </Link>
              <Link
                href='/circulations/overdues'
                className={styles.quickAction}
              >
                <div className={styles.quickActionIcon}>⚠️</div>
                <span>Overdues</span>
              </Link>
            </div>
          </div>
        </Card>

        {/* Last Registered Patron */}
        <Card title='Last Registered Patron'>
          <div className={styles.lastRegisteredCard}>
            <div className={styles.patronInfo}>
              <Avatar size='md'>
                <div className='avatar-fallback'>GA</div>
              </Avatar>
              <div className={styles.patronDetails}>
                <div className={styles.patronName}>Gift Alufa</div>
                <div className={styles.patronBarcode}>Barcode: 20250574</div>
                <div className={styles.registrationDate}>
                  Registered: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title='System Information'>
          <div className={styles.cardContent}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>System Status:</strong>
                <span className={styles.statusOnline}>Online</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Last Updated:</strong>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

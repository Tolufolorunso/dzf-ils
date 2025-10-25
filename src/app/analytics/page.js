'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import StatsCard from '@/components/ui/StatsCard';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedMonth]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/monthly?year=${selectedYear}&month=${selectedMonth}`
      );
      const data = await response.json();

      if (data.status) {
        setAnalyticsData(data.data);
      } else {
        setError(data.message || 'Failed to fetch analytics data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase();
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Badge variant='primary'>🥇 1st</Badge>;
    if (rank === 2) return <Badge variant='secondary'>🥈 2nd</Badge>;
    if (rank === 3) return <Badge variant='warning'>🥉 3rd</Badge>;
    return <Badge variant='default'>#{rank}</Badge>;
  };

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 5; year--) {
    yearOptions.push({ value: year, label: year.toString() });
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📊 Monthly Analytics & Leaderboard</h1>
        <p className={styles.pageSubtitle}>
          Track patron activity and engagement metrics
        </p>
      </div>

      {error && (
        <Alert type='error' message={error} onClose={() => setError('')} />
      )}

      {/* Date Selection */}
      <Card title='Select Period'>
        <div className={styles.dateSelection}>
          <Select
            label='Year'
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={yearOptions}
          />
          <Select
            label='Month'
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            options={monthOptions}
          />
          <Button variant='primary' onClick={fetchAnalytics} disabled={loading}>
            {loading ? 'Loading...' : 'Update'}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading analytics data...</p>
        </div>
      ) : analyticsData ? (
        <>
          {/* Statistics Overview */}
          <div className={styles.statsSection}>
            <h2 className={styles.sectionTitle}>
              {monthOptions.find((m) => m.value === selectedMonth)?.label}{' '}
              {selectedYear} Overview
            </h2>
            <div className={styles.statsGrid}>
              <StatsCard
                title='Active Patrons'
                value={analyticsData.stats.totalActivePatrons.toString()}
                icon='👥'
                color='primary'
              />
              <StatsCard
                title='Inactive Patrons'
                value={analyticsData.stats.totalInactivePatrons.toString()}
                icon='😴'
                color='warning'
              />
              <StatsCard
                title='Books Checked Out'
                value={analyticsData.stats.totalBooksCheckedOut.toString()}
                icon='📚'
                color='info'
              />
              <StatsCard
                title='Classes Attended'
                value={analyticsData.stats.totalClassesAttended.toString()}
                icon='🎓'
                color='success'
              />
              <StatsCard
                title='Summaries Submitted'
                value={analyticsData.stats.totalSummariesSubmitted.toString()}
                icon='📝'
                color='secondary'
              />
              <StatsCard
                title='Total Points Awarded'
                value={analyticsData.stats.totalPointsAwarded.toString()}
                icon='⭐'
                color='primary'
              />
            </div>
          </div>

          <div className={styles.contentGrid}>
            {/* Leaderboard */}
            <Card title='🏆 Top Performers'>
              {analyticsData.leaderboard.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🏆</div>
                  <h3>No Activity This Month</h3>
                  <p>No patrons have recorded any activity for this period.</p>
                </div>
              ) : (
                <div className={styles.leaderboard}>
                  {analyticsData.leaderboard.map((patron, index) => (
                    <div key={patron._id} className={styles.leaderboardItem}>
                      <div className={styles.patronRank}>
                        {getRankBadge(patron.rank)}
                      </div>
                      <div className={styles.patronAvatar}>
                        <Avatar
                          size='md'
                          initial={getInitials(patron.patronName)}
                        />
                      </div>
                      <div className={styles.patronDetails}>
                        <div className={styles.patronName}>
                          {patron.patronName}
                        </div>
                        <div className={styles.patronBarcode}>
                          {patron.patronBarcode}
                        </div>
                      </div>
                      <div className={styles.patronStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>
                            {patron.booksCheckedOut}
                          </span>
                          <span className={styles.statLabel}>Books</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>
                            {patron.classesAttended}
                          </span>
                          <span className={styles.statLabel}>Classes</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>
                            {patron.summariesApproved}
                          </span>
                          <span className={styles.statLabel}>Summaries</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statValue}>
                            {patron.totalPoints}
                          </span>
                          <span className={styles.statLabel}>Points</span>
                        </div>
                      </div>
                      <div className={styles.activityScore}>
                        <div className={styles.scoreValue}>
                          {patron.activityScore}
                        </div>
                        <div className={styles.scoreLabel}>Activity Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Inactive Patrons */}
            <Card title='😴 Inactive Patrons'>
              {analyticsData.inactivePatrons.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🎉</div>
                  <h3>All Patrons Active!</h3>
                  <p>Every patron had some activity this month.</p>
                </div>
              ) : (
                <div className={styles.inactiveList}>
                  <div className={styles.inactiveHeader}>
                    <p>
                      {analyticsData.inactivePatrons.length} patrons had no
                      activity this month
                    </p>
                  </div>
                  {analyticsData.inactivePatrons.map((patron) => (
                    <div key={patron._id} className={styles.inactiveItem}>
                      <Avatar
                        size='sm'
                        initial={getInitials(
                          `${patron.firstname} ${patron.surname}`
                        )}
                      />
                      <div className={styles.inactiveDetails}>
                        <div className={styles.inactiveName}>
                          {patron.firstname} {patron.surname}
                        </div>
                        <div className={styles.inactiveBarcode}>
                          {patron.barcode}
                        </div>
                      </div>
                      <Badge variant='default'>{patron.patronType}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <h3>No Data Available</h3>
          <p>Unable to load analytics data for the selected period.</p>
          <Button variant='primary' onClick={fetchAnalytics}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

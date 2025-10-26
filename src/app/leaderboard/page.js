'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import StudentNav from '@/components/layout/StudentNav';
import styles from './leaderboard.module.css';

export default function PublicLeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedYear, selectedMonth]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/monthly?year=${selectedYear}&month=${selectedMonth}`
      );
      const data = await response.json();

      if (data.status) {
        setLeaderboardData(data.data);
      } else {
        setError(data.message || 'Failed to fetch leaderboard data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Leaderboard fetch error:', err);
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
    if (rank === 1) return <Badge variant='primary'>🥇 Champion</Badge>;
    if (rank === 2) return <Badge variant='secondary'>🥈 Runner-up</Badge>;
    if (rank === 3) return <Badge variant='warning'>🥉 Third Place</Badge>;
    if (rank <= 10) return <Badge variant='success'>🏆 Top 10</Badge>;
    return <Badge variant='default'>#{rank}</Badge>;
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🌟';
    if (rank === 3) return '⭐';
    return '📚';
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
  for (let year = currentYear; year >= currentYear - 3; year--) {
    yearOptions.push({ value: year, label: year.toString() });
  }

  return (
    <>
      <StudentNav />
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>🏆 Library Champions Leaderboard</h1>
          <p className={styles.pageSubtitle}>
            See who are the top readers and most active library users this
            month!
          </p>
        </div>

        {error && (
          <Alert type='error' message={error} onClose={() => setError('')} />
        )}

        <div className={styles.contentContainer}>
          {/* Period Selection */}
          <Card title='Select Month & Year'>
            <div className={styles.periodSelection}>
              <Select
                label='Month'
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                options={monthOptions}
              />
              <Select
                label='Year'
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                options={yearOptions}
              />
              <Button
                variant='primary'
                onClick={fetchLeaderboard}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Update Leaderboard'}
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading leaderboard...</p>
            </div>
          ) : leaderboardData && leaderboardData.leaderboard.length > 0 ? (
            <>
              {/* Current Month Stats */}
              <Card
                title={`📊 ${
                  monthOptions.find((m) => m.value === selectedMonth)?.label
                } ${selectedYear} Statistics`}
              >
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statContent}>
                      <div className={styles.statNumber}>
                        {leaderboardData.stats.totalActivePatrons}
                      </div>
                      <div className={styles.statLabel}>Active Readers</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📚</div>
                    <div className={styles.statContent}>
                      <div className={styles.statNumber}>
                        {leaderboardData.stats.totalBooksCheckedOut}
                      </div>
                      <div className={styles.statLabel}>Books Borrowed</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🎓</div>
                    <div className={styles.statContent}>
                      <div className={styles.statNumber}>
                        {leaderboardData.stats.totalClassesAttended}
                      </div>
                      <div className={styles.statLabel}>Classes Attended</div>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statContent}>
                      <div className={styles.statNumber}>
                        {leaderboardData.stats.totalSummariesSubmitted}
                      </div>
                      <div className={styles.statLabel}>Book Summaries</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Top 3 Podium */}
              {leaderboardData.leaderboard.length >= 3 && (
                <Card title="🏆 This Month's Top Champions">
                  <div className={styles.podium}>
                    {/* Second Place */}
                    <div
                      className={`${styles.podiumPosition} ${styles.second}`}
                    >
                      <div className={styles.podiumRank}>🥈</div>
                      <Avatar
                        size='lg'
                        initial={getInitials(
                          leaderboardData.leaderboard[1].patronName
                        )}
                      />
                      <div className={styles.podiumName}>
                        {leaderboardData.leaderboard[1].patronName}
                      </div>
                      <div className={styles.podiumScore}>
                        {leaderboardData.leaderboard[1].activityScore} pts
                      </div>
                    </div>

                    {/* First Place */}
                    <div className={`${styles.podiumPosition} ${styles.first}`}>
                      <div className={styles.podiumRank}>🥇</div>
                      <Avatar
                        size='xl'
                        initial={getInitials(
                          leaderboardData.leaderboard[0].patronName
                        )}
                      />
                      <div className={styles.podiumName}>
                        {leaderboardData.leaderboard[0].patronName}
                      </div>
                      <div className={styles.podiumScore}>
                        {leaderboardData.leaderboard[0].activityScore} pts
                      </div>
                      <div className={styles.championBadge}>👑 CHAMPION</div>
                    </div>

                    {/* Third Place */}
                    <div className={`${styles.podiumPosition} ${styles.third}`}>
                      <div className={styles.podiumRank}>🥉</div>
                      <Avatar
                        size='lg'
                        initial={getInitials(
                          leaderboardData.leaderboard[2].patronName
                        )}
                      />
                      <div className={styles.podiumName}>
                        {leaderboardData.leaderboard[2].patronName}
                      </div>
                      <div className={styles.podiumScore}>
                        {leaderboardData.leaderboard[2].activityScore} pts
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Full Leaderboard */}
              <Card title='📋 Complete Rankings'>
                <div className={styles.leaderboard}>
                  {leaderboardData.leaderboard.map((patron, index) => (
                    <div
                      key={patron._id}
                      className={`${styles.leaderboardItem} ${
                        index < 3 ? styles.topThree : ''
                      }`}
                    >
                      <div className={styles.rankSection}>
                        <div className={styles.rankNumber}>#{patron.rank}</div>
                        <div className={styles.rankEmoji}>
                          {getRankEmoji(patron.rank)}
                        </div>
                      </div>

                      <div className={styles.patronSection}>
                        <Avatar
                          size='md'
                          initial={getInitials(patron.patronName)}
                        />
                        <div className={styles.patronDetails}>
                          <div className={styles.patronName}>
                            {patron.patronName}
                          </div>
                          <div className={styles.patronBarcode}>
                            {patron.patronBarcode}
                          </div>
                        </div>
                      </div>

                      <div className={styles.statsSection}>
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
                      </div>

                      <div className={styles.scoreSection}>
                        <div className={styles.totalScore}>
                          {patron.activityScore}
                        </div>
                        <div className={styles.scoreLabel}>Activity Score</div>
                        {getRankBadge(patron.rank)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card title='No Activity This Month'>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📚</div>
                <h3>No Champions Yet!</h3>
                <p>
                  No one has recorded any library activity for{' '}
                  {monthOptions.find((m) => m.value === selectedMonth)?.label}{' '}
                  {selectedYear}.
                </p>
                <p>
                  Be the first to start reading, attending classes, and
                  submitting book summaries!
                </p>
              </div>
            </Card>
          )}

          {/* How to Earn Points */}
          <Card title='🎯 How to Earn Points & Climb the Leaderboard'>
            <div className={styles.pointsGuide}>
              <div className={styles.pointsItem}>
                <div className={styles.pointsIcon}>📚</div>
                <div className={styles.pointsContent}>
                  <h4>Borrow Books (10 points)</h4>
                  <p>
                    Each book you check out from the library earns you activity
                    points.
                  </p>
                </div>
              </div>
              <div className={styles.pointsItem}>
                <div className={styles.pointsIcon}>↩️</div>
                <div className={styles.pointsContent}>
                  <h4>Return Books (15 points + bonus)</h4>
                  <p>
                    Return books on time and earn extra points awarded by
                    library staff.
                  </p>
                </div>
              </div>
              <div className={styles.pointsItem}>
                <div className={styles.pointsIcon}>🎓</div>
                <div className={styles.pointsContent}>
                  <h4>Attend Classes (20 points)</h4>
                  <p>
                    Join literacy classes and reading programs to boost your
                    score.
                  </p>
                </div>
              </div>
              <div className={styles.pointsItem}>
                <div className={styles.pointsIcon}>📝</div>
                <div className={styles.pointsContent}>
                  <h4>Write Book Summaries (25 points + bonus)</h4>
                  <p>
                    Submit thoughtful book reviews and earn the highest activity
                    points!
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

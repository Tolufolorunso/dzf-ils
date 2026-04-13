'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/Alert';
import styles from './page.module.css';

const AUTO_REFRESH_MS = 60000;

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString();
}

function formatTime(value) {
  if (!value) {
    return 'Waiting for first update';
  }

  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getLeaderTone(rank) {
  if (rank === 1) return styles.rankGold;
  if (rank === 2) return styles.rankSilver;
  if (rank === 3) return styles.rankBronze;
  return '';
}

export default function ReadingCompetitionLivePage() {
  const [competitionData, setCompetitionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  async function fetchCompetitionData({ background = false } = {}) {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/competition?public=1', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!data.status) {
        setPageError(data.message || 'Failed to load live competition data.');
        return;
      }

      setCompetitionData(data.data);
      setPageError('');
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Public competition fetch error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchCompetitionData();

    const intervalId = window.setInterval(() => {
      fetchCompetitionData({ background: true });
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const stats = competitionData?.stats;
  const session = competitionData?.session;
  const leaderboard = competitionData?.leaderboard || [];
  const categoryWinners = competitionData?.categoryWinners || [];
  const categoryLeaderboards = competitionData?.categoryLeaderboards || [];
  const uncategorizedLeaderboard =
    competitionData?.uncategorizedLeaderboard || [];
  const activeCheckouts = competitionData?.activeCheckouts || [];
  const recentCheckins = competitionData?.recentCheckins || [];

  return (
    <div className={styles.page}>
      <div className={styles.backdropGlow} />
      <div className={styles.backdropGlowAlt} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.livePill}>
            <span className={styles.liveDot} />
            Reading Competition Live Board
          </div>
          <h1 className={styles.title}>Track every reader, ranking, and win live.</h1>
          <p className={styles.subtitle}>
            This public board updates from the reading competition records so
            everyone can follow category winners, grade-first rankings, active
            books out, and fresh check-ins from one colorful screen.
          </p>

          <div className={styles.heroActions}>
            <Button
              variant='secondary'
              onClick={() => fetchCompetitionData({ background: true })}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing Live Board...' : 'Refresh Live Board'}
            </Button>
            <div className={styles.statusNote}>
              <strong>{session?.title || 'Reading Competition'}</strong>
              <span>Last updated {formatTime(lastUpdated)}</span>
              <span>Auto-refresh every 60 seconds</span>
            </div>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Session Snapshot</span>
            <span className={styles.sessionKey}>
              {session?.sessionKey || 'No active session'}
            </span>
          </div>

          <div className={styles.heroMetrics}>
            <div className={styles.metricCard}>
              <strong>{stats?.totalParticipants ?? 0}</strong>
              <span>Readers Logged</span>
            </div>
            <div className={styles.metricCard}>
              <strong>{stats?.totalBooksRead ?? 0}</strong>
              <span>Books Read</span>
            </div>
            <div className={styles.metricCard}>
              <strong>{stats?.averageGrade ?? 0}</strong>
              <span>Average Grade</span>
            </div>
            <div className={styles.metricCard}>
              <strong>{stats?.verifiedSummaries ?? 0}</strong>
              <span>Verified Reads</span>
            </div>
          </div>

          <div className={styles.heroFootnote}>
            Grade leads the leaderboard. Number of books read follows next.
          </div>
        </div>
      </section>

      <main className={styles.content}>
        {pageError && (
          <Alert
            type='error'
            message={pageError}
            onClose={() => setPageError('')}
          />
        )}

        {loading ? (
          <Card title='Loading Live Competition'>
            <div className={styles.emptyState}>
              Pulling live reading competition rankings, winners, and recent
              activity.
            </div>
          </Card>
        ) : (
          <>
            <section className={styles.ribbonGrid}>
              <div className={styles.ribbonCard}>
                <span>Total Checkouts</span>
                <strong>{stats?.totalBooksLogged ?? 0}</strong>
              </div>
              <div className={styles.ribbonCard}>
                <span>Active Checkouts</span>
                <strong>{stats?.activeCheckouts ?? 0}</strong>
              </div>
              <div className={styles.ribbonCard}>
                <span>Graded Summaries</span>
                <strong>{stats?.gradedSummaries ?? 0}</strong>
              </div>
              <div className={styles.ribbonCard}>
                <span>Leaderboard Size</span>
                <strong>{stats?.leaderboardCount ?? 0}</strong>
              </div>
            </section>

            <section className={styles.winnersSection}>
              {categoryWinners.map((category, index) => (
                <div
                  key={category.categoryKey}
                  className={`${styles.winnerSpotlight} ${
                    styles[`winnerTone${index + 1}`]
                  }`}
                >
                  <div className={styles.spotlightHeader}>
                    <span>{category.categoryLabel}</span>
                    <span>Current Winner</span>
                  </div>

                  {category.winner ? (
                    <>
                      <strong className={styles.spotlightName}>
                        {category.winner.patronName}
                      </strong>
                      <span className={styles.spotlightMeta}>
                        {category.winner.currentClass || 'Class not set'} -{' '}
                        {category.winner.patronBarcode}
                      </span>
                      <div className={styles.spotlightStats}>
                        <div>
                          <strong>{category.winner.averageGrade}</strong>
                          <span>Grade</span>
                        </div>
                        <div>
                          <strong>{category.winner.booksRead}</strong>
                          <span>Books</span>
                        </div>
                        <div>
                          <strong>{category.winner.teacherVerifiedCount}</strong>
                          <span>Verified</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptySpotlight}>
                      No winner has emerged in this category yet.
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section className={styles.boardLayout}>
              <div className={styles.mainBoard}>
                <Card title='Top 75 Combined Leaderboard'>
                  {leaderboard.length === 0 ? (
                    <div className={styles.emptyState}>
                      No leaderboard entries yet. Once check-ins are graded,
                      the live board will fill up here.
                    </div>
                  ) : (
                    <div className={styles.leaderboardList}>
                      {leaderboard.map((entry) => (
                        <div key={entry.patronBarcode} className={styles.rankRow}>
                          <div
                            className={`${styles.rankBadge} ${getLeaderTone(
                              entry.rank,
                            )}`}
                          >
                            #{entry.rank}
                          </div>

                          <div className={styles.rankIdentity}>
                            <strong>{entry.patronName}</strong>
                            <span>
                              {entry.currentClass || 'Class not set'} •{' '}
                              {entry.categoryLabel}
                            </span>
                            <span>{entry.patronBarcode}</span>
                          </div>

                          <div className={styles.rankStats}>
                            <div>
                              <strong>{entry.averageGrade}</strong>
                              <span>Average Grade</span>
                            </div>
                            <div>
                              <strong>{entry.booksRead}</strong>
                              <span>Books Read</span>
                            </div>
                            <div>
                              <strong>{entry.teacherVerifiedCount}</strong>
                              <span>Verified</span>
                            </div>
                            <div>
                              <strong>{entry.activeLoans}</strong>
                              <span>Active</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <div className={styles.sideBoard}>
                <Card title='Category Rankings'>
                  <div className={styles.categoryBoardStack}>
                    {categoryLeaderboards.map((category) => (
                      <div key={category.categoryKey} className={styles.categoryPanel}>
                        <div className={styles.categoryPanelHeader}>
                          <strong>{category.categoryLabel}</strong>
                          <span>{category.entries.length} ranked readers</span>
                        </div>

                        {category.entries.length === 0 ? (
                          <div className={styles.compactEmpty}>
                            No readers in this category yet.
                          </div>
                        ) : (
                          <div className={styles.categoryMiniList}>
                            {category.entries.slice(0, 5).map((entry) => (
                              <div
                                key={`${category.categoryKey}-${entry.patronBarcode}`}
                                className={styles.categoryMiniRow}
                              >
                                <span>#{entry.categoryRank}</span>
                                <strong>{entry.patronName}</strong>
                                <em>
                                  {entry.averageGrade} grade • {entry.booksRead}{' '}
                                  books
                                </em>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {uncategorizedLeaderboard.length > 0 && (
                      <div className={styles.categoryPanel}>
                        <div className={styles.categoryPanelHeader}>
                          <strong>Uncategorized</strong>
                          <span>{uncategorizedLeaderboard.length} readers</span>
                        </div>
                        <div className={styles.categoryMiniList}>
                          {uncategorizedLeaderboard.slice(0, 5).map((entry) => (
                            <div
                              key={`uncategorized-${entry.patronBarcode}`}
                              className={styles.categoryMiniRow}
                            >
                              <span>#{entry.categoryRank}</span>
                              <strong>{entry.patronName}</strong>
                              <em>
                                {entry.averageGrade} grade • {entry.booksRead}{' '}
                                books
                              </em>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </section>

            <section className={styles.activitySection}>
              <Card title='Books Still Out'>
                {activeCheckouts.length === 0 ? (
                  <div className={styles.emptyState}>
                    No books are currently out in this competition.
                  </div>
                ) : (
                  <div className={styles.activityList}>
                    {activeCheckouts.map((record) => (
                      <div key={record.id} className={styles.activityCard}>
                        <strong>{record.bookTitle}</strong>
                        <span>{record.patronName}</span>
                        <div className={styles.activityMeta}>
                          <span>{record.currentClass || 'Class not set'}</span>
                          <span>{record.categoryLabel}</span>
                          <span>Out {formatDate(record.checkoutDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title='Recent Grades and Check-ins'>
                {recentCheckins.length === 0 ? (
                  <div className={styles.emptyState}>
                    No graded check-ins yet. Fresh results will appear here.
                  </div>
                ) : (
                  <div className={styles.activityList}>
                    {recentCheckins.map((record) => (
                      <div key={record.id} className={styles.activityCard}>
                        <strong>{record.bookTitle}</strong>
                        <span>
                          {record.patronName} • Grade {record.grade ?? 'N/A'}
                        </span>
                        <div className={styles.activityMeta}>
                          <span>{record.currentClass || 'Class not set'}</span>
                          <span>{record.categoryLabel}</span>
                          <span>Checked in {formatDate(record.checkinDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

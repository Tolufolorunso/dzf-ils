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

export default function ReadingCompetitionResultPage() {
  const [competitionData, setCompetitionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchCompetitionResult = async ({ background = false } = {}) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/competition?public=result', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!data.status) {
        setPageError(data.message || 'Failed to load reading competition result.');
        return;
      }

      setCompetitionData(data.data);
      setPageError('');
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Reading competition result fetch error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompetitionResult();

    const intervalId = window.setInterval(() => {
      fetchCompetitionResult({ background: true });
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const stats = competitionData?.stats;
  const session = competitionData?.session;
  const resultPublication = competitionData?.resultPublication;
  const resultReady = Boolean(competitionData?.resultReady);
  const resultCategoryWinners = competitionData?.resultCategoryWinners || [];
  const resultCategoryLeaderboards =
    competitionData?.resultCategoryLeaderboards || [];
  const resultUncategorizedLeaderboard =
    competitionData?.resultUncategorizedLeaderboard || [];
  const activeCheckouts = competitionData?.activeCheckouts || [];
  const recentCheckins = competitionData?.recentCheckins || [];

  return (
    <div className={styles.page}>
      <div className={styles.backdropGlow} />
      <div className={styles.backdropGlowAlt} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.livePill}>Reading Competition Result Board</div>
          <h1 className={styles.title}>See the full published result by category.</h1>
          <p className={styles.subtitle}>
            This result page follows the live board style, but goes deeper by
            listing every ranked participant inside each result category once
            the admin publishes the reading competition result.
          </p>

          <div className={styles.heroActions}>
            <Button
              variant='secondary'
              onClick={() => fetchCompetitionResult({ background: true })}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing Result...' : 'Refresh Result'}
            </Button>
            <div className={styles.statusNote}>
              <strong>{session?.title || 'Reading Competition'}</strong>
              <span>Last updated {formatTime(lastUpdated)}</span>
              <span>
                Published:{' '}
                {resultPublication?.isPublished ? 'Yes' : 'Not yet available'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Result Snapshot</span>
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
              <strong>{stats?.totalGrade ?? 0}</strong>
              <span>Total Grade</span>
            </div>
            <div className={styles.metricCard}>
              <strong>{stats?.verifiedSummaries ?? 0}</strong>
              <span>Verified Reads</span>
            </div>
          </div>

          <div className={styles.heroFootnote}>
            Result ranking uses total grade first, then books read, then
            teacher verification count.
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
          <Card title='Loading Reading Result'>
            <div className={styles.emptyState}>
              Pulling the reading competition result and category rankings.
            </div>
          </Card>
        ) : !resultReady ? (
          <Card title='Reading Result Not Ready'>
            <div className={styles.waitingState}>
              <strong>No result ready for the reading competition.</strong>
              <p>Wait till the result is ready.</p>
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
                <span>Published By</span>
                <strong>{resultPublication?.publishedBy || 'Admin'}</strong>
              </div>
              <div className={styles.ribbonCard}>
                <span>Published At</span>
                <strong>{formatDate(resultPublication?.publishedAt)}</strong>
              </div>
            </section>

            <section className={styles.winnersSection}>
              {resultCategoryWinners.map((category, index) => (
                <div
                  key={category.categoryKey}
                  className={`${styles.winnerSpotlight} ${
                    styles[`winnerTone${(index % 4) + 1}`]
                  }`}
                >
                  <div className={styles.spotlightHeader}>
                    <span>{category.categoryLabel}</span>
                    <span>Category Winner</span>
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
                          <strong>{category.winner.totalGrade}</strong>
                          <span>Total Grade</span>
                        </div>
                        <div>
                          <strong>{category.winner.booksRead}</strong>
                          <span>Books</span>
                        </div>
                        <div>
                          <strong>
                            {category.winner.teacherVerifiedCount}
                          </strong>
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

            <section className={styles.resultBoardsGrid}>
              {resultCategoryLeaderboards.map((category) => (
                <Card
                  key={category.categoryKey}
                  title={`${category.categoryLabel} Leaderboard`}
                >
                  {category.entries.length === 0 ? (
                    <div className={styles.emptyState}>
                      No ranked readers were recorded in this category.
                    </div>
                  ) : (
                    <div className={styles.resultList}>
                      {category.entries.map((entry) => (
                        <div
                          key={`${category.categoryKey}-${entry.patronBarcode}`}
                          className={styles.rankRow}
                        >
                          <div
                            className={`${styles.rankBadge} ${getLeaderTone(
                              entry.categoryRank,
                            )}`}
                          >
                            #{entry.categoryRank}
                          </div>

                          <div className={styles.rankIdentity}>
                            <strong>{entry.patronName}</strong>
                            <span>
                              {entry.currentClass || 'Class not set'} - Global #
                              {entry.rank}
                            </span>
                            <span>{entry.patronBarcode}</span>
                          </div>

                          <div className={styles.rankStats}>
                            <div>
                              <strong>{entry.totalGrade}</strong>
                              <span>Total Grade</span>
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
              ))}

              {resultUncategorizedLeaderboard.length > 0 && (
                <Card title='Uncategorized Result Board'>
                  <div className={styles.resultList}>
                    {resultUncategorizedLeaderboard.map((entry) => (
                      <div
                        key={`uncategorized-${entry.patronBarcode}`}
                        className={styles.rankRow}
                      >
                        <div className={styles.rankBadge}>#{entry.categoryRank}</div>
                        <div className={styles.rankIdentity}>
                          <strong>{entry.patronName}</strong>
                          <span>
                            {entry.currentClass || 'Class not set'} - Global #
                            {entry.rank}
                          </span>
                          <span>{entry.patronBarcode}</span>
                        </div>
                        <div className={styles.rankStats}>
                          <div>
                            <strong>{entry.totalGrade}</strong>
                            <span>Total Grade</span>
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
                </Card>
              )}
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
                          {record.patronName} - Grade {record.grade ?? 'N/A'}
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

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/Alert';
import styles from './page.module.css';

function formatDateTime(value) {
  if (!value) {
    return 'Not published yet';
  }

  return new Date(value).toLocaleString();
}

function AdminDashboardContent() {
  const [competitionData, setCompetitionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');

  const fetchAdminData = async ({ background = false } = {}) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/competition');
      const data = await response.json();

      if (!data.status) {
        setPageError(data.message || 'Failed to fetch admin competition data.');
        return;
      }

      setCompetitionData(data.data);
      setPageError('');
    } catch (error) {
      console.error('Admin competition fetch error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResultVisibility = async (isPublished) => {
    try {
      setSubmitting(true);
      setPageError('');
      setPageSuccess('');

      const response = await fetch('/api/competition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'setresultpublication',
          isPublished,
        }),
      });

      const data = await response.json();

      if (!data.status) {
        setPageError(data.message || 'Failed to update result visibility.');
        return;
      }

      setPageSuccess(data.message);
      fetchAdminData({ background: true });
    } catch (error) {
      console.error('Result visibility update error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = competitionData?.stats;
  const session = competitionData?.session;
  const publication = competitionData?.resultPublication;
  const isPublished = Boolean(publication?.isPublished);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Admin Control Center</p>
          <h1 className={styles.title}>Run global admin controls from one page.</h1>
          <p className={styles.subtitle}>
            This admin dashboard is the control room for the whole app. For
            now, it manages reading competition publishing, but the structure is
            ready for broader system controls later.
          </p>
        </div>

        <div className={styles.heroPanel}>
          <span className={styles.panelLabel}>Current Competition Session</span>
          <strong>{session?.title || 'No active competition session'}</strong>
          <span>Session key: {session?.sessionKey || 'Not available'}</span>
          <span>
            Result page status:{' '}
            <strong className={isPublished ? styles.statusOn : styles.statusOff}>
              {isPublished ? 'Visible to everyone' : 'Hidden from everyone'}
            </strong>
          </span>
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

        {pageSuccess && (
          <Alert
            type='success'
            message={pageSuccess}
            onClose={() => setPageSuccess('')}
          />
        )}

        {loading ? (
          <Card title='Loading Admin Controls'>
            <div className={styles.emptyState}>
              Pulling competition settings and publication controls.
            </div>
          </Card>
        ) : (
          <>
            <section className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span>Readers Logged</span>
                <strong>{stats?.totalParticipants ?? 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Books Read</span>
                <strong>{stats?.totalBooksRead ?? 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Total Grade</span>
                <strong>{stats?.totalGrade ?? 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Top Board Size</span>
                <strong>{stats?.leaderboardCount ?? 0}</strong>
              </div>
            </section>

            <section className={styles.grid}>
              <Card title='Reading Result Visibility'>
                <div className={styles.controlPanel}>
                  <div className={styles.statusCard}>
                    <span className={styles.statusLabel}>Public result page</span>
                    <strong>{isPublished ? 'Published' : 'Hidden'}</strong>
                    <p>
                      {isPublished
                        ? 'Visitors can now see the reading competition result page.'
                        : 'Visitors will only see the waiting message until you publish the result.'}
                    </p>
                  </div>

                  <div className={styles.metaList}>
                    <div className={styles.metaRow}>
                      <span>Published by</span>
                      <strong>{publication?.publishedBy || 'Nobody yet'}</strong>
                    </div>
                    <div className={styles.metaRow}>
                      <span>Published at</span>
                      <strong>{formatDateTime(publication?.publishedAt)}</strong>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <Button
                      variant='primary'
                      onClick={() => handleResultVisibility(true)}
                      disabled={submitting || isPublished}
                    >
                      {submitting && !isPublished
                        ? 'Publishing...'
                        : 'Publish Result Page'}
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() => handleResultVisibility(false)}
                      disabled={submitting || !isPublished}
                    >
                      {submitting && isPublished
                        ? 'Hiding...'
                        : 'Hide Result Page'}
                    </Button>
                    <Button
                      variant='secondary'
                      onClick={() => fetchAdminData({ background: true })}
                      disabled={refreshing}
                    >
                      {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title='Competition Quick Links'>
                <div className={styles.linkGrid}>
                  <Link href='/competitions/reading' className={styles.linkCard}>
                    <strong>Staff Reading Page</strong>
                    <span>Manage checkout, check-in, grading, and classes.</span>
                  </Link>
                  <Link
                    href='/competitions/reading/live'
                    className={styles.linkCard}
                  >
                    <strong>Public Live Board</strong>
                    <span>See the current public live leaderboard view.</span>
                  </Link>
                  <Link
                    href='/competitions/reading/result'
                    className={styles.linkCard}
                  >
                    <strong>Public Result Page</strong>
                    <span>Preview the final result board and publish state.</span>
                  </Link>
                </div>
              </Card>
            </section>

            <section className={styles.futureSection}>
              <Card title='Admin Roadmap'>
                <div className={styles.roadmapList}>
                  <div className={styles.roadmapItem}>
                    Reading competition result publishing is active now.
                  </div>
                  <div className={styles.roadmapItem}>
                    This page is ready to host more global admin controls later.
                  </div>
                  <div className={styles.roadmapItem}>
                    Current publishing affects only the reading competition
                    result page, not the live page.
                  </div>
                </div>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole='admin'>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

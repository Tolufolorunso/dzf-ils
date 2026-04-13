'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import styles from './page.module.css';

const initialCheckoutForm = {
  patronBarcode: '',
  itemBarcode: '',
};

const initialCheckinForm = {
  patronBarcode: '',
  itemBarcode: '',
  summary: '',
  grade: '',
  feedback: '',
  teacherVerified: 'yes',
};

const initialClassForm = {
  patronBarcode: '',
  currentClass: 'primary1',
};

const classOptions = [
  { value: 'primary1', label: 'Primary 1' },
  { value: 'primary2', label: 'Primary 2' },
  { value: 'primary3', label: 'Primary 3' },
  { value: 'primary4', label: 'Primary 4' },
  { value: 'primary5', label: 'Primary 5' },
  { value: 'primary6', label: 'Primary 6' },
  { value: 'jss1', label: 'JSS1' },
  { value: 'jss2', label: 'JSS2' },
  { value: 'jss3', label: 'JSS3' },
  { value: 'ss1', label: 'SS1' },
  { value: 'ss2', label: 'SS2' },
  { value: 'ss3', label: 'SS3' },
];

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString();
}

export default function ReadingCompetitionPage() {
  const [competitionData, setCompetitionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');

  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [checkinForm, setCheckinForm] = useState(initialCheckinForm);
  const [classForm, setClassForm] = useState(initialClassForm);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);

  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [checkinError, setCheckinError] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState('');
  const [classError, setClassError] = useState('');
  const [classSuccess, setClassSuccess] = useState('');

  useEffect(() => {
    fetchCompetitionData();
  }, []);

  const fetchCompetitionData = async ({ background = false } = {}) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('/api/competition');
      const data = await response.json();

      if (data.status) {
        setCompetitionData(data.data);
        setPageError('');
        return;
      }

      setPageError(data.message || 'Failed to load competition data.');
    } catch (error) {
      console.error('Competition fetch error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCheckoutChange = (event) => {
    const { name, value } = event.target;

    setCheckoutForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (checkoutError) setCheckoutError('');
    if (checkoutSuccess) setCheckoutSuccess('');
  };

  const handleCheckinChange = (event) => {
    const { name, value } = event.target;

    setCheckinForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (checkinError) setCheckinError('');
    if (checkinSuccess) setCheckinSuccess('');
  };

  const handleClassChange = (event) => {
    const { name, value } = event.target;

    setClassForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (classError) setClassError('');
    if (classSuccess) setClassSuccess('');
  };

  const submitCheckout = async (event) => {
    event.preventDefault();
    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutSuccess('');

    try {
      const response = await fetch('/api/competition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkout',
          ...checkoutForm,
        }),
      });

      const data = await response.json();

      if (!data.status) {
        setCheckoutError(data.message || 'Checkout failed.');
        return;
      }

      setCheckoutSuccess(data.message);
      setCheckoutForm(initialCheckoutForm);
      fetchCompetitionData({ background: true });
    } catch (error) {
      console.error('Competition checkout error:', error);
      setCheckoutError('Network error. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const submitCheckin = async (event) => {
    event.preventDefault();
    setCheckinLoading(true);
    setCheckinError('');
    setCheckinSuccess('');

    try {
      const response = await fetch('/api/competition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkin',
          ...checkinForm,
          teacherVerified: checkinForm.teacherVerified === 'yes',
        }),
      });

      const data = await response.json();

      if (!data.status) {
        setCheckinError(data.message || 'Check-in failed.');
        return;
      }

      setCheckinSuccess(data.message);
      setCheckinForm(initialCheckinForm);
      fetchCompetitionData({ background: true });
    } catch (error) {
      console.error('Competition checkin error:', error);
      setCheckinError('Network error. Please try again.');
    } finally {
      setCheckinLoading(false);
    }
  };

  const submitClassUpdate = async (event) => {
    event.preventDefault();
    setClassLoading(true);
    setClassError('');
    setClassSuccess('');

    try {
      const response = await fetch('/api/competition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateclass',
          ...classForm,
        }),
      });

      const data = await response.json();

      if (!data.status) {
        setClassError(data.message || 'Class update failed.');
        return;
      }

      setClassSuccess(
        `${data.data.patronName} is now in ${data.data.currentClass} (${data.data.categoryLabel}).`,
      );
      setClassForm(initialClassForm);
      fetchCompetitionData({ background: true });
    } catch (error) {
      console.error('Competition class update error:', error);
      setClassError('Network error. Please try again.');
    } finally {
      setClassLoading(false);
    }
  };

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
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div>
            <p className={styles.kicker}>Reading Competition</p>
            <h1 className={styles.title}>
              Run the reading competition by category from one page.
            </h1>
            <p className={styles.subtitle}>
              Staff can log borrowing, update each student&apos;s class, check
              in books with graded summaries, and monitor category winners for
              Primary, Junior Secondary, and Senior Secondary. Only the top 75
              readers across all categories are shown on the leaderboard.
            </p>
          </div>

          <div className={styles.heroActions}>
            <Button
              variant='secondary'
              onClick={() => fetchCompetitionData({ background: true })}
              disabled={refreshing || loading}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Competition Data'}
            </Button>
            {session && (
              <div className={styles.sessionBadge}>
                <strong>{session.title}</strong>
                <span>
                  Session key: <code>{session.sessionKey}</code>
                </span>
              </div>
            )}
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
          <Card title='Loading Competition'>
            <div className={styles.emptyState}>
              <p>
                Fetching competition records, category winners, and rankings.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <section className={styles.statsGrid}>
              <Card title='Participants'>
                <div className={styles.statValue}>
                  {stats?.totalParticipants ?? 0}
                </div>
                <p className={styles.statLabel}>Readers logged this session</p>
              </Card>
              <Card title='Books Logged'>
                <div className={styles.statValue}>
                  {stats?.totalBooksLogged ?? 0}
                </div>
                <p className={styles.statLabel}>
                  Competition checkouts recorded by staff
                </p>
              </Card>
              <Card title='Books Read'>
                <div className={styles.statValue}>
                  {stats?.totalBooksRead ?? 0}
                </div>
                <p className={styles.statLabel}>
                  Completed and checked in with grading
                </p>
              </Card>
              <Card title='Average Grade'>
                <div className={styles.statValue}>
                  {stats?.averageGrade ?? 0}
                </div>
                <p className={styles.statLabel}>
                  Session average across graded summaries
                </p>
              </Card>
              <Card title='Leaderboard Shown'>
                <div className={styles.statValue}>
                  {stats?.leaderboardCount ?? 0}
                </div>
                <p className={styles.statLabel}>
                  Top 75 combined entries across all categories
                </p>
              </Card>
            </section>

            <section className={styles.formsGrid}>
              <Card title='Competition Check-out'>
                <form onSubmit={submitCheckout} className={styles.form}>
                  {checkoutError && (
                    <Alert
                      type='error'
                      message={checkoutError}
                      onClose={() => setCheckoutError('')}
                    />
                  )}
                  {checkoutSuccess && (
                    <Alert
                      type='success'
                      message={checkoutSuccess}
                      onClose={() => setCheckoutSuccess('')}
                    />
                  )}

                  <Input
                    label='Patron Barcode'
                    name='patronBarcode'
                    value={checkoutForm.patronBarcode}
                    onChange={handleCheckoutChange}
                    placeholder='Scan or enter patron barcode'
                    required
                  />
                  <Input
                    label='Book Barcode'
                    name='itemBarcode'
                    value={checkoutForm.itemBarcode}
                    onChange={handleCheckoutChange}
                    placeholder='Scan or enter book barcode'
                    required
                  />

                  <div className={styles.formActions}>
                    <Button
                      type='submit'
                      variant='primary'
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading
                        ? 'Recording checkout...'
                        : 'Record Competition Checkout'}
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={() => {
                        setCheckoutForm(initialCheckoutForm);
                        setCheckoutError('');
                        setCheckoutSuccess('');
                      }}
                      disabled={checkoutLoading}
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title='Competition Check-in and Grading'>
                <form onSubmit={submitCheckin} className={styles.form}>
                  {checkinError && (
                    <Alert
                      type='error'
                      message={checkinError}
                      onClose={() => setCheckinError('')}
                    />
                  )}
                  {checkinSuccess && (
                    <Alert
                      type='success'
                      message={checkinSuccess}
                      onClose={() => setCheckinSuccess('')}
                    />
                  )}

                  <Input
                    label='Patron Barcode'
                    name='patronBarcode'
                    value={checkinForm.patronBarcode}
                    onChange={handleCheckinChange}
                    placeholder='Scan or enter patron barcode'
                    required
                  />
                  <Input
                    label='Book Barcode'
                    name='itemBarcode'
                    value={checkinForm.itemBarcode}
                    onChange={handleCheckinChange}
                    placeholder='Scan or enter book barcode'
                    required
                  />
                  <TextArea
                    label='Student Summary'
                    name='summary'
                    value={checkinForm.summary}
                    onChange={handleCheckinChange}
                    placeholder='Optional student summary for staff records.'
                    rows={5}
                  />
                  <Input
                    label='Grade'
                    name='grade'
                    type='number'
                    min='0'
                    max='100'
                    value={checkinForm.grade}
                    onChange={handleCheckinChange}
                    placeholder='0 - 100'
                    required
                  />
                  <Select
                    label='Teacher Verified'
                    name='teacherVerified'
                    value={checkinForm.teacherVerified}
                    onChange={handleCheckinChange}
                    options={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                  />
                  <TextArea
                    label='Staff Feedback'
                    name='feedback'
                    value={checkinForm.feedback}
                    onChange={handleCheckinChange}
                    placeholder='Optional notes about the quality of the summary.'
                    rows={3}
                  />

                  <div className={styles.formActions}>
                    <Button
                      type='submit'
                      variant='primary'
                      disabled={checkinLoading}
                    >
                      {checkinLoading
                        ? 'Recording check-in...'
                        : 'Check In and Grade'}
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={() => {
                        setCheckinForm(initialCheckinForm);
                        setCheckinError('');
                        setCheckinSuccess('');
                      }}
                      disabled={checkinLoading}
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title='Update Patron Class'>
                <form onSubmit={submitClassUpdate} className={styles.form}>
                  {classError && (
                    <Alert
                      type='error'
                      message={classError}
                      onClose={() => setClassError('')}
                    />
                  )}
                  {classSuccess && (
                    <Alert
                      type='success'
                      message={classSuccess}
                      onClose={() => setClassSuccess('')}
                    />
                  )}
                  <Select
                    label='Current Class'
                    name='currentClass'
                    value={classForm.currentClass}
                    onChange={handleClassChange}
                    options={classOptions}
                  />
                  <Input
                    label='Patron Barcode'
                    name='patronBarcode'
                    value={classForm.patronBarcode}
                    onChange={handleClassChange}
                    placeholder='Scan or enter patron barcode'
                    required
                  />
                  <div className={styles.formActions}>
                    <Button
                      type='submit'
                      variant='primary'
                      disabled={classLoading}
                    >
                      {classLoading ? 'Updating class...' : 'Update Class'}
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={() => {
                        setClassForm(initialClassForm);
                        setClassError('');
                        setClassSuccess('');
                      }}
                      disabled={classLoading}
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title='Competition Rules'>
                <div className={styles.ruleList}>
                  <div className={styles.ruleItem}>
                    All competition borrowing is logged from this page by staff.
                  </div>
                  <div className={styles.ruleItem}>
                    Competition borrowing has no due date on this page.
                  </div>
                  <div className={styles.ruleItem}>
                    Check-in requires a grade. Student summary and staff
                    feedback are optional.
                  </div>
                  <div className={styles.ruleItem}>
                    Staff can update a patron&apos;s current class here so the
                    student appears in the right category.
                  </div>
                  <div className={styles.ruleItem}>
                    Winners are chosen separately for Senior Secondary, Junior
                    Secondary, and Primary categories.
                  </div>
                  <div className={styles.ruleItem}>
                    The displayed leaderboard is capped at the top 75 readers
                    combined across all categories.
                  </div>
                  <div className={styles.ruleItem}>
                    Ranking follows average grade first, then books read, then
                    teacher verification count.
                  </div>
                </div>
              </Card>
            </section>

            <section className={styles.winnersGrid}>
              {categoryWinners.map((category) => (
                <Card
                  key={category.categoryKey}
                  title={`${category.categoryLabel} Winner`}
                >
                  {category.winner ? (
                    <div className={styles.winnerCard}>
                      <strong>{category.winner.patronName}</strong>
                      <span>{category.winner.patronBarcode}</span>
                      <span>
                        {category.winner.currentClass || 'Class not set'}
                      </span>
                      <div className={styles.winnerMetrics}>
                        <span>{category.winner.booksRead} books read</span>
                        <span>
                          {category.winner.averageGrade} average grade
                        </span>
                        <span>
                          {category.winner.teacherVerifiedCount} verified
                          summaries
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <p>No winner yet in this category.</p>
                    </div>
                  )}
                </Card>
              ))}
            </section>

            <section className={styles.leaderboardSection}>
              <Card title='Top 75 Combined Leaderboard'>
                {leaderboard.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>
                      No competition results yet. Start with a checkout to begin
                      tracking this session.
                    </p>
                  </div>
                ) : (
                  <div className={styles.leaderboardList}>
                    {leaderboard.map((entry) => (
                      <div key={entry.patronBarcode} className={styles.rankRow}>
                        <div className={styles.rankNumber}>#{entry.rank}</div>
                        <div className={styles.rankIdentity}>
                          <strong>{entry.patronName}</strong>
                          <span>
                            {entry.patronBarcode} -{' '}
                            {entry.currentClass || 'Class not set'}
                          </span>
                          <span>{entry.categoryLabel}</span>
                        </div>
                        <div className={styles.rankMetrics}>
                          <div>
                            <strong>{entry.booksRead}</strong>
                            <span>Books Read</span>
                          </div>
                          <div>
                            <strong>{entry.averageGrade}</strong>
                            <span>Average Grade</span>
                          </div>
                          <div>
                            <strong>{entry.teacherVerifiedCount}</strong>
                            <span>Verified</span>
                          </div>
                          <div>
                            <strong>{entry.activeLoans}</strong>
                            <span>Active Loans</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            <section className={styles.categoryBoardGrid}>
              {categoryLeaderboards.map((category) => (
                <Card
                  key={category.categoryKey}
                  title={`${category.categoryLabel} Rankings`}
                >
                  {category.entries.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>
                        No ranked readers from this category in the top 75 yet.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.categoryList}>
                      {category.entries.map((entry) => (
                        <div
                          key={`${category.categoryKey}-${entry.patronBarcode}`}
                          className={styles.categoryRow}
                        >
                          <div className={styles.categoryRank}>
                            #{entry.categoryRank}
                          </div>
                          <div className={styles.categoryIdentity}>
                            <strong>{entry.patronName}</strong>
                            <span>
                              {entry.currentClass || 'Class not set'} - Global #
                              {entry.rank}
                            </span>
                          </div>
                          <div className={styles.categoryStats}>
                            <span>{entry.booksRead} books</span>
                            <span>{entry.averageGrade} grade</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}

              {uncategorizedLeaderboard.length > 0 && (
                <Card title='Uncategorized Readers'>
                  <div className={styles.categoryList}>
                    {uncategorizedLeaderboard.map((entry) => (
                      <div
                        key={`uncategorized-${entry.patronBarcode}`}
                        className={styles.categoryRow}
                      >
                        <div className={styles.categoryRank}>
                          #{entry.categoryRank}
                        </div>
                        <div className={styles.categoryIdentity}>
                          <strong>{entry.patronName}</strong>
                          <span>
                            {entry.currentClass || 'Class not set'} - Global #
                            {entry.rank}
                          </span>
                        </div>
                        <div className={styles.categoryStats}>
                          <span>{entry.booksRead} books</span>
                          <span>{entry.averageGrade} grade</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </section>

            <section className={styles.activityGrid}>
              <Card title='Active Competition Checkouts'>
                {activeCheckouts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No books are currently out for this competition.</p>
                  </div>
                ) : (
                  <div className={styles.activityList}>
                    {activeCheckouts.map((record) => (
                      <div key={record.id} className={styles.activityItem}>
                        <div>
                          <strong>{record.bookTitle}</strong>
                          <span>
                            {record.bookBarcode} - {record.patronName}
                          </span>
                        </div>
                        <div className={styles.activityMeta}>
                          <span>Out: {formatDate(record.checkoutDate)}</span>
                          <span>
                            {record.currentClass || 'Class not set'} -{' '}
                            {record.categoryLabel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title='Recent Check-ins and Grades'>
                {recentCheckins.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No graded check-ins have been recorded yet.</p>
                  </div>
                ) : (
                  <div className={styles.activityList}>
                    {recentCheckins.map((record) => (
                      <div key={record.id} className={styles.activityItem}>
                        <div>
                          <strong>{record.bookTitle}</strong>
                          <span>
                            {record.patronName} - Grade {record.grade}
                          </span>
                        </div>
                        <div className={styles.activityMeta}>
                          <span>
                            Checked in: {formatDate(record.checkinDate)}
                          </span>
                          <span>
                            {record.currentClass || 'Class not set'} -{' '}
                            {record.categoryLabel}
                          </span>
                          <span>
                            {record.teacherVerified
                              ? 'Teacher verified'
                              : 'Awaiting teacher verification'}
                          </span>
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

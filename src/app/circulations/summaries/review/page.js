'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import styles from '../../circulation.module.css';

export default function ReviewSummariesPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewData, setReviewData] = useState({});

  useEffect(() => {
    fetchPendingSummaries();
  }, []);

  const fetchPendingSummaries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/book-summaries?status=pending');
      const data = await response.json();

      if (data.status) {
        setSummaries(data.data);
      } else {
        setError(data.message || 'Failed to fetch summaries');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Summaries fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDataChange = (summaryId, field, value) => {
    // Validate points field
    if (field === 'points') {
      const numValue = parseInt(value);
      if (value !== '' && (numValue < 1 || numValue > 20)) {
        setError('No way! Points must be between 1 and 20.');
        return; // Don't update the state
      } else {
        setError(''); // Clear error if valid
      }
    }

    setReviewData((prev) => ({
      ...prev,
      [summaryId]: {
        ...prev[summaryId],
        [field]: value,
      },
    }));
  };

  const handleReviewSummary = async (summaryId, status) => {
    const review = reviewData[summaryId] || {};

    if (status === 'approved') {
      if (!review.points || review.points < 1) {
        setError('Please specify points to award for approved summaries.');
        return;
      }
      if (review.points > 20) {
        setError('No way! Points cannot exceed 20.');
        return;
      }
    }

    try {
      setReviewing((prev) => ({ ...prev, [summaryId]: true }));
      setError('');

      const response = await fetch(`/api/book-summaries/${summaryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          points: status === 'approved' ? parseInt(review.points) || 0 : 0,
          feedback: review.feedback || '',
        }),
      });

      const data = await response.json();

      if (data.status) {
        setSuccess(
          `Summary ${status} successfully! ${
            status === 'approved' ? `${review.points} points awarded.` : ''
          }`
        );

        // Remove the reviewed summary from the list
        setSummaries((prev) => prev.filter((s) => s._id !== summaryId));

        // Clear review data for this summary
        setReviewData((prev) => {
          const newData = { ...prev };
          delete newData[summaryId];
          return newData;
        });
      } else {
        setError(data.message || `Failed to ${status} summary`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Review summary error:', err);
    } finally {
      setReviewing((prev) => ({ ...prev, [summaryId]: false }));
    }
  };

  const getStarRating = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📋 Review Book Summaries</h1>
        <p className={styles.pageSubtitle}>
          Review and approve patron book summaries to award points. Only
          summaries for returned books can be reviewed.
        </p>
      </div>

      {error && (
        <Alert type='error' message={error} onClose={() => setError('')} />
      )}
      {success && (
        <Alert
          type='success'
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      <div className={styles.reviewContainer}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading pending summaries...</p>
          </div>
        ) : summaries.length === 0 ? (
          <Card title='No Pending Reviews'>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✅</div>
              <h3>All Caught Up!</h3>
              <p>There are no book summaries pending review at this time.</p>
              <Button variant='primary' onClick={fetchPendingSummaries}>
                Refresh
              </Button>
            </div>
          </Card>
        ) : (
          <div className={styles.reviewGrid}>
            {summaries.map((summary) => {
              const review = reviewData[summary._id] || {};
              const isReviewing = reviewing[summary._id];

              return (
                <Card
                  key={summary._id}
                  title={`Review Summary - ${summary.bookTitle}`}
                >
                  <div className={styles.reviewCard}>
                    {/* Summary Info */}
                    <div className={styles.summaryInfo}>
                      <div className={styles.summaryMeta}>
                        <div className={styles.metaItem}>
                          <strong>Patron:</strong> {summary.patronName}
                        </div>
                        <div className={styles.metaItem}>
                          <strong>Barcode:</strong> {summary.patronBarcode}
                        </div>
                        <div className={styles.metaItem}>
                          <strong>Book:</strong> {summary.bookTitle}
                        </div>
                        <div className={styles.metaItem}>
                          <strong>Submitted:</strong>{' '}
                          {formatDate(summary.submissionDate)}
                        </div>
                        <div className={styles.metaItem}>
                          <strong>Rating:</strong>{' '}
                          {getStarRating(summary.rating)} ({summary.rating}/5)
                        </div>
                        <div className={styles.metaItem}>
                          <strong>Length:</strong> {summary.summary.length}{' '}
                          characters
                        </div>
                      </div>
                    </div>

                    {/* Summary Content */}
                    <div className={styles.summaryContent}>
                      <h4>Book Summary:</h4>
                      <div className={styles.summaryText}>
                        {summary.summary}
                      </div>
                    </div>

                    {/* Review Form */}
                    <div className={styles.reviewForm}>
                      <div className={styles.reviewInputs}>
                        <div className={styles.pointsInput}>
                          <Input
                            label='Points to Award'
                            type='number'
                            value={review.points || ''}
                            onChange={(e) =>
                              handleReviewDataChange(
                                summary._id,
                                'points',
                                e.target.value
                              )
                            }
                            onBlur={(e) => {
                              const value = parseInt(e.target.value);
                              if (
                                e.target.value !== '' &&
                                (value < 1 || value > 20)
                              ) {
                                setError(
                                  'No way! Points must be between 1 and 20.'
                                );
                              }
                            }}
                            min='1'
                            max='20'
                            placeholder='Enter points (1-20)'
                          />
                        </div>

                        <div className={styles.feedbackInput}>
                          <label className={styles.label}>
                            Feedback (Optional)
                          </label>
                          <textarea
                            value={review.feedback || ''}
                            onChange={(e) =>
                              handleReviewDataChange(
                                summary._id,
                                'feedback',
                                e.target.value
                              )
                            }
                            placeholder='Provide feedback to the patron about their summary...'
                            className={styles.feedbackTextarea}
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className={styles.reviewActions}>
                        <Button
                          variant='danger'
                          onClick={() =>
                            handleReviewSummary(summary._id, 'rejected')
                          }
                          disabled={isReviewing}
                        >
                          {isReviewing ? 'Processing...' : '❌ Reject'}
                        </Button>
                        <Button
                          variant='success'
                          onClick={() =>
                            handleReviewSummary(summary._id, 'approved')
                          }
                          disabled={isReviewing || !review.points}
                        >
                          {isReviewing
                            ? 'Processing...'
                            : `✅ Approve (+${review.points || 0} pts)`}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

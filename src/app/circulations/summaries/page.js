'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import styles from '../circulation.module.css';

export default function BookSummariesPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  // Form data for new summary
  const [formData, setFormData] = useState({
    patronBarcode: '',
    bookBarcode: '',
    summary: '',
    rating: 5,
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    patronBarcode: '',
  });

  useEffect(() => {
    fetchSummaries();
  }, [filters]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.patronBarcode)
        params.append('patronBarcode', filters.patronBarcode);

      const response = await fetch(`/api/book-summaries?${params.toString()}`);
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitSummary = async (e) => {
    e.preventDefault();

    if (!formData.patronBarcode || !formData.bookBarcode || !formData.summary) {
      setError('All fields are required.');
      return;
    }

    if (formData.summary.length < 100) {
      setError('Summary must be at least 100 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch('/api/book-summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status) {
        setSuccess(
          'Book summary submitted successfully! It will be reviewed by staff.'
        );
        setFormData({
          patronBarcode: '',
          bookBarcode: '',
          summary: '',
          rating: 5,
        });
        setShowSubmitForm(false);
        fetchSummaries(); // Refresh the list
      } else {
        setError(data.message || 'Failed to submit summary');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Submit summary error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: '⏳ Pending Review' },
      approved: { variant: 'success', label: '✅ Approved' },
      rejected: { variant: 'danger', label: '❌ Rejected' },
    };
    const config = statusConfig[status] || {
      variant: 'default',
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📝 Book Summaries</h1>
        <p className={styles.pageSubtitle}>
          Submit and manage book summaries for extra points
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

      <div className={styles.contentGrid}>
        {/* Submit New Summary */}
        <Card title='Submit Book Summary'>
          {!showSubmitForm ? (
            <div className={styles.submitPrompt}>
              <p>
                📚 Have you finished reading a book? Share your thoughts and
                earn bonus points!
              </p>
              <Button variant='primary' onClick={() => setShowSubmitForm(true)}>
                + Submit New Summary
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitSummary} className={styles.summaryForm}>
              <div className={styles.formGrid}>
                <Input
                  label='Patron Barcode *'
                  value={formData.patronBarcode}
                  onChange={(e) =>
                    handleInputChange('patronBarcode', e.target.value)
                  }
                  placeholder='Scan or type patron barcode'
                  required
                />

                <Input
                  label='Book Barcode *'
                  value={formData.bookBarcode}
                  onChange={(e) =>
                    handleInputChange('bookBarcode', e.target.value)
                  }
                  placeholder='Scan or type book barcode'
                  required
                />

                <Select
                  label='Rating *'
                  value={formData.rating}
                  onChange={(e) =>
                    handleInputChange('rating', parseInt(e.target.value))
                  }
                  options={[
                    { value: 5, label: '⭐⭐⭐⭐⭐ Excellent (5 stars)' },
                    { value: 4, label: '⭐⭐⭐⭐ Good (4 stars)' },
                    { value: 3, label: '⭐⭐⭐ Average (3 stars)' },
                    { value: 2, label: '⭐⭐ Poor (2 stars)' },
                    { value: 1, label: '⭐ Very Poor (1 star)' },
                  ]}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Book Summary * (Current: {formData.summary.length} characters)
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder='Write a detailed summary of the book. What was it about? What did you learn? What did you like or dislike? Be specific and thoughtful. (Minimum 100 characters)'
                  className={styles.summaryTextarea}
                  rows={8}
                  required
                  minLength={100}
                />
                <div className={styles.characterCount}>
                  {formData.summary.length < 100 && (
                    <span className={styles.characterWarning}>
                      Need {100 - formData.summary.length} more characters
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <Button
                  type='submit'
                  variant='primary'
                  disabled={submitting || formData.summary.length < 100}
                >
                  {submitting ? 'Submitting...' : 'Submit Summary'}
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => {
                    setShowSubmitForm(false);
                    setFormData({
                      patronBarcode: '',
                      bookBarcode: '',
                      summary: '',
                      rating: 5,
                    });
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Filters and Summary List */}
        <Card title='Summary Management'>
          <div className={styles.filtersSection}>
            <div className={styles.filtersGrid}>
              <Select
                label='Filter by Status'
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={statusOptions}
              />
              <Input
                label='Filter by Patron Barcode'
                value={filters.patronBarcode}
                onChange={(e) =>
                  handleFilterChange('patronBarcode', e.target.value)
                }
                placeholder='Enter patron barcode'
              />
              <div className={styles.filterActions}>
                <Button
                  variant='secondary'
                  onClick={() => setFilters({ status: '', patronBarcode: '' })}
                >
                  Clear Filters
                </Button>
                <Button
                  variant='primary'
                  onClick={fetchSummaries}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading summaries...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <h3>No Summaries Found</h3>
              <p>
                {Object.values(filters).some((f) => f)
                  ? 'No summaries match your current filters.'
                  : 'No book summaries have been submitted yet.'}
              </p>
            </div>
          ) : (
            <div className={styles.summariesList}>
              <div className={styles.summariesStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{summaries.length}</span>
                  <span className={styles.statLabel}>Total Summaries</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>
                    {summaries.filter((s) => s.status === 'approved').length}
                  </span>
                  <span className={styles.statLabel}>Approved</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>
                    {summaries.filter((s) => s.status === 'pending').length}
                  </span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
              </div>

              <div className={styles.summaryCards}>
                {summaries.map((summary) => (
                  <div key={summary._id} className={styles.summaryCard}>
                    <div className={styles.summaryHeader}>
                      <div className={styles.summaryTitle}>
                        <strong>{summary.bookTitle}</strong>
                        <span className={styles.summaryBarcode}>
                          {summary.bookBarcode}
                        </span>
                      </div>
                      {getStatusBadge(summary.status)}
                    </div>

                    <div className={styles.summaryMeta}>
                      <span>
                        👤 {summary.patronName} ({summary.patronBarcode})
                      </span>
                      <span>📅 {formatDate(summary.submissionDate)}</span>
                      <span>⭐ {summary.rating}/5 stars</span>
                      {summary.points > 0 && (
                        <span className={styles.pointsAwarded}>
                          +{summary.points} pts
                        </span>
                      )}
                    </div>

                    <div className={styles.summaryContent}>
                      <p>{summary.summary}</p>
                    </div>

                    {summary.feedback && (
                      <div className={styles.summaryFeedback}>
                        <strong>Staff Feedback:</strong>
                        <p>{summary.feedback}</p>
                        {summary.reviewedBy && (
                          <small>
                            Reviewed by: {summary.reviewedBy} on{' '}
                            {formatDate(summary.reviewDate)}
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

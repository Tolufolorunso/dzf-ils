'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import StudentNav from '@/components/layout/StudentNav';
import styles from './submit-summary.module.css';

export default function PublicSubmitSummaryPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    patronBarcode: '',
    bookBarcode: '',
    summary: '',
    rating: 5,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
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
          '🎉 Book summary submitted successfully! Your summary will be reviewed by library staff and you will earn points once approved.'
        );
        setFormData({
          patronBarcode: '',
          bookBarcode: '',
          summary: '',
          rating: 5,
        });
      } else {
        // Enhanced error message for duplicate summaries
        if (data.existingSummary) {
          const existingSummary = data.existingSummary;
          const submissionDate = new Date(
            existingSummary.submissionDate
          ).toLocaleDateString();
          let statusInfo = '';

          if (existingSummary.status === 'pending') {
            statusInfo =
              '⏳ Your summary is currently being reviewed by staff.';
          } else if (existingSummary.status === 'approved') {
            statusInfo = `✅ Your summary was approved and you earned ${existingSummary.points} points!`;
          } else if (existingSummary.status === 'rejected') {
            statusInfo = '❌ Your summary was reviewed but not approved.';
          }

          setError(
            `${data.message}\n\n📅 Submitted: ${submissionDate}\n⭐ Your Rating: ${existingSummary.rating}/5\n${statusInfo}`
          );
        } else {
          setError(data.message || 'Failed to submit summary');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Submit summary error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patronBarcode: '',
      bookBarcode: '',
      summary: '',
      rating: 5,
    });
    setError('');
    setSuccess('');
  };

  return (
    <>
      <StudentNav />
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>📚 Submit Book Summary</h1>
          <p className={styles.pageSubtitle}>
            Share your thoughts about the book you read and earn bonus points!
          </p>
        </div>

        <div className={styles.contentContainer}>
          <Card title='Book Summary Submission'>
            {error && (
              <Alert
                type='error'
                message={error}
                onClose={() => setError('')}
              />
            )}
            {success && (
              <Alert
                type='success'
                message={success}
                onClose={() => setSuccess('')}
              />
            )}

            <form onSubmit={handleSubmitSummary} className={styles.summaryForm}>
              <div className={styles.instructionsCard}>
                <h3>📝 Instructions</h3>
                <ul>
                  <li>
                    ✅ Make sure you have borrowed and returned the book to the
                    library
                  </li>
                  <li>📖 You must have finished reading the book completely</li>
                  <li>
                    ✍️ Write a thoughtful summary of at least 100 characters
                  </li>
                  <li>
                    💭 Include what you learned and what you liked/disliked
                  </li>
                  <li>⭐ Rate the book honestly from 1-5 stars</li>
                  <li>👨‍🏫 Your summary will be reviewed by library staff</li>
                  <li>
                    🏆 You&apos;ll earn bonus points once your summary is
                    approved!
                  </li>
                </ul>
              </div>

              <div className={styles.formGrid}>
                <Input
                  label='Your Library Barcode *'
                  value={formData.patronBarcode}
                  onChange={(e) =>
                    handleInputChange('patronBarcode', e.target.value)
                  }
                  placeholder='Enter your library barcode number'
                  required
                  autoFocus
                />

                <Input
                  label='Book Barcode *'
                  value={formData.bookBarcode}
                  onChange={(e) =>
                    handleInputChange('bookBarcode', e.target.value)
                  }
                  placeholder='Enter the book barcode number'
                  required
                />

                <Select
                  label='How would you rate this book? *'
                  value={formData.rating}
                  onChange={(e) =>
                    handleInputChange('rating', parseInt(e.target.value))
                  }
                  options={[
                    { value: 5, label: '⭐⭐⭐⭐⭐ Excellent - I loved it!' },
                    { value: 4, label: '⭐⭐⭐⭐ Good - I enjoyed it' },
                    { value: 3, label: '⭐⭐⭐ Okay - It was alright' },
                    { value: 2, label: "⭐⭐ Poor - I didn't like it much" },
                    {
                      value: 1,
                      label: "⭐ Very Poor - I didn't like it at all",
                    },
                  ]}
                  required
                />
              </div>

              <div className={styles.summarySection}>
                <label className={styles.summaryLabel}>
                  Write Your Book Summary *
                  <span className={styles.characterCount}>
                    ({formData.summary.length} characters)
                  </span>
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  placeholder="Write a detailed summary of the book here. Tell us:
• What was the book about?
• What happened in the story?
• What did you learn from reading it?
• What did you like most about it?
• What didn't you like?
• Would you recommend it to other students? Why?

Be specific and share your honest thoughts! (Minimum 100 characters)"
                  className={styles.summaryTextarea}
                  rows={12}
                  required
                  minLength={100}
                />
                <div className={styles.characterFeedback}>
                  {formData.summary.length < 100 ? (
                    <span className={styles.characterWarning}>
                      ⚠️ You need {100 - formData.summary.length} more
                      characters
                    </span>
                  ) : (
                    <span className={styles.characterSuccess}>
                      ✅ Great! Your summary is long enough
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formActions}>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Clear Form
                </Button>
                <Button
                  type='submit'
                  variant='primary'
                  disabled={submitting || formData.summary.length < 100}
                >
                  {submitting ? 'Submitting Summary...' : 'Submit Book Summary'}
                </Button>
              </div>
            </form>
          </Card>

          <Card title='Why Submit Book Summaries?'>
            <div className={styles.benefitsSection}>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>🏆</div>
                <div className={styles.benefitContent}>
                  <h4>Earn Bonus Points</h4>
                  <p>
                    Get extra points added to your library account when your
                    summary is approved by staff.
                  </p>
                </div>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>📈</div>
                <div className={styles.benefitContent}>
                  <h4>Climb the Leaderboard</h4>
                  <p>
                    Book summaries are worth more points than just borrowing
                    books - show your reading skills!
                  </p>
                </div>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>🧠</div>
                <div className={styles.benefitContent}>
                  <h4>Improve Your Skills</h4>
                  <p>
                    Writing summaries helps you understand books better and
                    improves your writing abilities.
                  </p>
                </div>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitIcon}>👥</div>
                <div className={styles.benefitContent}>
                  <h4>Help Other Students</h4>
                  <p>
                    Your reviews help other students decide which books they
                    might want to read next.
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

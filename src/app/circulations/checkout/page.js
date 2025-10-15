'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import styles from '../circulation.module.css';

import Avatar from '@/components/ui/Avatar';

export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    patronBarcode: '',
    itemBarcode: '',
    eventTitle: '',
    dueDay: 2,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
    if (checkoutResult) setCheckoutResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setCheckoutResult(null);

    try {
      const response = await fetch('/api/circulations/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status) {
        setSuccess(data.message);
        setCheckoutResult(data.checkedOut);

        // Clear form after successful checkout
        setTimeout(() => {
          setFormData({
            patronBarcode: '',
            itemBarcode: '',
            eventTitle: '',
            dueDay: 2,
          });
          setSuccess('');
          // setCheckoutResult(null);
        }, 5000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patronBarcode: '',
      itemBarcode: '',
      eventTitle: '',
      dueDay: 2,
    });
    setError('');
    setSuccess('');
    setCheckoutResult(null);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Book Checkout</h1>
        <p className={styles.pageSubtitle}>
          Check out books to patrons using their barcode information
        </p>
      </div>

      <div className={styles.contentGrid}>
        <Card title='Checkout Information'>
          <form onSubmit={handleSubmit} className={styles.form}>
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

            <Input
              label='Patron Barcode'
              name='patronBarcode'
              type='text'
              value={formData.patronBarcode}
              onChange={handleInputChange}
              placeholder='Scan or enter patron barcode'
              required
              autoFocus
            />

            <Input
              label='Item Barcode'
              name='itemBarcode'
              type='text'
              value={formData.itemBarcode}
              onChange={handleInputChange}
              placeholder='Scan or enter item barcode'
              required
            />

            <Input
              label='Event Title (Optional)'
              name='eventTitle'
              type='text'
              value={formData.eventTitle}
              onChange={handleInputChange}
              placeholder='e.g., Summer Reading Program'
            />

            <Input
              label='Due Days'
              name='dueDay'
              type='number'
              value={formData.dueDay}
              onChange={handleInputChange}
              min='1'
              max='30'
              required
            />

            <div className={styles.formActions}>
              <Button
                type='submit'
                variant='primary'
                disabled={loading}
                className={styles.submitButton}
              >
                {loading ? 'Processing...' : 'Checkout Item'}
              </Button>

              <Button
                type='button'
                variant='secondary'
                onClick={resetForm}
                disabled={loading}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Card>

        {checkoutResult && (
          <Card
            title='Checkout Successful'
            footer={
              <Button onClick={() => setCheckoutResult(null)}>Clear</Button>
            }
          >
            <div className={styles.resultCard}>
              <div className={styles.resultItem}>
                <Avatar
                  src={checkoutResult.patronImage}
                  alt='Item Image'
                  size='lg'
                />
              </div>
              <div className={styles.resultItem}>
                <strong>Title:</strong> {checkoutResult.title}
              </div>
              <div className={styles.resultItem}>
                <strong>Patron Name:</strong> {checkoutResult.patronName}
              </div>
              <div className={styles.resultItem}>
                <strong>Patron ID:</strong> {checkoutResult.patronBarcode}
              </div>
              <div className={styles.resultItem}>
                <strong>Item Barcode:</strong> {checkoutResult.itemBarcode}
              </div>
              <div className={styles.resultItem}>
                <strong>Due Date:</strong> {checkoutResult.dueDate}
              </div>
            </div>
          </Card>
        )}

        <Card title='Checkout Guidelines'>
          <div className={styles.guidelines}>
            <ul className={styles.guidelinesList}>
              <li>Ensure patron has uploaded a passport photograph</li>
              <li>Verify patron is not currently borrowing another item</li>
              <li>Check that the item is available for checkout</li>
              <li>Default due period is 2 days, adjust as needed</li>
              <li>Record event title for special programs</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

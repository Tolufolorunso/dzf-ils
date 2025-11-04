'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import styles from '../catalog.module.css';

export default function CatalogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (params.barcode) {
      fetchItem();
    }
  }, [params.barcode]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const decodedBarcode = decodeURIComponent(params.barcode);
      console.log('Fetching item with barcode:', decodedBarcode);
      const response = await fetch(
        `/api/catalogs/${encodeURIComponent(decodedBarcode)}`
      );
      const data = await response.json();

      if (data.status) {
        setItem(data.data);
      } else {
        setError(data.message || 'Failed to fetch catalog item');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Catalog item fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityBadge = (item) => {
    if (item.isCheckedOut) {
      return <Badge variant='warningBadge'>Checked Out</Badge>;
    }
    return <Badge variant='successBadge'>Available</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatArray = (arr) => {
    if (!arr || arr.length === 0) return 'N/A';
    return Array.isArray(arr) ? arr.join(', ') : arr;
  };

  const handleDelete = async () => {
    if (!item) return;

    const expectedText = `DELETE ${item.barcode}`;
    if (deleteConfirmText !== expectedText) {
      setError(`Please type "${expectedText}" to confirm deletion.`);
      return;
    }

    try {
      setDeleting(true);
      setError('');

      const response = await fetch(
        `/api/catalogs/${encodeURIComponent(item.barcode)}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (data.status) {
        setSuccess('Catalog item deleted successfully. Redirecting...');
        setTimeout(() => {
          router.push('/catalog');
        }, 2000);
      } else {
        setError(data.message || 'Failed to delete catalog item');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Delete catalog item error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
    setError('');
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setError('');
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading catalog item...</p>
        </div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <Alert type='error' message={error} />
          <Link href='/catalog'>
            <Button variant='primary'>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <Alert type='error' message='Catalog item not found' />
          <Link href='/catalog'>
            <Button variant='primary'>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>{item.title?.mainTitle || 'N/A'}</h1>
          {item.title?.subtitle && (
            <p className={styles.pageSubtitle}>{item.title.subtitle}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          <Link href='/catalog'>
            <Button variant='secondary'>← Back to Catalog</Button>
          </Link>
          <Link href={`/catalog/${item.barcode}/edit`}>
            <Button variant='primary'>Edit Item</Button>
          </Link>
          <Button
            variant='danger'
            onClick={openDeleteConfirm}
            disabled={deleting || item.isCheckedOut}
          >
            🗑️ Delete Item
          </Button>
        </div>
      </div>

      {error && (
        <Alert type='error' message={error} onClose={() => setError('')} />
      )}
      {success && <Alert type='success' message={success} />}

      <div className={styles.detailGrid}>
        {/* Basic Information */}
        <Card title='Basic Information'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Title:</label>
              <span>{item.title?.mainTitle || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Subtitle:</label>
              <span>{item.title?.subtitle || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Main Author:</label>
              <span>{item.author?.mainAuthor || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Additional Authors:</label>
              <span>{formatArray(item.author?.additionalAuthors)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Classification:</label>
              <span>{item.classification || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Language:</label>
              <span>{item.language || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Publication Information */}
        <Card title='Publication Information'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Publisher:</label>
              <span>{item.publicationInfo?.publisher || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Place:</label>
              <span>{item.publicationInfo?.place || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Year:</label>
              <span>{item.publicationInfo?.year || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>ISBN:</label>
              <span>{item.ISBN || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Item Details */}
        <Card title='Item Details'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Barcode:</label>
              <span>
                <code className={styles.barcode}>{item.barcode}</code>
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Control Number:</label>
              <span>
                <code className={styles.barcode}>{item.controlNumber}</code>
              </span>
            </div>
            <div className={styles.infoItem}>
              <label>Library:</label>
              <span>{item.library || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Availability:</label>
              <span>{getAvailabilityBadge(item)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Holdings Information:</label>
              <span>{item.holdingsInformation || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <Card title='Additional Information'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Index Terms/Genre:</label>
              <span>{formatArray(item.indexTermGenre)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Physical Description:</label>
              <span>{item.physicalDescription || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Information Summary:</label>
              <span>{item.informationSummary || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* System Information */}
        <Card title='System Information'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Created:</label>
              <span>{formatDate(item.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Last Updated:</label>
              <span>{formatDate(item.updatedAt)}</span>
            </div>
          </div>
        </Card>

        {/* Checkout History */}
        {item.patronsCheckedOutHistory &&
          item.patronsCheckedOutHistory.length > 0 && (
            <Card title='Checkout History'>
              <div className={styles.historyList}>
                {item.patronsCheckedOutHistory.map((checkout, index) => (
                  <div key={index} className={styles.historyItem}>
                    <div className={styles.historyItemHeader}>
                      <strong>{checkout.fullname || 'N/A'}</strong>
                      <Badge variant='info'>{checkout.barcode}</Badge>
                    </div>
                    <div className={styles.historyItemDetails}>
                      <span>
                        Checked out: {formatDate(checkout.checkedOutAt)}
                      </span>
                      <span>Due: {formatDate(checkout.dueDate)}</span>
                      <span>Contact: {checkout.contactNumber || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.cropperModal}>
          <div className={styles.cropperContent}>
            <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>
              ⚠️ Delete Catalog Item
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', color: '#374151' }}>
                <strong>WARNING:</strong> This action cannot be undone. The
                catalog item will be permanently removed from the system.
              </p>
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b' }}>
                  <strong>Item Details:</strong>
                  <br />
                  Title: {item.title?.mainTitle}
                  <br />
                  Barcode: {item.barcode}
                  <br />
                  Control Number: {item.controlNumber}
                </p>
              </div>
              <p style={{ marginBottom: '1rem', color: '#374151' }}>
                To confirm deletion, please type:{' '}
                <strong>DELETE {item.barcode}</strong>
              </p>
              <input
                type='text'
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={`Type "DELETE ${item.barcode}" to confirm`}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                }}
                disabled={deleting}
              />
            </div>
            <div className={styles.cropperActions}>
              <Button
                variant='secondary'
                onClick={closeDeleteConfirm}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant='danger'
                onClick={handleDelete}
                disabled={
                  deleting || deleteConfirmText !== `DELETE ${item.barcode}`
                }
              >
                {deleting ? 'Deleting...' : 'Delete Item'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

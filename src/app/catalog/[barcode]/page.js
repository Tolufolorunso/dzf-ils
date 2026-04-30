'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Edit,
  Hash,
  Library,
  Trash2,
} from 'lucide-react';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import styles from '../catalog.module.css';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const formatArray = (value) => {
  if (!value || value.length === 0) return 'N/A';
  return Array.isArray(value) ? value.join(', ') : value;
};

const DetailItem = ({ label, children, wide = false }) => (
  <div className={`${styles.infoItem} ${wide ? styles.infoItemWide : ''}`}>
    <label>{label}</label>
    <span>{children || 'N/A'}</span>
  </div>
);

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

  const fetchItem = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const decodedBarcode = decodeURIComponent(params.barcode);
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
  }, [params.barcode]);

  useEffect(() => {
    if (params.barcode) {
      fetchItem();
    }
  }, [fetchItem, params.barcode]);

  const getAvailabilityBadge = () => {
    if (item?.isCheckedOut) {
      return <Badge variant='warningBadge' label='Checked Out' />;
    }
    if (item?.isOnHold) {
      return <Badge variant='info' label='On Hold' />;
    }
    return <Badge variant='successBadge' label='Available' />;
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
        { method: 'DELETE' }
      );
      const data = await response.json();

      if (data.status) {
        setSuccess('Catalog item deleted successfully. Redirecting...');
        setTimeout(() => router.push('/catalog'), 1200);
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
      <div className={styles.detailHero}>
        <div className={styles.detailHeroMain}>
          <p className={styles.overline}>Catalog item</p>
          <h1 className={styles.pageTitle}>{item.title?.mainTitle || 'N/A'}</h1>
          {item.title?.subtitle && (
            <p className={styles.pageSubtitle}>{item.title.subtitle}</p>
          )}
          <div className={styles.detailHeroMeta}>
            {getAvailabilityBadge()}
            <span>{item.author?.mainAuthor || 'Unknown author'}</span>
            <span>{item.publicationInfo?.year || 'No year'}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Link href='/catalog'>
            <Button variant='secondary'>
              <ArrowLeft size={16} aria-hidden='true' />
              Back
            </Button>
          </Link>
          <Link href={`/catalog/${encodeURIComponent(item.barcode)}/edit`}>
            <Button variant='primary'>
              <Edit size={16} aria-hidden='true' />
              Edit
            </Button>
          </Link>
          <Button
            variant='danger'
            onClick={openDeleteConfirm}
            disabled={deleting || item.isCheckedOut}
          >
            <Trash2 size={16} aria-hidden='true' />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <Alert type='error' message={error} onClose={() => setError('')} />
      )}
      {success && <Alert type='success' message={success} />}

      <section className={styles.detailStats} aria-label='Item summary'>
        <div className={styles.statCard}>
          <BookOpen size={18} aria-hidden='true' />
          <div>
            <span>Classification</span>
            <strong>{item.classification || 'N/A'}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <Hash size={18} aria-hidden='true' />
          <div>
            <span>Barcode</span>
            <strong>{item.barcode}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <Library size={18} aria-hidden='true' />
          <div>
            <span>Library</span>
            <strong>{item.library || 'N/A'}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <Calendar size={18} aria-hidden='true' />
          <div>
            <span>Updated</span>
            <strong>{formatDate(item.updatedAt)}</strong>
          </div>
        </div>
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.detailPanel}>
          <div className={styles.sectionHeader}>
            <h2>Book details</h2>
            <p>Title, authorship, and publication information.</p>
          </div>
          <div className={styles.infoGrid}>
            <DetailItem label='Title'>{item.title?.mainTitle}</DetailItem>
            <DetailItem label='Subtitle'>{item.title?.subtitle}</DetailItem>
            <DetailItem label='Main author'>{item.author?.mainAuthor}</DetailItem>
            <DetailItem label='Additional authors'>
              {formatArray(item.author?.additionalAuthors)}
            </DetailItem>
            <DetailItem label='Publisher'>
              {item.publicationInfo?.publisher}
            </DetailItem>
            <DetailItem label='Place'>{item.publicationInfo?.place}</DetailItem>
            <DetailItem label='Year'>{item.publicationInfo?.year}</DetailItem>
            <DetailItem label='ISBN'>{item.ISBN}</DetailItem>
          </div>
        </section>

        <section className={styles.detailPanel}>
          <div className={styles.sectionHeader}>
            <h2>Catalog codes</h2>
            <p>Identifiers and shelf information.</p>
          </div>
          <div className={styles.infoGrid}>
            <DetailItem label='Barcode'>
              <code className={styles.barcode}>{item.barcode}</code>
            </DetailItem>
            <DetailItem label='Control number'>
              <code className={styles.barcode}>{item.controlNumber}</code>
            </DetailItem>
            <DetailItem label='Language'>{item.language}</DetailItem>
            <DetailItem label='Copies'>{item.holdingsInformation}</DetailItem>
            <DetailItem label='Availability'>{getAvailabilityBadge()}</DetailItem>
            <DetailItem label='Created'>{formatDate(item.createdAt)}</DetailItem>
          </div>
        </section>

        <section className={`${styles.detailPanel} ${styles.detailPanelWide}`}>
          <div className={styles.sectionHeader}>
            <h2>Discovery notes</h2>
            <p>Subject terms, physical notes, and summary.</p>
          </div>
          <div className={styles.infoGrid}>
            <DetailItem label='Subjects / genre'>
              {formatArray(item.indexTermGenre)}
            </DetailItem>
            <DetailItem label='Physical description'>
              {item.physicalDescription}
            </DetailItem>
            <DetailItem label='Summary / notes' wide>
              {item.informationSummary}
            </DetailItem>
          </div>
        </section>

        {item.patronsCheckedOutHistory?.length > 0 && (
          <section className={`${styles.detailPanel} ${styles.detailPanelWide}`}>
            <div className={styles.sectionHeader}>
              <h2>Checkout history</h2>
              <p>Previous circulation records for this item.</p>
            </div>
            <div className={styles.historyList}>
              {item.patronsCheckedOutHistory.map((checkout, index) => (
                <div key={`${checkout.barcode}-${index}`} className={styles.historyItem}>
                  <div className={styles.historyItemHeader}>
                    <strong>{checkout.fullname || 'N/A'}</strong>
                    <Badge variant='info' label={checkout.barcode || 'N/A'} />
                  </div>
                  <div className={styles.historyItemDetails}>
                    <span>Checked out: {formatDate(checkout.checkedOutAt)}</span>
                    <span>Due: {formatDate(checkout.dueDate)}</span>
                    <span>Contact: {checkout.contactNumber || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showDeleteConfirm && (
        <div className={styles.cropperModal} role='dialog' aria-modal='true'>
          <div className={styles.deleteDialog}>
            <div className={styles.sectionHeader}>
              <h2>Delete catalog item</h2>
              <p>This action cannot be undone.</p>
            </div>
            <div className={styles.deleteSummary}>
              <strong>{item.title?.mainTitle}</strong>
              <span>Barcode: {item.barcode}</span>
              <span>Control number: {item.controlNumber}</span>
            </div>
            <p className={styles.deleteInstruction}>
              To confirm deletion, type <strong>DELETE {item.barcode}</strong>.
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Type "DELETE ${item.barcode}" to confirm`}
              disabled={deleting}
              autoFocus
            />
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

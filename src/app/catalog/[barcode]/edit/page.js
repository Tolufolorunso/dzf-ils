'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import styles from '../../catalog.module.css';

export default function EditCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    mainAuthor: '',
    additionalAuthors: '',
    publisher: '',
    place: '',
    year: '',
    ISBN: '',
    classification: '',
    indexTermGenre: '',
    informationSummary: '',
    language: 'english',
    physicalDescription: '',
    holdingsInformation: '',
    library: 'AAoJ',
  });

  useEffect(() => {
    if (params.barcode) {
      fetchItem();
    }
  }, [params.barcode]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const decodedBarcode = decodeURIComponent(params.barcode);
      const response = await fetch(
        `/api/catalogs/${encodeURIComponent(decodedBarcode)}`
      );
      const data = await response.json();

      if (data.status) {
        const itemData = data.data;
        setItem(itemData);

        // Populate form with existing data
        setFormData({
          title: itemData.title?.mainTitle || '',
          subtitle: itemData.title?.subtitle || '',
          mainAuthor: itemData.author?.mainAuthor || '',
          additionalAuthors: Array.isArray(itemData.author?.additionalAuthors)
            ? itemData.author.additionalAuthors.join(', ')
            : itemData.author?.additionalAuthors || '',
          publisher: itemData.publicationInfo?.publisher || '',
          place: itemData.publicationInfo?.place || '',
          year: itemData.publicationInfo?.year?.toString() || '',
          ISBN: itemData.ISBN || '',
          classification: itemData.classification || '',
          indexTermGenre: Array.isArray(itemData.indexTermGenre)
            ? itemData.indexTermGenre.join(', ')
            : itemData.indexTermGenre || '',
          informationSummary: itemData.informationSummary || '',
          language: itemData.language || 'english',
          physicalDescription: itemData.physicalDescription || '',
          holdingsInformation: itemData.holdingsInformation?.toString() || '',
          library: itemData.library || 'AAoJ',
        });
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        `/api/catalogs/${encodeURIComponent(item.barcode)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.status) {
        setSuccess('Catalog item updated successfully!');
        setTimeout(() => {
          router.push(`/catalog/${item.barcode}`);
        }, 1500);
      } else {
        setError(data.message || 'Failed to update catalog item');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'italian', label: 'Italian' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'other', label: 'Other' },
  ];

  const libraryOptions = [
    { value: 'AAoJ', label: 'AAoJ' },
    { value: 'Main Library', label: 'Main Library' },
    { value: 'Reference', label: 'Reference' },
    { value: 'Special Collections', label: 'Special Collections' },
  ];

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

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Edit Catalog Item</h1>
          <p className={styles.pageSubtitle}>
            Update catalog information for {item?.title?.mainTitle}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/catalog/${item?.barcode}`}>
            <Button variant='secondary'>← Back to Item</Button>
          </Link>
        </div>
      </div>

      {error && <Alert type='error' message={error} />}
      {success && <Alert type='success' message={success} />}

      <form onSubmit={handleSubmit}>
        {/* Title Information */}
        <Card title='Title Information'>
          <div className={styles.formGrid}>
            <Input
              label='Main Title *'
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
            <Input
              label='Subtitle'
              value={formData.subtitle}
              onChange={(e) => handleInputChange('subtitle', e.target.value)}
            />
          </div>
        </Card>

        {/* Author Information */}
        <Card title='Author Information'>
          <div className={styles.formGrid}>
            <Input
              label='Main Author *'
              value={formData.mainAuthor}
              onChange={(e) => handleInputChange('mainAuthor', e.target.value)}
              required
            />
            <Input
              label='Additional Authors'
              value={formData.additionalAuthors}
              onChange={(e) =>
                handleInputChange('additionalAuthors', e.target.value)
              }
              placeholder='Separate multiple authors with commas'
            />
          </div>
        </Card>

        {/* Publication Information */}
        <Card title='Publication Information'>
          <div className={styles.formGrid}>
            <Input
              label='Publisher *'
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              required
            />
            <Input
              label='Place of Publication *'
              value={formData.place}
              onChange={(e) => handleInputChange('place', e.target.value)}
              required
            />
            <Input
              label='Year *'
              type='number'
              value={formData.year}
              onChange={(e) => handleInputChange('year', e.target.value)}
              required
            />
            <Input
              label='ISBN *'
              value={formData.ISBN}
              onChange={(e) => handleInputChange('ISBN', e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Classification and Details */}
        <Card title='Classification and Details'>
          <div className={styles.formGrid}>
            <Input
              label='Classification *'
              value={formData.classification}
              onChange={(e) =>
                handleInputChange('classification', e.target.value)
              }
              required
            />
            <Select
              label='Language *'
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              options={languageOptions}
              required
            />
            <Select
              label='Library *'
              value={formData.library}
              onChange={(e) => handleInputChange('library', e.target.value)}
              options={libraryOptions}
              required
            />
            <Input
              label='Holdings Information'
              type='number'
              value={formData.holdingsInformation}
              onChange={(e) =>
                handleInputChange('holdingsInformation', e.target.value)
              }
              placeholder='Number of copies'
            />
          </div>
        </Card>

        {/* Additional Information */}
        <Card title='Additional Information'>
          <div className={styles.formGrid}>
            <Input
              label='Index Terms/Genre'
              value={formData.indexTermGenre}
              onChange={(e) =>
                handleInputChange('indexTermGenre', e.target.value)
              }
              placeholder='Separate multiple terms with commas'
            />
            <Input
              label='Physical Description'
              value={formData.physicalDescription}
              onChange={(e) =>
                handleInputChange('physicalDescription', e.target.value)
              }
              placeholder='e.g., 250 pages, illustrations'
            />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.fullWidth}>
              <label>Information Summary</label>
              <textarea
                value={formData.informationSummary}
                onChange={(e) =>
                  handleInputChange('informationSummary', e.target.value)
                }
                placeholder='Brief description or summary of the content'
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Link href={`/catalog/${item?.barcode}`}>
            <Button variant='secondary' disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type='submit' variant='primary' disabled={saving}>
            {saving ? 'Updating...' : 'Update Item'}
          </Button>
        </div>
      </form>
    </div>
  );
}

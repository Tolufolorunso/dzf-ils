'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Copy, RotateCcw, Save } from 'lucide-react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import Alert from '@/components/ui/Alert';
import styles from '../../catalog.module.css';

const currentYear = new Date().getFullYear();

const initialFormData = {
  title: '',
  subtitle: '',
  mainAuthor: '',
  additionalAuthors: '',
  publisher: '',
  place: '',
  year: '',
  ISBN: '',
  classification: '',
  barcode: '',
  controlNumber: '',
  language: 'english',
  library: 'AAoJ',
  holdingsInformation: '1',
  physicalDescription: '',
  indexTermGenre: '',
  informationSummary: '',
};

const languageOptions = [
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'yoruba', label: 'Yoruba' },
  { value: 'igbo', label: 'Igbo' },
  { value: 'hausa', label: 'Hausa' },
  { value: 'other', label: 'Other' },
];

const libraryOptions = [
  { value: 'AAoJ', label: 'AAoJ' },
  { value: 'Main Library', label: 'Main Library' },
  { value: 'Reference', label: 'Reference' },
  { value: 'Special Collections', label: 'Special Collections' },
];

const requiredFields = [
  'title',
  'mainAuthor',
  'publisher',
  'place',
  'year',
  'classification',
  'barcode',
  'controlNumber',
  'language',
  'library',
];

const labels = {
  title: 'Title',
  mainAuthor: 'Main author',
  publisher: 'Publisher',
  place: 'Place of publication',
  year: 'Year',
  classification: 'Classification',
  barcode: 'Barcode',
  controlNumber: 'Control number',
  language: 'Language',
  library: 'Library',
  holdingsInformation: 'Copies',
  ISBN: 'ISBN',
};

const cleanValue = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value;

const mapItemToForm = (item) => ({
  title: item.title?.mainTitle || '',
  subtitle: item.title?.subtitle || '',
  mainAuthor: item.author?.mainAuthor || '',
  additionalAuthors: Array.isArray(item.author?.additionalAuthors)
    ? item.author.additionalAuthors.join(', ')
    : item.author?.additionalAuthors || '',
  publisher: item.publicationInfo?.publisher || '',
  place: item.publicationInfo?.place || '',
  year: item.publicationInfo?.year?.toString() || '',
  ISBN: item.ISBN || '',
  classification: item.classification || '',
  barcode: item.barcode || '',
  controlNumber: item.controlNumber || '',
  language: item.language || 'english',
  library: item.library || 'AAoJ',
  holdingsInformation: item.holdingsInformation?.toString() || '0',
  physicalDescription: item.physicalDescription || '',
  indexTermGenre: Array.isArray(item.indexTermGenre)
    ? item.indexTermGenre.join(', ')
    : item.indexTermGenre || '',
  informationSummary: item.informationSummary || '',
});

export default function EditCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [originalFormData, setOriginalFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const completedRequiredCount = useMemo(
    () =>
      requiredFields.filter((field) => cleanValue(formData[field])).length,
    [formData]
  );

  const isReady = completedRequiredCount === requiredFields.length;

  const fetchItem = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);
      const decodedBarcode = decodeURIComponent(params.barcode);
      const response = await fetch(
        `/api/catalogs/${encodeURIComponent(decodedBarcode)}`
      );
      const data = await response.json().catch(() => ({
        status: false,
        message: 'The server returned an unreadable response.',
      }));

      if (!response.ok || !data.status) {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to fetch catalog item.',
        });
        return;
      }

      const mapped = mapItemToForm(data.data);
      setItem(data.data);
      setFormData(mapped);
      setOriginalFormData(mapped);
      setErrors({});
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.',
      });
      console.error('Catalog item fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [params.barcode]);

  useEffect(() => {
    if (params.barcode) {
      fetchItem();
    }
  }, [fetchItem, params.barcode]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const copyTitleToSummary = () => {
    const bits = [
      formData.title,
      formData.subtitle,
      formData.mainAuthor && `by ${formData.mainAuthor}`,
    ].filter(Boolean);
    updateField('informationSummary', bits.join(' '));
  };

  const resetForm = () => {
    setFormData(originalFormData);
    setErrors({});
    setMessage(null);
  };

  const validateForm = () => {
    const nextErrors = {};

    requiredFields.forEach((field) => {
      if (!cleanValue(formData[field])) {
        nextErrors[field] = `${labels[field]} is required.`;
      }
    });

    const parsedYear = Number(formData.year);
    if (
      formData.year &&
      (!Number.isInteger(parsedYear) ||
        parsedYear < 1000 ||
        parsedYear > currentYear + 1)
    ) {
      nextErrors.year = `Use a valid year between 1000 and ${
        currentYear + 1
      }.`;
    }

    const copies = Number(formData.holdingsInformation);
    if (
      formData.holdingsInformation &&
      (!Number.isInteger(copies) || copies < 0)
    ) {
      nextErrors.holdingsInformation = 'Copies must be zero or more.';
    }

    const compactIsbn = formData.ISBN.replace(/[-\s]/g, '');
    if (compactIsbn && !/^(?:\d{9}[\dXx]|\d{13})$/.test(compactIsbn)) {
      nextErrors.ISBN = 'Use a 10 or 13 digit ISBN, or leave it blank.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const preparePayload = () => ({
    ...Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, cleanValue(value)])
    ),
    barcode: item.barcode,
    year: cleanValue(formData.year),
    holdingsInformation: cleanValue(formData.holdingsInformation) || '0',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!item) return;

    if (!validateForm()) {
      setMessage({
        type: 'error',
        text: 'Please fix the highlighted fields before saving.',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `/api/catalogs/${encodeURIComponent(item.barcode)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preparePayload()),
        }
      );

      const data = await response.json().catch(() => ({
        status: false,
        message: 'The server returned an unreadable response.',
      }));

      if (!response.ok || !data.status) {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to update this book.',
        });
        return;
      }

      setMessage({
        type: 'success',
        text: data.message || 'Book updated successfully.',
      });
      router.push(`/catalog/${encodeURIComponent(item.barcode)}`);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.',
      });
      console.error('Update catalog item error:', error);
    } finally {
      setSaving(false);
    }
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

  if (!item) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          {message && <Alert type={message.type} message={message.text} />}
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
          <p className={styles.overline}>Catalog maintenance</p>
          <h1 className={styles.pageTitle}>Edit Book</h1>
          <p className={styles.pageSubtitle}>
            Update catalog information for {item.title?.mainTitle || item.barcode}.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/catalog/${encodeURIComponent(item.barcode)}`}>
            <Button variant='secondary'>
              <ArrowLeft size={16} aria-hidden='true' />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {message && <Alert type={message.type} message={message.text} />}

      <form className={styles.catalogEntryLayout} onSubmit={handleSubmit}>
        <aside className={styles.entrySidebar} aria-label='Edit status'>
          <div className={styles.progressCard}>
            <div className={styles.progressIcon}>
              <BookOpen size={22} aria-hidden='true' />
            </div>
            <div>
              <strong>
                {completedRequiredCount}/{requiredFields.length} required
              </strong>
              <span>{isReady ? 'Ready to save' : 'Complete the basics'}</span>
            </div>
            <div
              className={styles.progressTrack}
              aria-label='Required field progress'
            >
              <span
                style={{
                  width: `${(completedRequiredCount / requiredFields.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className={styles.quickActions}>
            <button type='button' onClick={copyTitleToSummary}>
              <Copy size={16} aria-hidden='true' />
              Start summary from title
            </button>
            <button type='button' onClick={resetForm} disabled={saving}>
              <RotateCcw size={16} aria-hidden='true' />
              Restore loaded values
            </button>
          </div>
        </aside>

        <div className={styles.entryForm}>
          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2>Book details</h2>
              <p>Title, authorship, and publication information.</p>
            </div>
            <div className={styles.formGrid}>
              <Input
                label='Title *'
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                error={errors.title}
                placeholder='e.g., Things Fall Apart'
                autoComplete='off'
                required
              />
              <Input
                label='Subtitle'
                value={formData.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                placeholder='Optional'
                autoComplete='off'
              />
              <Input
                label='Main author *'
                value={formData.mainAuthor}
                onChange={(e) => updateField('mainAuthor', e.target.value)}
                error={errors.mainAuthor}
                placeholder='Author or editor'
                autoComplete='off'
                required
              />
              <Input
                label='Additional authors'
                value={formData.additionalAuthors}
                onChange={(e) =>
                  updateField('additionalAuthors', e.target.value)
                }
                placeholder='Separate names with commas'
                autoComplete='off'
              />
              <Input
                label='Publisher *'
                value={formData.publisher}
                onChange={(e) => updateField('publisher', e.target.value)}
                error={errors.publisher}
                placeholder='Publisher name'
                autoComplete='off'
                required
              />
              <Input
                label='Place of publication *'
                value={formData.place}
                onChange={(e) => updateField('place', e.target.value)}
                error={errors.place}
                placeholder='City or country'
                autoComplete='off'
                required
              />
              <Input
                label='Year *'
                type='number'
                min='1000'
                max={currentYear + 1}
                value={formData.year}
                onChange={(e) => updateField('year', e.target.value)}
                error={errors.year}
                placeholder={String(currentYear)}
                required
              />
              <Input
                label='ISBN'
                value={formData.ISBN}
                onChange={(e) => updateField('ISBN', e.target.value)}
                error={errors.ISBN}
                placeholder='Optional'
                autoComplete='off'
              />
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2>Catalog codes</h2>
              <p>Barcode is fixed for this record; control number can be corrected.</p>
            </div>
            <div className={styles.formGrid}>
              <Input
                label='Barcode *'
                value={formData.barcode}
                error={errors.barcode}
                disabled
                required
              />
              <Input
                label='Control number *'
                value={formData.controlNumber}
                onChange={(e) => updateField('controlNumber', e.target.value)}
                error={errors.controlNumber}
                placeholder='Accession or control number'
                autoComplete='off'
                required
              />
              <Input
                label='Classification *'
                value={formData.classification}
                onChange={(e) => updateField('classification', e.target.value)}
                error={errors.classification}
                placeholder='e.g., 823.914 or PR9387.9'
                autoComplete='off'
                required
              />
              <Select
                label='Library *'
                value={formData.library}
                onChange={(e) => updateField('library', e.target.value)}
                options={libraryOptions}
                error={errors.library}
                required
              />
              <Select
                label='Language *'
                value={formData.language}
                onChange={(e) => updateField('language', e.target.value)}
                options={languageOptions}
                error={errors.language}
                required
              />
              <Input
                label='Copies'
                type='number'
                min='0'
                value={formData.holdingsInformation}
                onChange={(e) =>
                  updateField('holdingsInformation', e.target.value)
                }
                error={errors.holdingsInformation}
                placeholder='1'
              />
            </div>
          </section>

          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2>Discovery notes</h2>
              <p>Optional details that improve searching and shelf work.</p>
            </div>
            <div className={styles.formGrid}>
              <Input
                label='Subjects / genre'
                value={formData.indexTermGenre}
                onChange={(e) => updateField('indexTermGenre', e.target.value)}
                placeholder='Separate terms with commas'
                autoComplete='off'
              />
              <Input
                label='Physical description'
                value={formData.physicalDescription}
                onChange={(e) =>
                  updateField('physicalDescription', e.target.value)
                }
                placeholder='e.g., 214 pages, illustrations'
                autoComplete='off'
              />
            </div>
            <TextArea
              label='Summary / notes'
              value={formData.informationSummary}
              onChange={(e) =>
                updateField('informationSummary', e.target.value)
              }
              placeholder='Brief content summary, donor note, shelf note, or condition note'
              rows={4}
            />
          </section>

          <div className={styles.stickyActions}>
            <span className={styles.checkboxControl}>
              Editing {item.barcode}
            </span>
            <div className={styles.actionCluster}>
              <Link href={`/catalog/${encodeURIComponent(item.barcode)}`}>
                <Button variant='secondary' disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button
                variant='primary'
                type='submit'
                disabled={saving}
                aria-disabled={saving}
              >
                <Save size={16} aria-hidden='true' />
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

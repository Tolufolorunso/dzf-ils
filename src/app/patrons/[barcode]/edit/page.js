'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import styles from '../../patrons.module.css';

export default function EditPatronPage() {
  const params = useParams();
  const router = useRouter();
  const [patron, setPatron] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstname: '',
    surname: '',
    middlename: '',
    email: '',
    phoneNumber: '',
    gender: '',
    street: '',
    city: '',
    state: '',
    country: '',
    schoolName: '',
    currentClass: '',
    parentName: '',
    parentPhoneNumber: '',
    parentEmail: '',
    relationshipToPatron: '',
    messagePreferences: [],
  });

  useEffect(() => {
    if (params.barcode) {
      fetchPatron();
    }
  }, [params.barcode]);

  const fetchPatron = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patrons/${params.barcode}`);
      const data = await response.json();

      if (data.status) {
        const patronData = data.data;
        setPatron(patronData);

        // Populate form with existing data
        setFormData({
          firstname: patronData.firstname || '',
          surname: patronData.surname || '',
          middlename: patronData.middlename || '',
          email: patronData.email || '',
          phoneNumber: patronData.phoneNumber || '',
          gender: patronData.gender || '',
          street: patronData.address?.street || '',
          city: patronData.address?.city || '',
          state: patronData.address?.state || '',
          country: patronData.address?.country || '',
          schoolName: patronData.studentSchoolInfo?.schoolName || '',
          currentClass: patronData.studentSchoolInfo?.currentClass || '',
          parentName: patronData.parentInfo?.parentName || '',
          parentPhoneNumber: patronData.parentInfo?.parentPhoneNumber || '',
          parentEmail: patronData.parentInfo?.parentEmail || '',
          relationshipToPatron:
            patronData.parentInfo?.relationshipToPatron || '',
          messagePreferences: patronData.messagePreferences || [],
        });
      } else {
        setError(data.message || 'Failed to fetch patron details');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Patron fetch error:', err);
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

      const response = await fetch('/api/patrons', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patronId: patron._id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.status) {
        setSuccess('Patron updated successfully!');
        setTimeout(() => {
          router.push(`/patrons/${patron.barcode}`);
        }, 1500);
      } else {
        setError(data.message || 'Failed to update patron');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Update error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading patron details...</p>
        </div>
      </div>
    );
  }

  if (error && !patron) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <Alert type='error' message={error} />
          <Link href='/patrons'>
            <Button variant='primary'>Back to Patrons</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Edit Patron</h1>
          <p className={styles.pageSubtitle}>
            Update patron information for {patron?.firstname} {patron?.surname}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/patrons/${patron?.barcode}`}>
            <Button variant='secondary'>← Back to Profile</Button>
          </Link>
        </div>
      </div>

      {error && <Alert type='error' message={error} />}
      {success && <Alert type='success' message={success} />}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card title='Basic Information'>
          <div className={styles.formGrid}>
            <Input
              label='First Name *'
              value={formData.firstname}
              onChange={(e) => handleInputChange('firstname', e.target.value)}
              required
            />
            <Input
              label='Surname *'
              value={formData.surname}
              onChange={(e) => handleInputChange('surname', e.target.value)}
              required
            />
            <Input
              label='Middle Name'
              value={formData.middlename}
              onChange={(e) => handleInputChange('middlename', e.target.value)}
            />
            <Select
              label='Gender'
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              options={[
                { value: '', label: 'Select Gender' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
        </Card>

        {/* Contact Information */}
        <Card title='Contact Information'>
          <div className={styles.formGrid}>
            <Input
              label='Email'
              type='email'
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            <Input
              label='Phone Number'
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            />
            <Input
              label='Street Address'
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
            />
            <Input
              label='City'
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
            <Input
              label='State'
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
            />
            <Input
              label='Country'
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
            />
          </div>
        </Card>

        {/* School Information (for students) */}
        {patron?.patronType === 'student' && (
          <Card title='School Information'>
            <div className={styles.formGrid}>
              <Input
                label='School Name'
                value={formData.schoolName}
                onChange={(e) =>
                  handleInputChange('schoolName', e.target.value)
                }
              />
              <Input
                label='Current Class'
                value={formData.currentClass}
                onChange={(e) =>
                  handleInputChange('currentClass', e.target.value)
                }
              />
            </div>
          </Card>
        )}

        {/* Parent Information (for students) */}
        {patron?.patronType === 'student' && (
          <Card title='Parent Information'>
            <div className={styles.formGrid}>
              <Input
                label='Parent Name'
                value={formData.parentName}
                onChange={(e) =>
                  handleInputChange('parentName', e.target.value)
                }
              />
              <Input
                label='Parent Phone'
                value={formData.parentPhoneNumber}
                onChange={(e) =>
                  handleInputChange('parentPhoneNumber', e.target.value)
                }
              />
              <Input
                label='Parent Email'
                type='email'
                value={formData.parentEmail}
                onChange={(e) =>
                  handleInputChange('parentEmail', e.target.value)
                }
              />
              <Select
                label='Relationship'
                value={formData.relationshipToPatron}
                onChange={(e) =>
                  handleInputChange('relationshipToPatron', e.target.value)
                }
                options={[
                  { value: '', label: 'Select Relationship' },
                  { value: 'father', label: 'Father' },
                  { value: 'mother', label: 'Mother' },
                  { value: 'guardian', label: 'Guardian' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
          </Card>
        )}

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Link href={`/patrons/${patron?.barcode}`}>
            <Button variant='secondary' disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type='submit' variant='primary' disabled={saving}>
            {saving ? 'Updating...' : 'Update Patron'}
          </Button>
        </div>
      </form>
    </div>
  );
}

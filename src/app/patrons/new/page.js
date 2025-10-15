'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import styles from '../patrons.module.css';

const schoolOptions = [
  { value: '', label: 'Select School', address: '' },
  {
    label: 'Doherty Memorial Grammar School',
    value: 'Doherty Memorial Grammar School',
    address: 'doherty road, Ijero ekiti',
  },
  {
    label: 'Doherty Memorial N/P School',
    value: 'Doherty Memorial N/P School',
    address: 'doherty road, Ijero ekiti',
  },
  {
    label: 'Emmanuel Innovation Academy',
    value: 'Emmanuel Innovation Academy',
    address: 'emmanuel avenue, oke-oro road, Ijero ekiti',
  },
  {
    label: 'Emmanuel Innovation Academy N/P',
    value: 'Emmanuel Innovation Academy N/P',
    address: 'emmanuel avenue, oke-oro road, Ijero ekiti',
  },
  {
    label: 'CAC High school',
    value: 'CAC High school',
    address: 'stadium road odo oye street, Ijero ekiti',
  },
  {
    label: 'St. David CAC N/P school',
    value: 'St. David CAC N/P school',
    address: 'sawmil road odo-afa street, Ijero ekiti',
  },
  {
    label: 'Sure Foundation Model College',
    value: 'Sure Foundation Model College',
    address: 'Odo-Agbo Street, Ijero ekiti',
  },
  {
    label: 'Sure Foundation N/P School',
    value: 'Sure Foundation N/P School',
    address: 'Iwaro Street, Ijero ekiti',
  },
  {
    label: "St. Gabriel's Catholic secondary school",
    value: "St. Gabriel's Catholic secondary school",
    address: 'P.O.Box 11, GRA 1, Ijero ekiti',
  },
  {
    label: 'Jolad Model College',
    value: 'Jolad Model College',
    address: '9 ijurin street, Ijero ekiti',
  },
  {
    label: 'Jolad Model N/P School',
    value: 'Jolad Model N/P School',
    address: '9 ijurin street, Ijero ekiti',
  },
  {
    label: 'Mercy Model N/P School',
    value: 'Mercy Model N/P School',
    address: '17 iwaro street, Ijero ekiti',
  },
  {
    label: 'Dayo Abe Model College',
    value: 'Dayo Abe Model College',
    address: '17 iwaro street, Ijero ekiti',
  },
  {
    label: 'Faith Royal College',
    value: 'Faith Royal College',
    address: 'Oju Oro Street, Ijero Ekiti',
  },
  {
    label: 'St. Peter Catholic School',
    value: 'St. Peter Catholic School',
    address: 'Iwaro street, Ijero Ekiti',
  },
  {
    label: 'The Apostelic Pilot N/P School',
    value: 'The Apostelic Pilot N/P School',
    address: 'Iwaro street,ijero-ekiti',
  },
  {
    label: 'Pillar of Success School Secondary School',
    value: 'Pillar of Success School Secondary School',
    address: 'Odo Oye Street, Ijero Ekiti',
  },
  {
    label: 'Pillar of Success School N/P School',
    value: 'Pillar of Success School N/P School',
    address: 'Odo Oye Street, Ijero Ekiti',
  },
  {
    label: 'Everlead Secondary School',
    value: 'Everlead Secondary School',
    address: 'igboloko street, Ijero Ekiti',
  },
  {
    label: 'Everlead N/P School',
    value: 'Everlead N/P School',
    address: 'igboloko street, Ijero Ekiti',
  },
  {
    label: 'Prime Success Model School',
    value: 'Prime Success Model School',
    address: 'Secretariate Road, Ijero Ekiti',
  },
  {
    label: 'others',
    value: 'others',
    address: '',
  },
];

export default function NewPatronPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    firstname: '',
    surname: '',
    middlename: '',
    email: '',
    phoneNumber: '',
    gender: '',
    patronType: 'student',

    // Address Information
    street: '',
    city: '',
    state: '',
    country: '',

    // School Information (for students/staff/teachers)
    schoolName: '',
    otherSchool: '',
    schoolAdress: '',
    headOfSchool: '',
    schoolEmail: '',
    schoolPhoneNumber: '',
    currentClass: '',

    // Parent Information (for students)
    parentName: '',
    parentAddress: '',
    parentPhoneNumber: '',
    relationshipToPatron: '',
    parentEmail: '',

    // Employer Information (for staff/teachers)
    employerName: '',

    // Preferences
    messagePreferences: ['email'],
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    if (field === 'schoolName') {
      const selectedSchool = schoolOptions.find(
        (school) => school.value === value // or school.label === value
      );

      if (selectedSchool) {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          schoolAdress: selectedSchool.address,
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleCheckboxChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value),
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstname.trim())
        newErrors.firstname = 'First name is required';
      if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.patronType)
        newErrors.patronType = 'Patron type is required';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (step === 2 && formData.patronType === 'student') {
      if (!formData.schoolName && !formData.otherSchool) {
        newErrors.schoolName = 'School name is required for students';
      }
    }

    if (step === 3 && formData.patronType === 'student') {
      if (!formData.parentName.trim()) {
        newErrors.parentName = 'Parent name is required for students';
      }
      if (!formData.relationshipToPatron) {
        newErrors.relationshipToPatron = 'Relationship is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, getTotalSteps()));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getTotalSteps = () => {
    return formData.patronType === 'student' ? 4 : 3;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/patrons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status) {
        setSuccess(
          `Patron created successfully! Barcode: ${data.data.barcode}`
        );
        setTimeout(() => {
          // Reset form data
          setFormData({
            // Basic Information
            firstname: '',
            surname: '',
            middlename: '',
            email: '',
            phoneNumber: '',
            gender: '',
            patronType: 'student',

            // Address Information
            street: '',
            city: '',
            state: '',
            country: '',

            // School Information (for students/staff/teachers)
            schoolName: '',
            otherSchool: '',
            schoolAdress: '',
            headOfSchool: '',
            schoolEmail: '',
            schoolPhoneNumber: '',
            currentClass: '',

            // Parent Information (for students)
            parentName: '',
            parentAddress: '',
            parentPhoneNumber: '',
            relationshipToPatron: '',
            parentEmail: '',

            // Employer Information (for staff/teachers)
            employerName: '',

            // Preferences
            messagePreferences: ['email'],
          });
          setCurrentStep(1);
          setSuccess('');
          setErrors({});
        }, 7000);
      } else {
        setError(data.message || 'Failed to create patron');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Create patron error:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <Card title='Basic Information'>
              <div className={styles.formGrid}>
                <Input
                  label='First Name *'
                  value={formData.firstname}
                  onChange={(e) =>
                    handleInputChange('firstname', e.target.value)
                  }
                  error={errors.firstname}
                  placeholder='Enter first name'
                  required
                />
                <Input
                  label='Surname *'
                  value={formData.surname}
                  onChange={(e) => handleInputChange('surname', e.target.value)}
                  error={errors.surname}
                  placeholder='Enter surname'
                  required
                />
                <Input
                  label='Middle Name'
                  value={formData.middlename}
                  onChange={(e) =>
                    handleInputChange('middlename', e.target.value)
                  }
                  placeholder='Enter middle name (optional)'
                />
                <Select
                  label='Patron Type *'
                  value={formData.patronType}
                  onChange={(e) =>
                    handleInputChange('patronType', e.target.value)
                  }
                  error={errors.patronType}
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'teacher', label: 'Teacher' },
                    { value: 'staff', label: 'Staff' },
                    { value: 'guest', label: 'Guest' },
                  ]}
                  required
                />
                <Select
                  label='Gender *'
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  error={errors.gender}
                  options={[
                    { value: '', label: 'Select Gender' },
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  required
                />
                <Input
                  label='Email'
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  placeholder='Enter email address'
                />
                <Input
                  label='Phone Number'
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange('phoneNumber', e.target.value)
                  }
                  placeholder='Enter phone number'
                />
              </div>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <Card title='Address Information'>
              <div className={styles.formGrid}>
                <Input
                  label='Street Address'
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder='Enter street address'
                />
                <Input
                  label='City'
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder='Enter city'
                />
                <Input
                  label='State/Province'
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder='Enter state or province'
                />
                <Input
                  label='Country'
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder='Enter country'
                />
              </div>
            </Card>

            {(formData.patronType === 'student' ||
              formData.patronType === 'teacher' ||
              formData.patronType === 'staff') && (
              <Card title='School/Institution Information'>
                <div className={styles.formGrid}>
                  <Select
                    label={`School Name ${
                      formData.patronType === 'student' ? '*' : ''
                    }`}
                    value={formData.schoolName}
                    onChange={(e) =>
                      handleInputChange('schoolName', e.target.value)
                    }
                    error={errors.schoolName}
                    options={schoolOptions}
                  />
                  {formData.schoolName === 'others' && (
                    <Input
                      label='Other School Name *'
                      value={formData.otherSchool}
                      onChange={(e) =>
                        handleInputChange('otherSchool', e.target.value)
                      }
                      placeholder='Enter school name'
                      required
                    />
                  )}
                  <Input
                    label='School Address'
                    value={formData.schoolAdress}
                    onChange={(e) =>
                      handleInputChange('schoolAdress', e.target.value)
                    }
                    placeholder='Enter school address'
                  />
                  <Input
                    label='Head of School'
                    value={formData.headOfSchool}
                    onChange={(e) =>
                      handleInputChange('headOfSchool', e.target.value)
                    }
                    placeholder='Enter head of school name'
                  />
                  <Input
                    label='School Email'
                    type='email'
                    value={formData.schoolEmail}
                    onChange={(e) =>
                      handleInputChange('schoolEmail', e.target.value)
                    }
                    placeholder='Enter school email'
                  />
                  <Input
                    label='School Phone'
                    value={formData.schoolPhoneNumber}
                    onChange={(e) =>
                      handleInputChange('schoolPhoneNumber', e.target.value)
                    }
                    placeholder='Enter school phone number'
                  />
                  {formData.patronType === 'student' && (
                    <Input
                      label='Current Class/Grade'
                      value={formData.currentClass}
                      onChange={(e) =>
                        handleInputChange('currentClass', e.target.value)
                      }
                      placeholder='Enter current class or grade'
                    />
                  )}
                  {(formData.patronType === 'teacher' ||
                    formData.patronType === 'staff') && (
                    <Input
                      label='Employer Name'
                      value={formData.employerName}
                      onChange={(e) =>
                        handleInputChange('employerName', e.target.value)
                      }
                      placeholder='Enter employer name'
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
        );

      case 3:
        if (formData.patronType === 'student') {
          return (
            <div className={styles.stepContent}>
              <Card title='Parent/Guardian Information'>
                <div className={styles.formGrid}>
                  <Input
                    label='Parent/Guardian Name *'
                    value={formData.parentName}
                    onChange={(e) =>
                      handleInputChange('parentName', e.target.value)
                    }
                    error={errors.parentName}
                    placeholder='Enter parent or guardian name'
                    required
                  />
                  <Select
                    label='Relationship *'
                    value={formData.relationshipToPatron}
                    onChange={(e) =>
                      handleInputChange('relationshipToPatron', e.target.value)
                    }
                    error={errors.relationshipToPatron}
                    options={[
                      { value: '', label: 'Select Relationship' },
                      { value: 'father', label: 'Father' },
                      { value: 'mother', label: 'Mother' },
                      { value: 'guardian', label: 'Guardian' },
                      { value: 'grandfather', label: 'Grandfather' },
                      { value: 'grandmother', label: 'Grandmother' },
                      { value: 'uncle', label: 'Uncle' },
                      { value: 'aunt', label: 'Aunt' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                  <Input
                    label='Parent Address'
                    value={formData.parentAddress}
                    onChange={(e) =>
                      handleInputChange('parentAddress', e.target.value)
                    }
                    placeholder='Enter parent address'
                  />
                  <Input
                    label='Parent Phone Number'
                    value={formData.parentPhoneNumber}
                    onChange={(e) =>
                      handleInputChange('parentPhoneNumber', e.target.value)
                    }
                    placeholder='Enter parent phone number'
                  />
                  <Input
                    label='Parent Email'
                    type='email'
                    value={formData.parentEmail}
                    onChange={(e) =>
                      handleInputChange('parentEmail', e.target.value)
                    }
                    placeholder='Enter parent email address'
                  />
                </div>
              </Card>
            </div>
          );
        } else {
          return renderPreferencesStep();
        }

      case 4:
        return renderPreferencesStep();

      default:
        return null;
    }
  };

  const renderPreferencesStep = () => (
    <div className={styles.stepContent}>
      <Card title='Communication Preferences'>
        <div className={styles.preferencesSection}>
          <label className={styles.sectionLabel}>
            How would you like to receive notifications?
          </label>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type='checkbox'
                checked={formData.messagePreferences.includes('email')}
                onChange={(e) =>
                  handleCheckboxChange(
                    'messagePreferences',
                    'email',
                    e.target.checked
                  )
                }
              />
              <span>Email Notifications</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type='checkbox'
                checked={formData.messagePreferences.includes('sms')}
                onChange={(e) =>
                  handleCheckboxChange(
                    'messagePreferences',
                    'sms',
                    e.target.checked
                  )
                }
              />
              <span>SMS Notifications</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type='checkbox'
                checked={formData.messagePreferences.includes('phone')}
                onChange={(e) =>
                  handleCheckboxChange(
                    'messagePreferences',
                    'phone',
                    e.target.checked
                  )
                }
              />
              <span>Phone Calls</span>
            </label>
          </div>
        </div>

        <div className={styles.summarySection}>
          <h3>Registration Summary</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <strong>Name:</strong> {formData.firstname} {formData.middlename}{' '}
              {formData.surname}
            </div>
            <div className={styles.summaryItem}>
              <strong>Type:</strong> {formData.patronType}
            </div>
            <div className={styles.summaryItem}>
              <strong>Email:</strong> {formData.email || 'Not provided'}
            </div>
            <div className={styles.summaryItem}>
              <strong>Phone:</strong> {formData.phoneNumber || 'Not provided'}
            </div>
            {formData.patronType === 'student' && (
              <>
                <div className={styles.summaryItem}>
                  <strong>School:</strong>{' '}
                  {formData.schoolName === 'others'
                    ? formData.otherSchool
                    : formData.schoolName}
                </div>
                <div className={styles.summaryItem}>
                  <strong>Parent:</strong> {formData.parentName}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Add New Patron</h1>
          <p className={styles.pageSubtitle}>
            Register a new library patron with complete information
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href='/patrons'>
            <Button variant='secondary'>← Back to Patrons</Button>
          </Link>
        </div>
      </div>

      {error && <Alert type='error' message={error} />}
      {success && <Alert type='success' message={success} />}

      {/* Progress Indicator */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          {Array.from({ length: getTotalSteps() }, (_, i) => (
            <div
              key={i + 1}
              className={`${styles.progressStep} ${
                i + 1 <= currentStep ? styles.active : ''
              } ${i + 1 < currentStep ? styles.completed : ''}`}
            >
              <div className={styles.stepNumber}>{i + 1}</div>
              <div className={styles.stepLabel}>
                {i === 0 && 'Basic Info'}
                {i === 1 && 'Address & School'}
                {i === 2 &&
                  (formData.patronType === 'student'
                    ? 'Parent Info'
                    : 'Preferences')}
                {i === 3 && 'Preferences'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>{renderStepContent()}</form>

      {/* Navigation Buttons */}
      <div className={styles.formActions}>
        <div className={styles.stepNavigation}></div>
        {currentStep > 1 && (
          <Button
            type='button'
            variant='secondary'
            onClick={prevStep}
            disabled={saving}
          >
            ← Previous
          </Button>
        )}

        {currentStep < getTotalSteps() ? (
          <Button
            type='button'
            variant='primary'
            onClick={nextStep}
            disabled={saving}
          >
            Next →
          </Button>
        ) : (
          <Button
            type='button'
            variant='primary'
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? 'Creating Patron...' : 'Create Patron'}
          </Button>
        )}
      </div>
    </div>
  );
}

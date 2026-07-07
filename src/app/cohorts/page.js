'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import styles from './page.module.css';

const initialAddStudentForm = {
  barcode: '',
  firstname: '',
  surname: '',
  middlename: '',
  schoolClass: '',
  receivedCertificate: false,
  cohortType: '',
};

const initialEditStudentForm = {
  id: '',
  originalBarcode: '',
  barcode: '',
  firstname: '',
  surname: '',
  middlename: '',
  schoolClass: '',
  receivedCertificate: false,
  cohortType: '',
};

const initialMoveStudentForm = {
  barcode: '',
  cohortType: '',
};

const initialRenameCohortForm = {
  currentCohortType: '',
  newCohortType: '',
  description: '',
};

const initialCreateCohortForm = {
  cohortType: '',
  description: '',
};

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString();
}

function buildOptions(filters) {
  return (filters || []).map((filter) => ({
    value: filter.cohortType,
    label: `${filter.displayName} (${filter.studentCount})`,
  }));
}

export default function CohortsPage() {
  const [cohortData, setCohortData] = useState(null);
  const [selectedCohortType, setSelectedCohortType] = useState('all');
  const [selectedTypePreview, setSelectedTypePreview] = useState('');
  const [studentView, setStudentView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [statsOpen, setStatsOpen] = useState(false);

  const [addStudentForm, setAddStudentForm] = useState(initialAddStudentForm);
  const [moveStudentForm, setMoveStudentForm] = useState(initialMoveStudentForm);
  const [renameCohortForm, setRenameCohortForm] = useState(
    initialRenameCohortForm
  );
  const [createCohortForm, setCreateCohortForm] = useState(
    initialCreateCohortForm
  );
  const [editStudentForm, setEditStudentForm] = useState(initialEditStudentForm);

  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [moveStudentLoading, setMoveStudentLoading] = useState(false);
  const [renameCohortLoading, setRenameCohortLoading] = useState(false);
  const [createCohortLoading, setCreateCohortLoading] = useState(false);
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [syncSheetsLoading, setSyncSheetsLoading] = useState(false);
  const [removingBarcode, setRemovingBarcode] = useState('');

  const [addStudentError, setAddStudentError] = useState('');
  const [addStudentSuccess, setAddStudentSuccess] = useState('');
  const [moveStudentError, setMoveStudentError] = useState('');
  const [moveStudentSuccess, setMoveStudentSuccess] = useState('');
  const [renameCohortError, setRenameCohortError] = useState('');
  const [renameCohortSuccess, setRenameCohortSuccess] = useState('');
  const [createCohortError, setCreateCohortError] = useState('');
  const [createCohortSuccess, setCreateCohortSuccess] = useState('');
  const [editStudentError, setEditStudentError] = useState('');
  const [editStudentSuccess, setEditStudentSuccess] = useState('');

  const fetchCohortData = useCallback(async ({ background = false } = {}) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/cohorts?cohortType=${encodeURIComponent(selectedCohortType)}`
      );
      const data = await response.json();

      if (!data.status) {
        setPageError(
          data.error
            ? `${data.message || 'Failed to fetch cohort data.'} ${data.error}`
            : data.message || 'Failed to fetch cohort data.'
        );
        return;
      }

      setCohortData(data.data);
      setPageError('');
    } catch (error) {
      console.error('Cohort fetch error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCohortType]);

  useEffect(() => {
    fetchCohortData();
  }, [fetchCohortData]);

  const cohortOptions = useMemo(
    () => buildOptions(cohortData?.filters?.options),
    [cohortData?.filters?.options]
  );

  const assignDefaultCohortSelections = (filters) => {
    const firstRealCohort = filters?.find((item) => item.cohortType !== 'all');
    const defaultCohortType = firstRealCohort?.cohortType || '';

    setAddStudentForm((current) => ({
      ...current,
      cohortType: current.cohortType || defaultCohortType,
    }));
    setMoveStudentForm((current) => ({
      ...current,
      cohortType: current.cohortType || defaultCohortType,
    }));
    setRenameCohortForm((current) => ({
      ...current,
      currentCohortType: current.currentCohortType || defaultCohortType,
    }));
  };

  useEffect(() => {
    assignDefaultCohortSelections(cohortData?.filters?.options);
  }, [cohortData?.filters?.options]);

  useEffect(() => {
    if (!selectedTypePreview && cohortData?.allCohortTypes?.length) {
      setSelectedTypePreview(cohortData.allCohortTypes[0].cohortType);
    }
  }, [cohortData?.allCohortTypes, selectedTypePreview]);

  const handleAddStudentChange = (event) => {
    const { name, type, checked, value } = event.target;
    setAddStudentForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (addStudentError) setAddStudentError('');
    if (addStudentSuccess) setAddStudentSuccess('');
  };

  const handleEditStudentChange = (event) => {
    const { name, type, checked, value } = event.target;
    setEditStudentForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (editStudentError) setEditStudentError('');
    if (editStudentSuccess) setEditStudentSuccess('');
  };

  const openEditStudent = (student) => {
    setEditStudentError('');
    setEditStudentSuccess('');
    setEditStudentForm({
      id: student.id,
      originalBarcode: student.barcode,
      barcode: student.barcode,
      firstname: student.firstname || '',
      surname: student.surname || '',
      middlename: student.middlename || '',
      schoolClass: student.schoolClass || '',
      receivedCertificate: Boolean(student.receivedCertificate),
      cohortType: student.cohortType || '',
    });
  };

  const closeEditStudent = () => {
    if (editStudentLoading) {
      return;
    }

    setEditStudentForm(initialEditStudentForm);
    setEditStudentError('');
    setEditStudentSuccess('');
  };

  const handleMoveStudentChange = (event) => {
    const { name, value } = event.target;
    setMoveStudentForm((current) => ({ ...current, [name]: value }));
    if (moveStudentError) setMoveStudentError('');
    if (moveStudentSuccess) setMoveStudentSuccess('');
  };

  const handleRenameCohortChange = (event) => {
    const { name, value } = event.target;
    setRenameCohortForm((current) => ({ ...current, [name]: value }));
    if (renameCohortError) setRenameCohortError('');
    if (renameCohortSuccess) setRenameCohortSuccess('');
  };

  const handleCreateCohortChange = (event) => {
    const { name, value } = event.target;
    setCreateCohortForm((current) => ({ ...current, [name]: value }));
    if (createCohortError) setCreateCohortError('');
    if (createCohortSuccess) setCreateCohortSuccess('');
  };

  const submitAddStudent = async (event) => {
    event.preventDefault();
    setAddStudentLoading(true);
    setAddStudentError('');
    setAddStudentSuccess('');

    try {
      const response = await fetch('/api/cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addstudent',
          ...addStudentForm,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setAddStudentError(data.message || 'Failed to add student.');
        return;
      }

      setAddStudentSuccess(data.message);
      setAddStudentForm((current) => ({
        ...initialAddStudentForm,
        cohortType: current.cohortType,
      }));
      fetchCohortData({ background: true });
    } catch (error) {
      console.error('Add cohort student error:', error);
      setAddStudentError('Network error. Please try again.');
    } finally {
      setAddStudentLoading(false);
    }
  };

  const submitMoveStudent = async (event) => {
    event.preventDefault();
    setMoveStudentLoading(true);
    setMoveStudentError('');
    setMoveStudentSuccess('');

    try {
      const response = await fetch('/api/cohorts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'movestudent',
          ...moveStudentForm,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setMoveStudentError(data.message || 'Failed to move student.');
        return;
      }

      setMoveStudentSuccess(data.message);
      setMoveStudentForm((current) => ({
        ...initialMoveStudentForm,
        cohortType: current.cohortType,
      }));
      fetchCohortData({ background: true });
    } catch (error) {
      console.error('Move cohort student error:', error);
      setMoveStudentError('Network error. Please try again.');
    } finally {
      setMoveStudentLoading(false);
    }
  };

  const submitEditStudent = async (event) => {
    event.preventDefault();
    setEditStudentLoading(true);
    setEditStudentError('');
    setEditStudentSuccess('');

    try {
      const response = await fetch('/api/cohorts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatestudent',
          ...editStudentForm,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setEditStudentError(data.message || 'Failed to update student.');
        return;
      }

      setEditStudentSuccess(data.message);
      fetchCohortData({ background: true });
      setTimeout(() => closeEditStudent(), 350);
    } catch (error) {
      console.error('Update cohort student error:', error);
      setEditStudentError('Network error. Please try again.');
    } finally {
      setEditStudentLoading(false);
    }
  };

  const toggleCertificate = async (student) => {
    const actionText = student.receivedCertificate ? 'revoke' : 'grant';
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} the certificate for ${student.fullName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setPageError('');
      const response = await fetch('/api/cohorts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatestudent',
          id: student.id,
          originalBarcode: student.barcode,
          barcode: student.barcode,
          firstname: student.firstname,
          surname: student.surname,
          middlename: student.middlename,
          schoolClass: student.schoolClass,
          cohortType: student.cohortType,
          receivedCertificate: !student.receivedCertificate,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setPageError(data.message || `Failed to ${actionText} certificate.`);
        return;
      }

      fetchCohortData({ background: true });
    } catch (error) {
      console.error('Toggle certificate error:', error);
      setPageError('Network error. Please try again.');
    }
  };

  const submitRenameCohort = async (event) => {
    event.preventDefault();
    setRenameCohortLoading(true);
    setRenameCohortError('');
    setRenameCohortSuccess('');

    try {
      const response = await fetch('/api/cohorts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'renamecohort',
          ...renameCohortForm,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setRenameCohortError(data.message || 'Failed to rename cohort.');
        return;
      }

      setRenameCohortSuccess(data.message);
      setRenameCohortForm(initialRenameCohortForm);
      fetchCohortData({ background: true });
      setSelectedCohortType('all');
    } catch (error) {
      console.error('Rename cohort error:', error);
      setRenameCohortError('Network error. Please try again.');
    } finally {
      setRenameCohortLoading(false);
    }
  };

  const submitCreateCohort = async (event) => {
    event.preventDefault();
    setCreateCohortLoading(true);
    setCreateCohortError('');
    setCreateCohortSuccess('');

    try {
      const response = await fetch('/api/cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createcohort',
          ...createCohortForm,
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setCreateCohortError(data.message || 'Failed to create cohort.');
        return;
      }

      setCreateCohortSuccess(data.message);
      setCreateCohortForm(initialCreateCohortForm);
      fetchCohortData({ background: true });
    } catch (error) {
      console.error('Create cohort error:', error);
      setCreateCohortError('Network error. Please try again.');
    } finally {
      setCreateCohortLoading(false);
    }
  };

  const removeStudent = async (student) => {
    const confirmed = window.confirm(
      `Remove ${student.fullName} (${student.barcode}) from cohort?`
    );

    if (!confirmed) {
      return;
    }

    setRemovingBarcode(student.barcode);
    setPageError('');

    try {
      const response = await fetch('/api/cohorts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: student.barcode,
          cohortType: student.cohortType,
        }),
      });

      const data = await response.json();

      if (!data.status) {
        setPageError(data.message || 'Failed to remove student.');
        return;
      }

      fetchCohortData({ background: true });
    } catch (error) {
      console.error('Remove cohort student error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setRemovingBarcode('');
    }
  };

  const syncGoogleSheets = async () => {
    setSyncSheetsLoading(true);
    setPageError('');

    try {
      const response = await fetch('/api/cohorts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'syncgooglesheets',
        }),
      });

      const data = await response.json();
      if (!data.status) {
        setPageError(data.message || 'Failed to sync Google Sheets.');
        return;
      }

      fetchCohortData({ background: true });
    } catch (error) {
      console.error('Sync Google Sheets error:', error);
      setPageError('Network error. Please try again.');
    } finally {
      setSyncSheetsLoading(false);
    }
  };

  const stats = cohortData?.stats;
  const cohorts = cohortData?.cohorts || [];
  const students = useMemo(() => cohortData?.students || [], [cohortData?.students]);
  const filteredStudents = useMemo(() => {
    if (selectedCohortType === 'all') {
      return students;
    }

    return students.filter(
      (student) => student.cohortType === selectedCohortType
    );
  }, [students, selectedCohortType]);
  const allCohortTypes = cohortData?.allCohortTypes || [];
  const previewType =
    allCohortTypes.find((item) => item.cohortType === selectedTypePreview) ||
    allCohortTypes[0] ||
    null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div>
            <p className={styles.kicker}>Cohort Management</p>
            <h1 className={styles.title}>
              Organize, move, and track cohort students without leaving this
              page.
            </h1>
            <p className={styles.subtitle}>
              ICT, admin, assistant admin, and IMA staff can manage cohort
              membership, rename cohort types, create new cohorts, and open a
              stats dialog for a quick operational snapshot.
            </p>
          </div>

          <div className={styles.heroActions}>
            <Button
              variant='secondary'
              onClick={() => fetchCohortData({ background: true })}
              disabled={refreshing || loading}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Cohort Data'}
            </Button>
            <Button
              variant='secondary'
              onClick={syncGoogleSheets}
              disabled={syncSheetsLoading || loading}
            >
              {syncSheetsLoading ? 'Syncing Sheets...' : 'Sync Google Sheets'}
            </Button>
            <Button
              variant='primary'
              onClick={() => setStatsOpen(true)}
              disabled={loading}
            >
              View Stats Dialog
            </Button>
          </div>
        </div>
      </section>

      <main className={styles.content}>
        {pageError && (
          <Alert
            type='error'
            message={pageError}
            onClose={() => setPageError('')}
          />
        )}

        {loading ? (
          <Card title='Loading Cohorts'>
            <div className={styles.emptyState}>
              <p>Fetching cohort groups, students, and summary stats.</p>
            </div>
          </Card>
        ) : (
          <>
            <section className={styles.filterSection}>
              <Card title='Cohort View'>
                <div className={styles.filterGrid}>
                  <Select
                    label='Filter by Cohort'
                    value={selectedCohortType}
                    onChange={(event) =>
                      setSelectedCohortType(event.target.value)
                    }
                    options={cohortOptions}
                  />
                  <div className={styles.filterSummary}>
                    <strong>{stats?.displayedStudents ?? 0}</strong>
                    <span>
                      students currently shown in{' '}
                      {selectedCohortType === 'all'
                        ? 'all cohorts'
                        : selectedCohortType}
                    </span>
                  </div>
                </div>
              </Card>
            </section>

            <section className={styles.cohortGrid}>
              {cohorts.map((cohort) => (
                <Card key={cohort.cohortType} title={cohort.displayName}>
                  <div className={styles.cohortCard}>
                    <strong>{cohort.studentCount}</strong>
                    <span>students</span>
                    <p>{cohort.description || 'No description added yet.'}</p>
                  </div>
                </Card>
              ))}
            </section>

            <section className={styles.directorySection}>
              <Card title='All Cohort Types in Database'>
                {allCohortTypes.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No cohort types were found.</p>
                  </div>
                ) : (
                  <div className={styles.typePreview}>
                    <Select
                      label='Select Cohort Type'
                      value={selectedTypePreview}
                      onChange={(event) =>
                        setSelectedTypePreview(event.target.value)
                      }
                      options={allCohortTypes.map((item) => ({
                        value: item.cohortType,
                        label: item.cohortType,
                      }))}
                    />
                    {previewType && (
                      <div className={styles.typeItem}>
                        <strong>{previewType.cohortType}</strong>
                        <span>
                          Suggested normalized name:{' '}
                          {previewType.normalizedSuggestion}
                        </span>
                        <span>
                          Use the bulk rename form below to change every student
                          with this cohort type at once.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </section>

            <section className={styles.formsGrid}>
              <Card title='Add Student to Cohort'>
                <form onSubmit={submitAddStudent} className={styles.form}>
                  {addStudentError && (
                    <Alert
                      type='error'
                      message={addStudentError}
                      onClose={() => setAddStudentError('')}
                    />
                  )}
                  {addStudentSuccess && (
                    <Alert
                      type='success'
                      message={addStudentSuccess}
                      onClose={() => setAddStudentSuccess('')}
                    />
                  )}

                  <Input
                    label='Student Barcode'
                    name='barcode'
                    value={addStudentForm.barcode}
                    onChange={handleAddStudentChange}
                    placeholder='Enter student barcode'
                    required
                  />
                  <Input
                    label='Firstname'
                    name='firstname'
                    value={addStudentForm.firstname}
                    onChange={handleAddStudentChange}
                    placeholder='Enter firstname'
                    required
                  />
                  <Input
                    label='Surname'
                    name='surname'
                    value={addStudentForm.surname}
                    onChange={handleAddStudentChange}
                    placeholder='Enter surname'
                    required
                  />
                  <Input
                    label='Middlename'
                    name='middlename'
                    value={addStudentForm.middlename}
                    onChange={handleAddStudentChange}
                    placeholder='Optional middlename'
                  />
                  <Input
                    label='Class'
                    name='schoolClass'
                    value={addStudentForm.schoolClass}
                    onChange={handleAddStudentChange}
                    placeholder='Example: JSS 2'
                  />
                  <label className={styles.checkboxField}>
                    <input
                      type='checkbox'
                      name='receivedCertificate'
                      checked={addStudentForm.receivedCertificate}
                      onChange={handleAddStudentChange}
                    />
                    <span>Received Certificate</span>
                  </label>
                  <Select
                    label='Cohort'
                    name='cohortType'
                    value={addStudentForm.cohortType}
                    onChange={handleAddStudentChange}
                    options={cohortOptions.filter(
                      (option) => option.value !== 'all'
                    )}
                  />

                  <div className={styles.formActions}>
                    <Button
                      type='submit'
                      variant='primary'
                      disabled={addStudentLoading}
                    >
                      {addStudentLoading ? 'Adding...' : 'Add Student'}
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title='Change Student Cohort'>
                <form onSubmit={submitMoveStudent} className={styles.form}>
                  {moveStudentError && (
                    <Alert
                      type='error'
                      message={moveStudentError}
                      onClose={() => setMoveStudentError('')}
                    />
                  )}
                  {moveStudentSuccess && (
                    <Alert
                      type='success'
                      message={moveStudentSuccess}
                      onClose={() => setMoveStudentSuccess('')}
                    />
                  )}

                  <Input
                    label='Student Barcode'
                    name='barcode'
                    value={moveStudentForm.barcode}
                    onChange={handleMoveStudentChange}
                    placeholder='Enter or prefill student barcode'
                    required
                  />
                  <Select
                    label='New Cohort'
                    name='cohortType'
                    value={moveStudentForm.cohortType}
                    onChange={handleMoveStudentChange}
                    options={cohortOptions.filter(
                      (option) => option.value !== 'all'
                    )}
                  />

                  <div className={styles.formActions}>
                    <Button
                      type='submit'
                      variant='primary'
                      disabled={moveStudentLoading}
                    >
                      {moveStudentLoading ? 'Updating...' : 'Move Student'}
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title='Bulk Rename Cohort Type'>
                <form onSubmit={submitRenameCohort} className={styles.form}>
                  {renameCohortError && (
                    <Alert
                      type='error'
                      message={renameCohortError}
                      onClose={() => setRenameCohortError('')}
                    />
                  )}
                  {renameCohortSuccess && (
                    <Alert
                      type='success'
                      message={renameCohortSuccess}
                      onClose={() => setRenameCohortSuccess('')}
                    />
                  )}

                  <Select
                    label='Current Cohort Type'
                    name='currentCohortType'
                    value={renameCohortForm.currentCohortType}
                    onChange={handleRenameCohortChange}
                    options={cohortOptions.filter(
                      (option) => option.value !== 'all'
                    )}
                  />
                  <Input
                    label='New Cohort Type'
                    name='newCohortType'
                    value={renameCohortForm.newCohortType}
                    onChange={handleRenameCohortChange}
                    placeholder='Example: cohort-1'
                    required
                  />
                  <TextArea
                    label='Description'
                    name='description'
                    value={renameCohortForm.description}
                    onChange={handleRenameCohortChange}
                    placeholder='Optional description for the renamed cohort.'
                    rows={3}
                  />

                  <div className={styles.helperBox}>
                    This updates every cohort student record that currently has
                    the selected cohort type. Example: `cohortOne` becomes
                    `cohort-1` everywhere in the database.
                  </div>

                  <div className={styles.formActions}>
                    <Button
                      type='submit'
                      variant='primary'
                      disabled={renameCohortLoading}
                    >
                      {renameCohortLoading ? 'Renaming...' : 'Rename Cohort'}
                    </Button>
                  </div>
                </form>
              </Card>

              <Card title='Create New Cohort'>
                <form onSubmit={submitCreateCohort} className={styles.form}>
                  {createCohortError && (
                    <Alert
                      type='error'
                      message={createCohortError}
                      onClose={() => setCreateCohortError('')}
                    />
                  )}
                  {createCohortSuccess && (
                    <Alert
                      type='success'
                      message={createCohortSuccess}
                      onClose={() => setCreateCohortSuccess('')}
                    />
                  )}

                  <Input
                    label='Cohort Type'
                    name='cohortType'
                    value={createCohortForm.cohortType}
                    onChange={handleCreateCohortChange}
                    placeholder='Example: cohort-4'
                    required
                  />
                  <TextArea
                    label='Description'
                    name='description'
                    value={createCohortForm.description}
                    onChange={handleCreateCohortChange}
                    placeholder='Optional cohort description'
                    rows={3}
                  />

                  <div className={styles.formActions}>
                    <Button
                      type='submit'
                      variant='primary'
                      disabled={createCohortLoading}
                    >
                      {createCohortLoading ? 'Creating...' : 'Create Cohort'}
                    </Button>
                  </div>
                </form>
              </Card>
            </section>

            <section className={styles.directorySection}>
              <Card title='Cohort Students'>
                {filteredStudents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No students found for the selected cohort view.</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.viewToolbar}>
                      <div className={styles.viewSummary}>
                        <strong>{filteredStudents.length}</strong>
                        <span>students in this view</span>
                      </div>
                      <div className={styles.viewActions}>
                        <Button
                          variant={studentView === 'list' ? 'primary' : 'secondary'}
                          onClick={() => setStudentView('list')}
                        >
                          List View
                        </Button>
                        <Button
                          variant={studentView === 'grid' ? 'primary' : 'secondary'}
                          onClick={() => setStudentView('grid')}
                        >
                          Grid View
                        </Button>
                      </div>
                    </div>
                    <div
                      className={
                        studentView === 'grid'
                          ? styles.studentGrid
                          : styles.studentList
                      }
                    >
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className={
                          studentView === 'grid'
                            ? styles.studentCard
                            : styles.studentRow
                        }
                      >
                        <div className={styles.studentInfoGroup}>
                          <div className={styles.studentPhotoContainer}>
                            {student.imageUrl ? (
                              <img
                                src={student.imageUrl}
                                alt={student.fullName}
                                className={styles.studentPhoto}
                              />
                            ) : (
                              <div className={styles.studentPhotoPlaceholder}>
                                No Image
                              </div>
                            )}
                          </div>
                          <div className={styles.studentIdentity}>
                            <strong>{student.fullName}</strong>
                            <span>
                              {student.barcode} - {student.cohortType}
                            </span>
                            <span>
                              Class: {student.schoolClass || 'N/A'} | Certificate:{' '}
                              {student.receivedCertificate ? 'Received' : 'Not received'}
                            </span>
                            <span>
                              Attendance logs: {student.attendanceCount} | Last:{' '}
                              {formatDate(student.lastAttendanceDate)}
                            </span>
                            {student.normalizedSuggestion &&
                              student.normalizedSuggestion !== student.cohortType && (
                                <span>
                                  Suggested normalized name:{' '}
                                  {student.normalizedSuggestion}
                                </span>
                              )}
                          </div>
                        </div>
                        <div className={styles.studentActions}>
                           <Button
                            variant='secondary'
                            onClick={() => toggleCertificate(student)}
                          >
                            {student.receivedCertificate ? 'revoke Certificate' : 'Get Certificate'}
                          </Button>
                          <Button
                            variant='primary'
                            onClick={() => openEditStudent(student)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant='secondary'
                            onClick={() =>
                              setMoveStudentForm({
                                barcode: student.barcode,
                                cohortType: student.cohortType,
                              })
                            }
                          >
                            Prefill Move
                          </Button>
                          <Button
                            variant='secondary'
                            onClick={() => removeStudent(student)}
                            disabled={removingBarcode === student.barcode}
                          >
                            {removingBarcode === student.barcode
                              ? 'Removing...'
                              : 'Remove'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    </div>
                  </>
                )}
              </Card>
            </section>
          </>
        )}
      </main>

      <Modal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        title='Cohort Statistics'
      >
        <div className={styles.statsDialog}>
          <div className={styles.dialogGrid}>
            <div className={styles.dialogStat}>
              <strong>{stats?.totalStudents ?? 0}</strong>
              <span>Total Active Students</span>
            </div>
            <div className={styles.dialogStat}>
              <strong>{stats?.displayedStudents ?? 0}</strong>
              <span>Students in Current View</span>
            </div>
            <div className={styles.dialogStat}>
              <strong>{stats?.totalCohorts ?? 0}</strong>
              <span>Total Cohorts</span>
            </div>
            <div className={styles.dialogStat}>
              <strong>{stats?.cohortsWithStudents ?? 0}</strong>
              <span>Cohorts with Students</span>
            </div>
            <div className={styles.dialogStat}>
              <strong>{stats?.emptyCohorts ?? 0}</strong>
              <span>Empty Cohorts</span>
            </div>
            <div className={styles.dialogStat}>
              <strong>{stats?.totalAttendanceEntries ?? 0}</strong>
              <span>Total Attendance Logs</span>
            </div>
          </div>

          <div className={styles.breakdownSection}>
            <h3 className={styles.breakdownTitle}>Cohort Breakdown</h3>
            {(cohorts || []).map((cohort) => (
              <div key={cohort.cohortType} className={styles.breakdownRow}>
                <div>
                  <strong>{cohort.displayName}</strong>
                  <span>{cohort.description || 'No description'}</span>
                </div>
                <div className={styles.breakdownCount}>
                  {cohort.studentCount} students
                </div>
              </div>
            ))}
          </div>

          {stats?.largestCohort && (
            <div className={styles.highlightBox}>
              Largest cohort right now: <strong>{stats.largestCohort.displayName}</strong>{' '}
              with {stats.largestCohort.studentCount} students.
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(editStudentForm.id)}
        onClose={closeEditStudent}
        title='Edit Cohort Student'
      >
        <form onSubmit={submitEditStudent} className={styles.form}>
          {editStudentError && (
            <Alert
              type='error'
              message={editStudentError}
              onClose={() => setEditStudentError('')}
            />
          )}
          {editStudentSuccess && (
            <Alert
              type='success'
              message={editStudentSuccess}
              onClose={() => setEditStudentSuccess('')}
            />
          )}

          <Input
            label='Student Barcode'
            name='barcode'
            value={editStudentForm.barcode}
            onChange={handleEditStudentChange}
            placeholder='Enter student barcode'
            required
          />
          <Input
            label='Firstname'
            name='firstname'
            value={editStudentForm.firstname}
            onChange={handleEditStudentChange}
            placeholder='Enter firstname'
            required
          />
          <Input
            label='Surname'
            name='surname'
            value={editStudentForm.surname}
            onChange={handleEditStudentChange}
            placeholder='Enter surname'
            required
          />
          <Input
            label='Middlename'
            name='middlename'
            value={editStudentForm.middlename}
            onChange={handleEditStudentChange}
            placeholder='Optional middlename'
          />
          <Input
            label='Class'
            name='schoolClass'
            value={editStudentForm.schoolClass}
            onChange={handleEditStudentChange}
            placeholder='Example: JSS 2'
          />
          <label className={styles.checkboxField}>
            <input
              type='checkbox'
              name='receivedCertificate'
              checked={editStudentForm.receivedCertificate}
              onChange={handleEditStudentChange}
            />
            <span>Received Certificate</span>
          </label>
          <Select
            label='Cohort'
            name='cohortType'
            value={editStudentForm.cohortType}
            onChange={handleEditStudentChange}
            options={cohortOptions.filter((option) => option.value !== 'all')}
          />

          <div className={styles.formActions}>
            <Button
              type='submit'
              variant='primary'
              disabled={editStudentLoading}
            >
              {editStudentLoading ? 'Saving...' : 'Save Student'}
            </Button>
            <Button
              type='button'
              variant='secondary'
              onClick={closeEditStudent}
              disabled={editStudentLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

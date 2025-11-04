'use client';

import { useState, useEffect, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import styles from './attendance.module.css';

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scannerMode, setScannerMode] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    patronBarcode: '',
    classType: 'literacy',
    className: '',
    classDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    if (scannerMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scannerMode]);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance?date=${today}`);
      const data = await response.json();

      if (data.status) {
        setAttendanceRecords(data.data);
      } else {
        setError(data.message || 'Failed to fetch attendance records');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Attendance fetch error:', err);
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

  const handleMarkAttendance = async (e) => {
    e.preventDefault();

    if (!formData.patronBarcode || !formData.className) {
      setError('Patron barcode and class name are required.');
      return;
    }

    try {
      setMarking(true);
      setError('');

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status) {
        setSuccess(
          `Attendance marked for ${data.data.patronName}. Points awarded: 20`
        );

        // Reset form
        setFormData((prev) => ({
          ...prev,
          patronBarcode: '',
          notes: '',
        }));

        // Refresh attendance list
        fetchTodayAttendance();

        // Focus back to barcode input for scanner mode
        if (scannerMode && barcodeInputRef.current) {
          setTimeout(() => {
            barcodeInputRef.current.focus();
          }, 100);
        }
      } else {
        setError(data.message || 'Failed to mark attendance');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Mark attendance error:', err);
    } finally {
      setMarking(false);
    }
  };

  const handleBarcodeKeyPress = (e) => {
    if (e.key === 'Enter' && formData.patronBarcode && formData.className) {
      handleMarkAttendance(e);
    }
  };

  const toggleScannerMode = () => {
    setScannerMode(!scannerMode);
    if (!scannerMode) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const classTypeOptions = [
    { value: 'literacy', label: 'Literacy Class' },
    { value: 'reading_club', label: 'Reading Club' },
    { value: 'book_discussion', label: 'Book Discussion' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'other', label: 'Other' },
  ];

  const classNameOptions = [
    { value: '', label: 'Select Class Level' },
    {
      value: 'Early Elementary (Primary 1-3)',
      label: 'Early Elementary (Primary 1-3)',
    },
    {
      value: 'Upper Elementary (Primary 4-6)',
      label: 'Upper Elementary (Primary 4-6)',
    },
    { value: 'Junior Secondary School', label: 'Junior Secondary School' },
    { value: 'Senior Secondary School', label: 'Senior Secondary School' },
    { value: 'Mixed Age Group', label: 'Mixed Age Group' },
    { value: 'Adult Literacy Program', label: 'Adult Literacy Program' },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📋 Attendance Management</h1>
        <p className={styles.pageSubtitle}>
          Mark attendance for literacy classes and activities
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
        {/* Mark Attendance Form */}
        <Card title='Mark Attendance'>
          <form
            onSubmit={handleMarkAttendance}
            className={styles.attendanceForm}
          >
            <div className={styles.scannerToggle}>
              <Button
                type='button'
                variant={scannerMode ? 'primary' : 'secondary'}
                onClick={toggleScannerMode}
              >
                {scannerMode ? '📱 Scanner Mode ON' : '📱 Enable Scanner Mode'}
              </Button>
              {scannerMode && (
                <p className={styles.scannerHint}>
                  Scan barcode or type manually, then press Enter
                </p>
              )}
            </div>

            <div className={styles.formGrid}>
              <Input
                ref={barcodeInputRef}
                label='Patron Barcode *'
                value={formData.patronBarcode}
                onChange={(e) =>
                  handleInputChange('patronBarcode', e.target.value)
                }
                onKeyPress={handleBarcodeKeyPress}
                placeholder='Scan or type patron barcode'
                required
                autoComplete='off'
              />

              <Select
                label='Class Type *'
                value={formData.classType}
                onChange={(e) => handleInputChange('classType', e.target.value)}
                options={classTypeOptions}
                required
              />

              <Select
                label='Class Name *'
                value={formData.className}
                onChange={(e) => handleInputChange('className', e.target.value)}
                options={classNameOptions}
                required
              />

              <Input
                label='Class Date *'
                type='date'
                value={formData.classDate}
                onChange={(e) => handleInputChange('classDate', e.target.value)}
                required
              />

              <Input
                label='Notes (Optional)'
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder='Additional notes...'
              />
            </div>

            <div className={styles.formActions}>
              <Button
                type='submit'
                variant='primary'
                disabled={
                  marking || !formData.patronBarcode || !formData.className
                }
              >
                {marking ? 'Marking...' : '✓ Mark Attendance'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Today's Attendance */}
        <Card title="Today's Attendance">
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading attendance records...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No Attendance Records</h3>
              <p>No attendance has been marked for today yet.</p>
            </div>
          ) : (
            <div className={styles.attendanceList}>
              <div className={styles.attendanceStats}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {attendanceRecords.length}
                  </div>
                  <div className={styles.statLabel}>Total Attendance</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {attendanceRecords.reduce(
                      (sum, record) => sum + record.points,
                      0
                    )}
                  </div>
                  <div className={styles.statLabel}>Points Awarded</div>
                </div>
              </div>

              <div className={styles.recordsList}>
                {attendanceRecords.map((record) => (
                  <div key={record._id} className={styles.attendanceRecord}>
                    <div className={styles.recordHeader}>
                      <div className={styles.patronInfo}>
                        <strong>{record.patronName}</strong>
                        <span className={styles.barcode}>
                          {record.patronBarcode}
                        </span>
                      </div>
                      <Badge variant='success'>+{record.points} pts</Badge>
                    </div>
                    <div className={styles.recordDetails}>
                      <span className={styles.className}>
                        {record.className}
                      </span>
                      <span className={styles.classType}>
                        {
                          classTypeOptions.find(
                            (opt) => opt.value === record.classType
                          )?.label
                        }
                      </span>
                      <span className={styles.time}>
                        {formatDate(record.attendanceTime)}
                      </span>
                    </div>
                    {record.notes && (
                      <div className={styles.recordNotes}>
                        <em>{record.notes}</em>
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

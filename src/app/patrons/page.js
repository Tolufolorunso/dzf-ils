'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import styles from './patrons.module.css';

export default function PatronsPage() {
  const [patrons, setPatrons] = useState([]);
  const [filteredPatrons, setFilteredPatrons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(80);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    patronType: '',
    gender: '',
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchPatrons();
  }, []);

  useEffect(() => {
    filterPatrons();
  }, [patrons, filters]);

  const fetchPatrons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patrons');
      const data = await response.json();

      if (data.status) {
        setPatrons(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch patrons');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Patrons fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterPatrons = () => {
    let filtered = [...patrons];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (patron) =>
          patron.surname?.toLowerCase().includes(searchTerm) ||
          patron.firstname?.toLowerCase().includes(searchTerm) ||
          patron.barcode?.toLowerCase().includes(searchTerm)
      );
    }

    // Patron type filter
    if (filters.patronType) {
      filtered = filtered.filter(
        (patron) => patron.patronType === filters.patronType
      );
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter((patron) => patron.gender === filters.gender);
    }

    setFilteredPatrons(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      patronType: '',
      gender: '',
    });
  };

  const getPatronTypeBadge = (type) => {
    const typeColors = {
      student: 'primary',
      teacher: 'successBadge',
      staff: 'warningBadge',
      guest: 'default',
    };
    return <Badge label={type} variant={typeColors[type]} />;
  };

  const getInitials = (patron) => {
    const first = patron.firstname?.charAt(0) || '';
    const last = patron.surname?.charAt(0) || '';

    return (first + last).toUpperCase();
  };

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Returns the capitalized name of a patron
   * @param {string} text The full name of the patron
   * @return {string} The capitalized name of the patron
   */
  /*******  ccc198fb-efe4-4612-951f-8d2ab74329dd  *******/
  const capitalize = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const columns = [
    { key: 'avatar', label: 'Avatar' },
    { key: 'name', label: 'Name' },
    { key: 'barcode', label: 'Barcode' },
    { key: 'patronType', label: 'Type' },
    { key: 'gender', label: 'Gender' },
    { key: 'status', label: 'Status' },
    { key: 'points', label: 'Points' },
    { key: 'actions', label: 'Actions' },
  ];

  const getStatusBadge = (active) => {
    return active ? (
      <Badge label='Active' variant='successBadge' />
    ) : (
      <Badge label='Inactive' variant='warningBadge' />
    );
  };

  const tableData = filteredPatrons.map((patron) => ({
    avatar: (
      <Avatar
        size='md'
        src={patron.image_url ? patron?.image_url?.secure_url : null}
        initial={patron.image_url || getInitials(patron)}
      />
    ),
    name: `${capitalize(patron.surname) || ''}, ${
      capitalize(patron.firstname) || ''
    }`.trim(),
    barcode: patron.barcode,
    patronType: getPatronTypeBadge(patron.patronType),
    gender: patron.gender || 'N/A',
    status: getStatusBadge(patron.active),
    points: patron.points || 0,
    actions: (
      <div className={styles.actionButtons}>
        <Link href={`/patrons/${patron.barcode}`}>
          <Button variant='secondary' size='sm'>
            View
          </Button>
        </Link>
        <Link href={`/patrons/${patron.barcode}/edit`}>
          <Button variant='secondary' size='sm'>
            Edit
          </Button>
        </Link>
      </div>
    ),
  }));

  const totalPages = Math.ceil(filteredPatrons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatrons = tableData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const patronTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'staff', label: 'Staff' },
    { value: 'guest', label: 'Guest' },
  ];

  const genderOptions = [
    { value: '', label: 'All Genders' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Patron Management</h1>
        <p className={styles.pageSubtitle}>
          Manage library patrons and their information
        </p>
      </div>

      <div className={styles.contentGrid}>
        <Card title='Patron Filters'>
          <div className={styles.filtersGrid}>
            <Input
              label='Search'
              name='search'
              type='text'
              value={filters.search}
              onChange={handleFilterChange}
              placeholder='Search by name or barcode...'
            />

            <Select
              label='Patron Type'
              name='patronType'
              value={filters.patronType}
              onChange={handleFilterChange}
              options={patronTypeOptions}
            />

            <Select
              label='Gender'
              name='gender'
              value={filters.gender}
              onChange={handleFilterChange}
              options={genderOptions}
            />

            <div className={styles.filterActions}>
              <Button
                variant='secondary'
                onClick={clearFilters}
                className={styles.clearButton}
              >
                Clear Filters
              </Button>
              <Button
                variant='primary'
                onClick={fetchPatrons}
                disabled={loading}
                className={styles.refreshButton}
              >
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        <Card title='Patrons List'>
          {error && (
            <Alert type='error' message={error} onClose={() => setError('')} />
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading patrons...</p>
            </div>
          ) : filteredPatrons.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>No Patrons Found</h3>
              <p>
                {Object.values(filters).some((f) => f)
                  ? 'No patrons match your current filters.'
                  : 'There are no patrons in the system yet.'}
              </p>
              {Object.values(filters).some((f) => f) && (
                <Button variant='secondary' onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className={styles.tableHeader}>
                <div className={styles.tableInfo}>
                  <span>
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredPatrons.length)} of{' '}
                    {filteredPatrons.length} patrons
                  </span>
                </div>
                <Link href='/patrons/new'>
                  <Button variant='primary'>Add New Patron</Button>
                </Link>
              </div>

              <Table columns={columns} data={currentPatrons} />

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    variant='secondary'
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant='secondary'
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import styles from '../circulation.module.css';

export default function HoldsPage() {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHolds();
  }, []);

  const fetchHolds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/circulations/holds');
      const data = await response.json();

      if (data.status) {
        setHolds(data.holds || []);
      } else {
        setError(data.message || 'Failed to fetch holds');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Holds fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusText = (returnedAt, dueDate) => {
    if (returnedAt) return 'Returned';
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays <= 3) return 'Due Soon';
    return 'Active';
  };

  const getStatusBadge = (returnedAt, dueDate) => {
    const status = getStatusText(returnedAt, dueDate);

    if (status === 'Returned') {
      return <Badge variant='successBadge'>Returned</Badge>;
    }

    if (status === 'Overdue') {
      return <Badge variant='errorBadge'>Overdue</Badge>;
    }

    if (status === 'Due Soon') {
      return <Badge variant='warningBadge'>Due Soon</Badge>;
    }

    return <Badge variant='primary'>Active</Badge>;
  };

  const columns = [
    { key: 'itemBarcode', label: 'Item Barcode' },
    { key: 'title', label: 'Title' },
    { key: 'patronBarcode', label: 'Patron Barcode' },
    { key: 'patronName', label: 'Patron Name' },
    { key: 'borrowingDate', label: 'Borrowed Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'status', label: 'Status' },
  ];

  const filteredHolds = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return holds.filter((hold) => {
      if (!query) return true;

      return [hold.title, hold.patronName, hold.patronBarcode, hold.itemBarcode]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [holds, searchTerm]);

  const tableData = filteredHolds.map((hold) => ({
    ...hold,
    borrowingDate: formatDate(hold.borrowingDate),
    dueDate: formatDate(hold.dueDate),
    status: getStatusBadge(hold.returnedAt, hold.dueDate),
  }));

  const totalPages = Math.max(1, Math.ceil(filteredHolds.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHolds = tableData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, holds.length]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const stats = {
    total: filteredHolds.length,
    active: filteredHolds.filter((h) => getStatusText(h.returnedAt, h.dueDate) === 'Active').length,
    dueSoon: filteredHolds.filter((h) => getStatusText(h.returnedAt, h.dueDate) === 'Due Soon').length,
    overdue: filteredHolds.filter((h) => getStatusText(h.returnedAt, h.dueDate) === 'Overdue').length,
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Library Holds</h1>
        <p className={styles.pageSubtitle}>
          Search and track active checkouts, due-soon items, and overdue loans
        </p>
      </div>

      <div className={styles.contentGrid}>
        <Card title='Holds Snapshot'>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}><div className={styles.statValue}>{stats.total}</div><div className={styles.statLabel}>Total</div></div>
            <div className={styles.statCard}><div className={styles.statValue}>{stats.active}</div><div className={styles.statLabel}>Active</div></div>
            <div className={styles.statCard}><div className={styles.statValue}>{stats.dueSoon}</div><div className={styles.statLabel}>Due Soon</div></div>
            <div className={styles.statCard}><div className={styles.statValue}>{stats.overdue}</div><div className={styles.statLabel}>Overdue</div></div>
          </div>
        </Card>

        <Card title='Quick Actions'>
          <div className={styles.quickActions}>
            <div className={styles.actionItem}>
              <h4>Checkout New Item</h4>
              <p>Process a new book checkout</p>
              <Button variant='primary' className={styles.actionButton} onClick={() => (window.location.href = '/circulations/checkout')}>
                Go to Checkout
              </Button>
            </div>
            <div className={styles.actionItem}>
              <h4>Check-in Item</h4>
              <p>Return a borrowed item</p>
              <Button variant='secondary' className={styles.actionButton} onClick={() => (window.location.href = '/circulations/checkin')}>
                Go to Check-in
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card title='Holds List'>
        {error && <Alert type='error' message={error} onClose={() => setError('')} />}

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading holds...</p>
          </div>
        ) : filteredHolds.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>No matches</div>
            <h3>No Holds Found</h3>
            <p>Try another patron/book search term or refresh the list.</p>
          </div>
        ) : (
          <>
            <div className={styles.filtersSection}>
              <div className={styles.filtersGrid}>
                <Input
                  label='Search Patron or Book'
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder='Search by patron name, patron barcode, title, or item barcode'
                />
                <div className={styles.filterActions}>
                  <Button variant='secondary' onClick={() => setSearchTerm('')} disabled={!searchTerm}>
                    Clear
                  </Button>
                  <Button variant='secondary' onClick={fetchHolds} disabled={loading}>
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            <div className={styles.tableHeader}>
              <div className={styles.tableInfo}>
                <span>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredHolds.length)} of {filteredHolds.length} holds
                </span>
              </div>
            </div>

            <Table columns={columns} data={currentHolds} showPagination={false} />

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
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import styles from '../circulation.module.css';

export default function OverduesPage() {
  const [overdues, setOverdues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOverdues();
  }, []);

  const fetchOverdues = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/circulations/overdues');
      const data = await response.json();

      if (data.status) {
        setOverdues(data.overdues || []);
      } else {
        setError(data.message || 'Failed to fetch overdues');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Overdues fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) * -1;
  };

  const getOverdueBadge = (days) => {
    if (days <= 0) return <Badge variant='primary'>Not Overdue</Badge>;
    if (days <= 7) return <Badge variant='warningBadge'>{days} days</Badge>;
    if (days <= 30) return <Badge variant='errorBadge'>{days} days</Badge>;
    return <Badge variant='errorBadge'>{days} days (Critical)</Badge>;
  };

  const columns = [
    { key: 'itemBarcode', label: 'Item Barcode' },
    { key: 'title', label: 'Title' },
    { key: 'patronBarcode', label: 'Patron Barcode' },
    { key: 'patronName', label: 'Patron Name' },
    { key: 'contactNumber', label: 'Contact' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'overdueDays', label: 'Overdue' },
  ];

  const filteredOverdues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return overdues.filter((item) => {
      if (!query) return true;

      return [item.title, item.patronName, item.patronBarcode, item.itemBarcode]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [overdues, searchTerm]);

  const tableData = filteredOverdues.map((overdue) => {
    const days = calculateOverdueDays(overdue.dueDate);
    return {
      ...overdue,
      dueDate: formatDate(overdue.dueDate),
      overdueDays: getOverdueBadge(days),
    };
  });

  const totalPages = Math.max(1, Math.ceil(filteredOverdues.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOverdues = tableData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, overdues.length]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const overdueStats = {
    total: filteredOverdues.length,
    critical: filteredOverdues.filter((item) => calculateOverdueDays(item.dueDate) > 30)
      .length,
    moderate: filteredOverdues.filter((item) => {
      const days = calculateOverdueDays(item.dueDate);
      return days > 7 && days <= 30;
    }).length,
    mild: filteredOverdues.filter((item) => {
      const days = calculateOverdueDays(item.dueDate);
      return days > 0 && days <= 7;
    }).length,
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Overdue Items</h1>
        <p className={styles.pageSubtitle}>
          Search, prioritize, and follow up on overdue returns
        </p>
      </div>

      <Card title='Overdue Statistics'>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overdueStats.total}</div>
            <div className={styles.statLabel}>Total Overdue</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overdueStats.critical}</div>
            <div className={styles.statLabel}>Critical (30+ days)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overdueStats.moderate}</div>
            <div className={styles.statLabel}>Moderate (7-30 days)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overdueStats.mild}</div>
            <div className={styles.statLabel}>Mild (1-7 days)</div>
          </div>
        </div>
      </Card>

      <Card title='Overdue Items List'>
        {error && <Alert type='error' message={error} onClose={() => setError('')} />}

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Loading overdue items...</p>
          </div>
        ) : filteredOverdues.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>Clear</div>
            <h3>No Overdue Items</h3>
            <p>All items are returned on time.</p>
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
                  <Button variant='secondary' onClick={fetchOverdues} disabled={loading}>
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            <div className={styles.tableHeader}>
              <div className={styles.tableInfo}>
                <span>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredOverdues.length)} of {filteredOverdues.length} overdue items
                </span>
              </div>
            </div>

            <Table columns={columns} data={currentOverdues} showPagination={false} />

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

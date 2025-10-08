'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/Badge';
import styles from '../circulation.module.css';

export default function OverduesPage() {
  const [overdues, setOverdues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  const tableData = overdues.map((overdue) => {
    const days = calculateOverdueDays(overdue.dueDate);
    return {
      ...overdue,
      dueDate: formatDate(overdue.dueDate),
      overdueDays: getOverdueBadge(days),
    };
  });

  const totalPages = Math.ceil(overdues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOverdues = tableData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const overdueStats = {
    total: overdues.length,
    critical: overdues.filter((item) => calculateOverdueDays(item.dueDate) > 30)
      .length,
    moderate: overdues.filter((item) => {
      const days = calculateOverdueDays(item.dueDate);
      return days > 7 && days <= 30;
    }).length,
    mild: overdues.filter((item) => {
      const days = calculateOverdueDays(item.dueDate);
      return days > 0 && days <= 7;
    }).length,
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Overdue Items</h1>
        <p className={styles.pageSubtitle}>
          Track and manage overdue library items
        </p>
      </div>

      <div className={styles.contentGrid}>
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
          {error && (
            <Alert type='error' message={error} onClose={() => setError('')} />
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading overdue items...</p>
            </div>
          ) : overdues.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✅</div>
              <h3>No Overdue Items</h3>
              <p>All items are returned on time!</p>
            </div>
          ) : (
            <>
              <div className={styles.tableHeader}>
                <div className={styles.tableInfo}>
                  <span>
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, overdues.length)} of {overdues.length}{' '}
                    overdue items
                  </span>
                </div>
                <Button
                  variant='secondary'
                  onClick={fetchOverdues}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>

              <Table columns={columns} data={currentOverdues} />

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

        <Card title='Actions'>
          <div className={styles.actionList}>
            <div className={styles.actionItem}>
              <h4>Send Reminders</h4>
              <p>Send email reminders to patrons with overdue items</p>
              <Button variant='primary' className={styles.actionButton}>
                Send Reminders
              </Button>
            </div>
            <div className={styles.actionItem}>
              <h4>Export Report</h4>
              <p>Export overdue items report for management</p>
              <Button variant='secondary' className={styles.actionButton}>
                Export Report
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

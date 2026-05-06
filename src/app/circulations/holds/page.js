'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import styles from '@/app/patrons/patrons.module.css';

export default function HoldsPage() {
  const [holds, setHolds] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const itemsPerPage = 50;

  const fetchHolds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/circulations/holds');
      const data = await response.json();
      if (data.status) setHolds(data.holds || []);
      else setError(data.message || 'Failed to fetch holds');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHolds(); }, []);

  useEffect(() => {
    const query = search.trim().toLowerCase();
    const next = holds.filter((row) => {
      if (!query) return true;
      return [row.title, row.patronName, row.patronBarcode, row.itemBarcode]
        .filter(Boolean)
        .some((entry) => entry.toLowerCase().includes(query));
    });
    setFiltered(next);
    setCurrentPage(1);
  }, [holds, search]);

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');

  const getStatus = (row) => {
    if (row.returnedAt) return <Badge variant='successBadge' label='Returned' />;
    const diff = Math.ceil((new Date(row.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return <Badge variant='errorBadge' label='Overdue' />;
    if (diff <= 3) return <Badge variant='warningBadge' label='Due Soon' />;
    return <Badge variant='primary' label='Active' />;
  };

  const tableData = filtered.map((row) => ({
    itemBarcode: row.itemBarcode,
    title: row.title,
    patronBarcode: row.patronBarcode,
    patronName: row.patronName,
    borrowingDate: formatDate(row.borrowingDate),
    dueDate: formatDate(row.dueDate),
    status: getStatus(row),
  }));

  const columns = [
    { key: 'itemBarcode', label: 'Item Barcode' },
    { key: 'title', label: 'Title' },
    { key: 'patronBarcode', label: 'Patron Barcode' },
    { key: 'patronName', label: 'Patron Name' },
    { key: 'borrowingDate', label: 'Borrowed Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'status', label: 'Status' },
  ];

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRows = tableData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Library Holds</h1>
        <p className={styles.pageSubtitle}>Track all holds with patron/book search.</p>
      </div>

      <div className={styles.contentGrid}>
        <Card title='Holds Filters'>
          <div className={styles.filtersGrid}>
            <Input label='Search Patron or Book' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search by patron, barcode, or title' />
            <div className={styles.filterActions}>
              <Button variant='secondary' onClick={() => setSearch('')}>Clear</Button>
              <Button variant='primary' onClick={fetchHolds} disabled={loading}>Refresh</Button>
            </div>
          </div>
        </Card>

        <Card title='Holds List'>
          {error && <Alert type='error' message={error} onClose={() => setError('')} />}
          {loading ? (
            <div className={styles.loadingContainer}><div className={styles.loader}></div><p>Loading holds...</p></div>
          ) : (
            <>
              <div className={styles.tableHeader}><div className={styles.tableInfo}>Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} holds</div></div>
              <Table columns={columns} data={currentRows} showPagination={false} />
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <Button variant='secondary' onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                  <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
                  <Button variant='secondary' onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

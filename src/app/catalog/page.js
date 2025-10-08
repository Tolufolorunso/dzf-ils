'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Table from '@/components/ui/Table';
import styles from './catalog.module.css';

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    title: '',
    subtitle: '',
    author: '',
    classification: '',
    controlNumber: '',
    itemBarcode: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchItems();
  }, [currentPage, filters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value.trim() !== '')
        ),
      });

      const response = await fetch(`/api/catalogs?${queryParams}`);
      const data = await response.json();

      if (data.status) {
        setItems(data.catalogs || []);
        // setTotalPages(data.data.totalPages || 40);
        setTotalPages(40);
        setTotalItems(data.total || 0);
      } else {
        setError(data.message || 'Failed to fetch catalog items');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Catalog fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      title: '',
      subtitle: '',
      author: '',
      classification: '',
      controlNumber: '',
      itemBarcode: '',
    });
    setCurrentPage(1);
  };

  const getAvailabilityBadge = (item) => {
    if (item.isCheckedOut) {
      return <Badge variant='warningBadge'>Checked Out</Badge>;
    }
    if (item.isOnHold) {
      return <Badge variant='info'>On Hold</Badge>;
    }
    return <Badge variant='successBadge'>Available</Badge>;
  };

  const getItemTypeBadge = (type) => {
    const typeColors = {
      book: 'primary',
      journal: 'info',
      magazine: 'warningBadge',
      newspaper: 'default',
      cd: 'successBadge',
      dvd: 'secondary',
      ebook: 'primary',
    };
    return <Badge variant={typeColors[type] || 'default'}>{type}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const tableHeaders = [
    'Title',
    'Author',
    'Classification',
    'Item Type',
    'Barcode',
    'Availability',
    'Actions',
  ];

  const tableRows = items.map((item) => [
    <div key={`title-${item.barcode}`}>
      <div className={styles.itemTitle}>{item.title}</div>
      {item.subtitle && (
        <div className={styles.itemSubtitle}>{item.subtitle}</div>
      )}
    </div>,
    item.author || 'N/A',
    item.classification || 'N/A',
    getItemTypeBadge(item.itemType),
    <code key={`barcode-${item.barcode}`} className={styles.barcode}>
      {item.itemBarcode}
    </code>,
    getAvailabilityBadge(item),
    <div key={`actions-${item.barcode}`} className={styles.actionButtons}>
      <Link href={`/catalog/${item._id}`}>
        <Button variant='secondary' size='sm'>
          View
        </Button>
      </Link>
      <Link href={`/catalog/${item._id}/edit`}>
        <Button variant='primary' size='sm'>
          Edit
        </Button>
      </Link>
    </div>,
  ]);

  if (loading && items.length === 0) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading catalog items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Catalog Management</h1>
          <p className={styles.pageSubtitle}>
            Manage library catalog items and view availability status
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href='/catalog/new'>
            <Button variant='primary'>Add New Item</Button>
          </Link>
        </div>
      </div>

      {error && <Alert type='error' message={error} />}

      {/* Filters */}
      <Card title='Filter Items'>
        <div className={styles.filtersGrid}>
          <Input
            label='Title'
            value={filters.title}
            onChange={(e) => handleFilterChange('title', e.target.value)}
            placeholder='Search by title...'
          />
          <Input
            label='Subtitle'
            value={filters.subtitle}
            onChange={(e) => handleFilterChange('subtitle', e.target.value)}
            placeholder='Search by subtitle...'
          />
          <Input
            label='Author'
            value={filters.author}
            onChange={(e) => handleFilterChange('author', e.target.value)}
            placeholder='Search by author...'
          />
          <Input
            label='Classification'
            value={filters.classification}
            onChange={(e) =>
              handleFilterChange('classification', e.target.value)
            }
            placeholder='Search by classification...'
          />
          <Input
            label='Control Number'
            value={filters.controlNumber}
            onChange={(e) =>
              handleFilterChange('controlNumber', e.target.value)
            }
            placeholder='Search by control number...'
          />
          <Input
            label='Item Barcode'
            value={filters.itemBarcode}
            onChange={(e) => handleFilterChange('itemBarcode', e.target.value)}
            placeholder='Search by barcode...'
          />
        </div>
        <div className={styles.filterActions}>
          <Button variant='secondary' onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button variant='primary' onClick={fetchItems}>
            Search
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      <div className={styles.resultsSummary}>
        <p>
          Showing {items.length} of {totalItems} items
          {Object.values(filters).some((f) => f.trim() !== '') && ' (filtered)'}
        </p>
      </div>

      {/* Items Table */}
      {items.length > 0 ? (
        <>
          <Table headers={tableHeaders} rows={tableRows} loading={loading} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </div>
              <div className={styles.pageButtons}>
                <Button
                  variant='secondary'
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant='secondary'
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <div className={styles.emptyState}>
            <h3>No catalog items found</h3>
            <p>
              {Object.values(filters).some((f) => f.trim() !== '')
                ? 'Try adjusting your search filters or clear them to see all items.'
                : 'No catalog items have been added yet.'}
            </p>
            {Object.values(filters).some((f) => f.trim() !== '') ? (
              <Button variant='secondary' onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link href='/catalog/new'>
                <Button variant='primary'>Add First Item</Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

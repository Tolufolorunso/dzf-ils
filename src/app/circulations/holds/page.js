'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/Badge'
import styles from '../circulation.module.css'

export default function HoldsPage() {
  const [holds, setHolds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchHolds()
  }, [])

  const fetchHolds = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/circulations/holds')
      const data = await response.json()

      if (data.status) {
        setHolds(data.holds || [])
      } else {
        setError(data.message || 'Failed to fetch holds')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Holds fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (returnedAt, dueDate) => {
    if (returnedAt) {
      return <Badge variant='successBadge'>Returned</Badge>
    }

    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return <Badge variant='errorBadge'>Overdue</Badge>
    } else if (diffDays <= 3) {
      return <Badge variant='warningBadge'>Due Soon</Badge>
    } else {
      return <Badge variant='primary'>Active</Badge>
    }
  }

  const columns = [
    { key: 'itemBarcode', label: 'Item Barcode' },
    { key: 'title', label: 'Title' },
    { key: 'patronBarcode', label: 'Patron Barcode' },
    { key: 'patronName', label: 'Patron Name' },
    { key: 'borrowingDate', label: 'Borrowed Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'status', label: 'Status' },
  ]

  const tableData = holds.map((hold) => ({
    ...hold,
    borrowingDate: formatDate(hold.borrowingDate),
    dueDate: formatDate(hold.dueDate),
    status: getStatusBadge(hold.returnedAt, hold.dueDate),
  }))

  const totalPages = Math.ceil(holds.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentHolds = tableData.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Library Holds</h1>
        <p className={styles.pageSubtitle}>
          View all checked out items and their current status
        </p>
      </div>

      <div className={styles.contentGrid}>
        <Card title='Holds Overview'>
          {error && (
            <Alert type='error' message={error} onClose={() => setError('')} />
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading holds...</p>
            </div>
          ) : holds.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📚</div>
              <h3>No Holds Found</h3>
              <p>There are currently no checked out items in the system.</p>
            </div>
          ) : (
            <>
              <div className={styles.tableHeader}>
                <div className={styles.tableInfo}>
                  <span>
                    Showing {startIndex + 1}-{Math.min(endIndex, holds.length)}{' '}
                    of {holds.length} holds
                  </span>
                </div>
                <Button
                  variant='secondary'
                  onClick={fetchHolds}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>

              <Table columns={columns} data={currentHolds} />

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

        <Card title='Quick Actions'>
          <div className={styles.quickActions}>
            <div className={styles.actionItem}>
              <h4>Checkout New Item</h4>
              <p>Process a new book checkout</p>
              <Button variant='primary' className={styles.actionButton}>
                Go to Checkout
              </Button>
            </div>
            <div className={styles.actionItem}>
              <h4>Check-in Item</h4>
              <p>Return a borrowed item</p>
              <Button variant='secondary' className={styles.actionButton}>
                Go to Check-in
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

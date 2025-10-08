'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Alert from '@/components/ui/Alert'
import styles from '../patrons.module.css'

export default function PatronDetailPage() {
  const params = useParams()
  const [patron, setPatron] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchPatron()
    }
  }, [params.id])

  const fetchPatron = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patrons/${params.id}`)
      const data = await response.json()

      if (data.status) {
        setPatron(data.data)
      } else {
        setError(data.message || 'Failed to fetch patron details')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Patron fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (patron) => {
    if (!patron) return ''
    const first = patron.firstname?.charAt(0) || ''
    const last = patron.surname?.charAt(0) || ''
    return (first + last).toUpperCase()
  }

  const getPatronTypeBadge = (type) => {
    const typeColors = {
      student: 'primary',
      teacher: 'successBadge',
      staff: 'warningBadge',
      guest: 'default',
    }
    return <Badge variant={typeColors[type] || 'default'}>{type}</Badge>
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading patron details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <Alert type='error' message={error} />
          <Link href='/patrons'>
            <Button variant='primary'>Back to Patrons</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!patron) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <Alert type='error' message='Patron not found' />
          <Link href='/patrons'>
            <Button variant='primary'>Back to Patrons</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <Link href='/patrons'>
            <Button variant='secondary'>← Back to Patrons</Button>
          </Link>
          <Link href={`/patrons/${patron._id}/edit`}>
            <Button variant='primary'>Edit Patron</Button>
          </Link>
        </div>
      </div>

      <div className={styles.detailGrid}>
        {/* Patron Profile Card */}
        <Card title='Patron Profile'>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <Avatar size='lg'>
                {patron.image_url ? (
                  <img
                    src={patron.image_url}
                    alt={`${patron.firstname} ${patron.surname}`}
                    className='avatar-img'
                  />
                ) : (
                  <div className='avatar-fallback'>{getInitials(patron)}</div>
                )}
              </Avatar>
              <div className={styles.patronBasicInfo}>
                <h2 className={styles.patronName}>
                  {patron.surname}, {patron.firstname} {patron.middlename}
                </h2>
                <div className={styles.patronBadges}>
                  {getPatronTypeBadge(patron.patronType)}
                  {patron.gender && (
                    <Badge variant='default'>{patron.gender}</Badge>
                  )}
                </div>
                <div className={styles.patronBarcode}>
                  Barcode: <strong>{patron.barcode}</strong>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card title='Contact Information'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Email:</label>
              <span>{patron.email || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Phone:</label>
              <span>{patron.phoneNumber || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Address:</label>
              <span>
                {patron.address?.street && `${patron.address.street}, `}
                {patron.address?.city && `${patron.address.city}, `}
                {patron.address?.state && `${patron.address.state}, `}
                {patron.address?.country || 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* Patron Specific Information */}
        {patron.patronType === 'student' && patron.studentSchoolInfo && (
          <Card title='School Information'>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>School:</label>
                <span>{patron.studentSchoolInfo.schoolName || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Class:</label>
                <span>{patron.studentSchoolInfo.currentClass || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>School Email:</label>
                <span>{patron.studentSchoolInfo.schoolEmail || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>School Phone:</label>
                <span>
                  {patron.studentSchoolInfo.schoolPhoneNumber || 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {patron.patronType === 'student' && patron.parentInfo && (
          <Card title='Parent Information'>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Parent Name:</label>
                <span>{patron.parentInfo.parentName || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Relationship:</label>
                <span>{patron.parentInfo.relationshipToPatron || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Parent Email:</label>
                <span>{patron.parentInfo.parentEmail || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Parent Phone:</label>
                <span>{patron.parentInfo.parentPhoneNumber || 'N/A'}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Account Information */}
        <Card title='Account Information'>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Points:</label>
              <span className={styles.pointsValue}>{patron.points || 0}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Expiry Date:</label>
              <span>{formatDate(patron.patronExpiryDate)}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Registered By:</label>
              <span>{patron.registeredBy || 'N/A'}</span>
            </div>
            <div className={styles.infoItem}>
              <label>Message Preferences:</label>
              <span>{patron.messagePreferences?.join(', ') || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Borrowing History */}
        <Card title='Borrowing History'>
          {patron.itemsCheckedOutHistory &&
          patron.itemsCheckedOutHistory.length > 0 ? (
            <div className={styles.historyList}>
              {patron.itemsCheckedOutHistory.map((item, index) => (
                <div key={index} className={styles.historyItem}>
                  <div className={styles.historyItemHeader}>
                    <strong>{item.itemTitle}</strong>
                    {item.eventTitle && (
                      <Badge variant='info'>{item.eventTitle}</Badge>
                    )}
                  </div>
                  <div className={styles.historyItemDetails}>
                    <span>Barcode: {item.itemBarcode}</span>
                    <span>Checked out: {formatDate(item.checkoutDate)}</span>
                    <span>Due: {formatDate(item.dueDate)}</span>
                    {item.returnedAt && (
                      <span>Returned: {formatDate(item.returnedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noHistory}>No borrowing history available</p>
          )}
        </Card>
      </div>
    </div>
  )
}

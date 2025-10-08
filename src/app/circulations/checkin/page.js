'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'
import styles from '../circulation.module.css'

export default function CheckinPage() {
  const [formData, setFormData] = useState({
    patronBarcode: '',
    itemBarcode: '',
    point: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [checkinResult, setCheckinResult] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
    if (checkinResult) setCheckinResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setCheckinResult(null)

    try {
      const response = await fetch('/api/circulations/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          point: Number(formData.point) || 0,
        }),
      })

      const data = await response.json()

      if (data.status) {
        setSuccess(data.message)
        setCheckinResult(data.data)

        // Clear form after successful checkin
        setTimeout(() => {
          setFormData({
            patronBarcode: '',
            itemBarcode: '',
            point: 0,
          })
          setSuccess('')
          setCheckinResult(null)
        }, 5000)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Checkin error:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      patronBarcode: '',
      itemBarcode: '',
      point: 0,
    })
    setError('')
    setSuccess('')
    setCheckinResult(null)
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Book Check-in</h1>
        <p className={styles.pageSubtitle}>
          Return books and award points to patrons
        </p>
      </div>

      <div className={styles.contentGrid}>
        <Card title='Check-in Information'>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <Alert
                type='error'
                message={error}
                onClose={() => setError('')}
              />
            )}

            {success && (
              <Alert
                type='success'
                message={success}
                onClose={() => setSuccess('')}
              />
            )}

            <Input
              label='Patron Barcode'
              name='patronBarcode'
              type='text'
              value={formData.patronBarcode}
              onChange={handleInputChange}
              placeholder='Scan or enter patron barcode'
              required
              autoFocus
            />

            <Input
              label='Item Barcode'
              name='itemBarcode'
              type='text'
              value={formData.itemBarcode}
              onChange={handleInputChange}
              placeholder='Scan or enter item barcode'
              required
            />

            <Input
              label='Points to Award'
              name='point'
              type='number'
              value={formData.point}
              onChange={handleInputChange}
              placeholder='0'
              min='0'
              max='100'
            />

            <div className={styles.formActions}>
              <Button
                type='submit'
                variant='primary'
                disabled={loading}
                className={styles.submitButton}
              >
                {loading ? 'Processing...' : 'Check-in Item'}
              </Button>

              <Button
                type='button'
                variant='secondary'
                onClick={resetForm}
                disabled={loading}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Card>

        {checkinResult && (
          <Card title='Check-in Successful'>
            <div className={styles.resultCard}>
              <div className={styles.resultItem}>
                <strong>Patron:</strong> {checkinResult.patron}
              </div>
              <div className={styles.resultItem}>
                <strong>Item:</strong> {checkinResult.item}
              </div>
              <div className={styles.resultItem}>
                <strong>Points Awarded:</strong> {checkinResult.pointsAwarded}
              </div>
            </div>
          </Card>
        )}

        <Card title='Check-in Guidelines'>
          <div className={styles.guidelines}>
            <ul className={styles.guidelinesList}>
              <li>Verify the item is currently checked out</li>
              <li>Check patron information matches the checkout record</li>
              <li>Award points for reading programs or competitions</li>
              <li>Points are added to patron's total score</li>
              <li>Item will be marked as available for checkout</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}

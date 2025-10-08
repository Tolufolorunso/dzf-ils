'use client'

import { useState } from 'react'
import Button from '@/components/ui/button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'
import styles from '../circulation.module.css'

export default function RenewalPage() {
  const [formData, setFormData] = useState({
    patronBarcode: '',
    itemBarcode: '',
    newDueDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [renewalResult, setRenewalResult] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
    if (renewalResult) setRenewalResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setRenewalResult(null)

    try {
      const response = await fetch('/api/circulations/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.status) {
        setSuccess(data.message)
        setRenewalResult(data.data)

        // Clear form after successful renewal
        setTimeout(() => {
          setFormData({
            patronBarcode: '',
            itemBarcode: '',
            newDueDate: '',
          })
          setSuccess('')
          setRenewalResult(null)
        }, 5000)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Renewal error:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      patronBarcode: '',
      itemBarcode: '',
      newDueDate: '',
    })
    setError('')
    setSuccess('')
    setRenewalResult(null)
  }

  // Set default new due date to 14 days from now
  const getDefaultDueDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  }

  const handleItemBarcodeChange = (e) => {
    const { value } = e.target
    setFormData((prev) => ({
      ...prev,
      itemBarcode: value,
      newDueDate: prev.newDueDate || getDefaultDueDate(),
    }))
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Item Renewal</h1>
        <p className={styles.pageSubtitle}>Renew library items for patrons</p>
      </div>

      <div className={styles.contentGrid}>
        <Card title='Renewal Information'>
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
              onChange={handleItemBarcodeChange}
              placeholder='Scan or enter item barcode'
              required
            />

            <Input
              label='New Due Date'
              name='newDueDate'
              type='date'
              value={formData.newDueDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />

            <div className={styles.formActions}>
              <Button
                type='submit'
                variant='primary'
                disabled={loading}
                className={styles.submitButton}
              >
                {loading ? 'Processing...' : 'Renew Item'}
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

        {renewalResult && (
          <Card title='Renewal Successful'>
            <div className={styles.resultCard}>
              <div className={styles.resultItem}>
                <strong>Item:</strong> {renewalResult.itemTitle}
              </div>
              <div className={styles.resultItem}>
                <strong>Patron:</strong> {renewalResult.patronName}
              </div>
              <div className={styles.resultItem}>
                <strong>New Due Date:</strong> {renewalResult.newDueDate}
              </div>
              <div className={styles.resultItem}>
                <strong>Renewal Date:</strong> {renewalResult.renewalDate}
              </div>
            </div>
          </Card>
        )}

        <Card title='Renewal Guidelines'>
          <div className={styles.guidelines}>
            <ul className={styles.guidelinesList}>
              <li>Verify patron identity before renewal</li>
              <li>Check if item is eligible for renewal</li>
              <li>Ensure no holds are placed on the item</li>
              <li>Set appropriate new due date</li>
              <li>Confirm patron contact information is current</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}

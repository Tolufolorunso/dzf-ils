'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TextArea from '@/components/ui/TextArea'
import Alert from '@/components/ui/Alert'
import styles from '../catalog.module.css'

export default function NewItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    publisher: '',
    publicationYear: '',
    isbn: '',
    classification: '',
    itemType: 'book',
    itemBarcode: '',
    controlNumber: '',
    callNumber: '',
    location: '',
    description: '',
    notes: '',
    numberOfPages: '',
    language: 'English',
    edition: '',
    series: '',
    subject: '',
    keywords: '',
  })

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/catalogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.status) {
        setMessage('Item created successfully!')
        setFormData({
          title: '',
          subtitle: '',
          author: '',
          publisher: '',
          publicationYear: '',
          isbn: '',
          classification: '',
          itemType: 'book',
          itemBarcode: '',
          controlNumber: '',
          callNumber: '',
          location: '',
          description: '',
          notes: '',
          numberOfPages: '',
          language: 'English',
          edition: '',
          series: '',
          subject: '',
          keywords: '',
        })
        // Redirect to catalog after a short delay
        setTimeout(() => {
          router.push('/catalog')
        }, 2000)
      } else {
        setMessage(data.message || 'Failed to create item')
      }
    } catch (error) {
      setMessage('Network error. Please try again.')
      console.error('Create item error:', error)
    } finally {
      setLoading(false)
    }
  }

  const itemTypeOptions = [
    { value: 'book', label: 'Book' },
    { value: 'journal', label: 'Journal' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'newspaper', label: 'Newspaper' },
    { value: 'cd', label: 'CD' },
    { value: 'dvd', label: 'DVD' },
    { value: 'ebook', label: 'E-Book' },
    { value: 'audiobook', label: 'Audiobook' },
    { value: 'reference', label: 'Reference' },
  ]

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Other', label: 'Other' },
  ]

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Add New Catalog Item</h1>
          <p className={styles.pageSubtitle}>
            Create a new item in the library catalog
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href='/catalog'>
            <Button variant='secondary'>← Back to Catalog</Button>
          </Link>
        </div>
      </div>

      {message && (
        <Alert
          type={message.includes('successfully') ? 'success' : 'error'}
          message={message}
        />
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Information */}
        <Card title='Basic Information'>
          <div className={styles.formGrid}>
            <Input
              label='Title *'
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              placeholder='Enter item title'
            />
            <Input
              label='Subtitle'
              value={formData.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder='Enter subtitle (optional)'
            />
            <Input
              label='Author *'
              value={formData.author}
              onChange={(e) => handleChange('author', e.target.value)}
              required
              placeholder='Enter author name'
            />
            <Input
              label='Publisher'
              value={formData.publisher}
              onChange={(e) => handleChange('publisher', e.target.value)}
              placeholder='Enter publisher name'
            />
            <Input
              label='Publication Year'
              value={formData.publicationYear}
              onChange={(e) => handleChange('publicationYear', e.target.value)}
              type='number'
              placeholder='e.g., 2023'
            />
            <Input
              label='ISBN'
              value={formData.isbn}
              onChange={(e) => handleChange('isbn', e.target.value)}
              placeholder='Enter ISBN (optional)'
            />
          </div>
        </Card>

        {/* Classification & Cataloging */}
        <Card title='Classification & Cataloging'>
          <div className={styles.formGrid}>
            <Input
              label='Classification'
              value={formData.classification}
              onChange={(e) => handleChange('classification', e.target.value)}
              placeholder='e.g., 001.64, 500.5'
            />
            <Select
              label='Item Type *'
              value={formData.itemType}
              onChange={(value) => handleChange('itemType', value)}
              options={itemTypeOptions}
              required
            />
            <Input
              label='Item Barcode *'
              value={formData.itemBarcode}
              onChange={(e) => handleChange('itemBarcode', e.target.value)}
              required
              placeholder='Enter unique barcode'
            />
            <Input
              label='Control Number'
              value={formData.controlNumber}
              onChange={(e) => handleChange('controlNumber', e.target.value)}
              placeholder='Enter control number'
            />
            <Input
              label='Call Number'
              value={formData.callNumber}
              onChange={(e) => handleChange('callNumber', e.target.value)}
              placeholder='Enter call number'
            />
            <Input
              label='Location'
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder='e.g., Main Stacks, Reference'
            />
          </div>
        </Card>

        {/* Additional Information */}
        <Card title='Additional Information'>
          <div className={styles.formGrid}>
            <Input
              label='Number of Pages'
              value={formData.numberOfPages}
              onChange={(e) => handleChange('numberOfPages', e.target.value)}
              type='number'
              placeholder='Enter page count'
            />
            <Select
              label='Language'
              value={formData.language}
              onChange={(value) => handleChange('language', value)}
              options={languageOptions}
            />
            <Input
              label='Edition'
              value={formData.edition}
              onChange={(e) => handleChange('edition', e.target.value)}
              placeholder='e.g., 2nd Edition, Revised'
            />
            <Input
              label='Series'
              value={formData.series}
              onChange={(e) => handleChange('series', e.target.value)}
              placeholder='Enter series name'
            />
            <Input
              label='Subject'
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder='Enter subject keywords'
            />
            <Input
              label='Keywords'
              value={formData.keywords}
              onChange={(e) => handleChange('keywords', e.target.value)}
              placeholder='Enter search keywords (comma-separated)'
            />
          </div>

          <div className={styles.textAreaContainer}>
            <TextArea
              label='Description'
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder='Enter item description...'
              rows={4}
            />
            <TextArea
              label='Notes'
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder='Enter any additional notes...'
              rows={3}
            />
          </div>
        </Card>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Link href='/catalog'>
            <Button variant='secondary' type='button'>
              Cancel
            </Button>
          </Link>
          <Button
            variant='primary'
            type='submit'
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Creating Item...' : 'Create Item'}
          </Button>
        </div>
      </form>
    </div>
  )
}

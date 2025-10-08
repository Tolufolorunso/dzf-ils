'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'
import Select from '@/components/ui/Select'
import styles from '../auth.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'librarian',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const roleOptions = [
    { value: 'librarian', label: 'Librarian' },
    { value: 'asst_admin', label: 'Assistant Admin' },
    { value: 'ima', label: 'IMA' },
    { value: 'ict', label: 'ICT' },
    { value: 'facility', label: 'Facility' },
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (data.status) {
        setSuccess(data.message)
        // Redirect to login page after successful registration
        setTimeout(() => {
          router.push('/auth/login')
        }, 1500)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSubtitle}>
            Join the library management system
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className={styles.authForm}>
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
              label='Full Name'
              name='name'
              type='text'
              value={formData.name}
              onChange={handleInputChange}
              placeholder='Enter your full name'
              required
              autoComplete='name'
            />

            <Input
              label='Username'
              name='username'
              type='text'
              value={formData.username}
              onChange={handleInputChange}
              placeholder='Choose a username'
              required
              autoComplete='username'
            />

            <Select
              label='Role'
              name='role'
              value={formData.role}
              onChange={handleInputChange}
              options={roleOptions}
              required
            />

            <Input
              label='Password'
              name='password'
              type='password'
              value={formData.password}
              onChange={handleInputChange}
              placeholder='Create a password'
              required
              autoComplete='new-password'
            />

            <Input
              label='Confirm Password'
              name='confirmPassword'
              type='password'
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder='Confirm your password'
              required
              autoComplete='new-password'
            />

            <Button
              type='submit'
              variant='primary'
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Card>

        <div className={styles.authFooter}>
          <p>
            Already have an account?{' '}
            <Link href='/auth/login' className={styles.authLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

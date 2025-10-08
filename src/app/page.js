'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/button'
import Card from '@/components/ui/Card'
import styles from './page.module.css'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in by checking for auth token
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/me')
        setIsLoggedIn(response.ok)
      } catch (error) {
        setIsLoggedIn(false)
      }
    }
    checkAuthStatus()
  }, [])
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Dzuels Educational Foundation</h1>
            <h2 className={styles.heroSubtitle}>Library Management System</h2>
            <p className={styles.heroDescription}>
              Efficiently manage Our library operations with our comprehensive
              digital solution for book circulation, patron management, and
              more.
            </p>

            {!isLoggedIn && (
              <div className={styles.heroActions}>
                <Link href='/auth/login'>
                  <Button variant='primary' className={styles.heroButton}>
                    Sign In
                  </Button>
                </Link>
                <Link href='/auth/register'>
                  <Button variant='secondary' className={styles.heroButton}>
                    Register
                  </Button>
                </Link>
              </div>
            )}
            {isLoggedIn && (
              <div className={styles.heroActions}>
                <Link href='/dashboard'>
                  <Button variant='primary' className={styles.heroButton}>
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className={styles.features}>
          <h3 className={styles.featuresTitle}>Key Features</h3>
          <div className={styles.featuresGrid}>
            <Card title='Book Circulation'>
              <div className={styles.featureContent}>
                <p>
                  Streamlined checkout and check-in processes for efficient book
                  management.
                </p>
                <div className={styles.featureActions}>
                  <Link href='/circulations/checkout'>
                    <Button variant='primary' className={styles.featureButton}>
                      Checkout
                    </Button>
                  </Link>
                  <Link href='/circulations/checkin'>
                    <Button
                      variant='secondary'
                      className={styles.featureButton}
                    >
                      Check-in
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <Card title='Patron Management'>
              <div className={styles.featureContent}>
                <p>
                  Comprehensive patron database with barcode integration and
                  borrowing history.
                </p>
                <div className={styles.featureActions}>
                  <Link href='/patrons'>
                    <Button variant='primary' className={styles.featureButton}>
                      View Patrons
                    </Button>
                  </Link>
                  <Link href='/patrons/upload'>
                    <Button
                      variant='secondary'
                      className={styles.featureButton}
                    >
                      Add Patron
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            <Card title='Event Tracking'>
              <div className={styles.featureContent}>
                <p>
                  Track reading programs and award points for patron engagement
                  and participation.
                </p>
                <div className={styles.featureActions}>
                  <Link href='/circulations/holds'>
                    <Button variant='primary' className={styles.featureButton}>
                      View Holds
                    </Button>
                  </Link>
                  <Link href='/circulations/overdues'>
                    <Button
                      variant='secondary'
                      className={styles.featureButton}
                    >
                      Overdues
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/button'
import StatsCard from '@/components/ui/StatsCard'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Library Management Dashboard</h1>
        <p className={styles.dashboardSubtitle}>
          Welcome to the Digital Zone United Evangelical Lutheran School Library
          Management System
        </p>
      </div>

      {/* Library Statistics */}
      <div className={styles.statsSection}>
        <h2 className={styles.statsTitle}>Library Statistics</h2>
        <div className={styles.statsGrid}>
          <StatsCard
            title='Total Borrowed'
            value='21'
            icon='📚'
            color='primary'
          />
          <StatsCard
            title='Total Overdues'
            value='21'
            icon='⚠️'
            color='warning'
          />
          <StatsCard
            title='Overdue Over a Month'
            value='21'
            icon='🔴'
            color='danger'
          />
          <StatsCard
            title='Total Students'
            value='532'
            icon='👨‍🎓'
            color='info'
          />
          <StatsCard
            title='Total Staff'
            value='9'
            icon='👨‍💼'
            color='secondary'
          />
          <StatsCard title='Total Guests' value='4' icon='👤' color='default' />
          <StatsCard
            title='Total Teachers'
            value='29'
            icon='👩‍🏫'
            color='success'
          />
          <StatsCard title='Female' value='333' icon='👩' color='info' />
          <StatsCard title='Male' value='199' icon='👨' color='primary' />
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        <Card title='Circulation Management'>
          <div className={styles.cardContent}>
            <p className={styles.cardDescription}>
              Manage book checkouts and returns for library patrons.
            </p>
            <div className={styles.cardActions}>
              <Link href='/circulations/checkout'>
                <Button variant='primary' className={styles.actionButton}>
                  Checkout Books
                </Button>
              </Link>
              <Link href='/circulations/checkin'>
                <Button variant='secondary' className={styles.actionButton}>
                  Check-in Books
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card title='Quick Actions'>
          <div className={styles.cardContent}>
            <div className={styles.quickActions}>
              <Link
                href='/circulations/checkout'
                className={styles.quickAction}
              >
                <div className={styles.quickActionIcon}>📚</div>
                <span>Checkout</span>
              </Link>
              <Link href='/circulations/checkin' className={styles.quickAction}>
                <div className={styles.quickActionIcon}>↩️</div>
                <span>Check-in</span>
              </Link>
              <Link href='/circulations/holds' className={styles.quickAction}>
                <div className={styles.quickActionIcon}>🔒</div>
                <span>Holds</span>
              </Link>
              <Link
                href='/circulations/overdues'
                className={styles.quickAction}
              >
                <div className={styles.quickActionIcon}>⚠️</div>
                <span>Overdues</span>
              </Link>
            </div>
          </div>
        </Card>

        {/* Last Registered Patron */}
        <Card title='Last Registered Patron'>
          <div className={styles.lastRegisteredCard}>
            <div className={styles.patronInfo}>
              <Avatar size='md'>
                <div className='avatar-fallback'>GA</div>
              </Avatar>
              <div className={styles.patronDetails}>
                <div className={styles.patronName}>Gift Alufa</div>
                <div className={styles.patronBarcode}>Barcode: 20250574</div>
                <div className={styles.registrationDate}>
                  Registered: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title='System Information'>
          <div className={styles.cardContent}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>System Status:</strong>
                <span className={styles.statusOnline}>Online</span>
              </div>
              <div className={styles.infoItem}>
                <strong>Last Updated:</strong>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

import styles from './layout.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>
              Dzuels Educational Foundation
            </h3>
            <p className={styles.footerDescription}>
              Library Management System
            </p>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerSubtitle}>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li>
                <a href='/dashboard'>Dashboard</a>
              </li>
              <li>
                <a href='/circulations/checkout'>Checkout</a>
              </li>
              <li>
                <a href='/circulations/checkin'>Check-in</a>
              </li>
              <li>
                <a href='/patrons'>Patrons</a>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerSubtitle}>Support</h4>
            <ul className={styles.footerLinks}>
              <li>
                <a href='/help'>Help Center</a>
              </li>
              <li>
                <a href='/contact'>Contact Us</a>
              </li>
              <li>
                <a href='/about'>About</a>
              </li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4 className={styles.footerSubtitle}>Contact Info</h4>
            <div className={styles.contactInfo}>
              <p>📧 library@dzuelsfoundation.org</p>
              <p>📞 +234 80000000000000</p>
              <p>📍 Dzuels Educational Foundation, Nigeria</p>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} DZUELS Educational Foundation. All
            rights reserved.
          </p>
          <div className={styles.footerBottomLinks}>
            <a href='/privacy'>Privacy Policy</a>
            <a href='/terms'>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

import Card from '@/components/ui/Card';
import LoginForm from '@/app/auth/login/LoginForm';
import styles from '../auth.module.css';

export default function LoginPage() {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Welcome Back</h1>
          <p className={styles.authSubtitle}>Sign in to your account</p>
        </div>

        <LoginForm />

        <div className={styles.authFooter}>
          <p>
            Don&apos;t have an account?{' '}
            <a href='/auth/register' className={styles.authLink}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import Button from '@/components/ui/button'
// import Input from '@/components/ui/Input'
// import Card from '@/components/ui/Card'
// import Alert from '@/components/ui/Alert'
// import styles from '../auth.module.css'

// export default function LoginPage() {
//   const router = useRouter()
//   const [formData, setFormData] = useState({
//     username: '',
//     password: '',
//   })
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')

//   const handleInputChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }))
//     // Clear error when user starts typing
//     if (error) setError('')
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')
//     setSuccess('')

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       })

//       const data = await response.json()

//       if (data.status) {
//         setSuccess(data.message)
//         // Redirect to dashboard after successful login
//         setTimeout(() => {
//           router.push('/dashboard')
//         }, 1000)
//       } else {
//         setError(data.message)
//       }
//     } catch (err) {
//       setError('Network error. Please try again.')
//       console.error('Login error:', err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className={styles.authContainer}>
//       <div className={styles.authCard}>
//         <div className={styles.authHeader}>
//           <h1 className={styles.authTitle}>Welcome Back</h1>
//           <p className={styles.authSubtitle}>Sign in to your account</p>
//         </div>

//         <Card>
//           <form onSubmit={handleSubmit} className={styles.authForm}>
//             {error && (
//               <Alert
//                 type='error'
//                 message={error}
//                 onClose={() => setError('')}
//               />
//             )}

//             {success && (
//               <Alert
//                 type='success'
//                 message={success}
//                 onClose={() => setSuccess('')}
//               />
//             )}

//             <Input
//               label='Username'
//               name='username'
//               type='text'
//               value={formData.username}
//               onChange={handleInputChange}
//               placeholder='Enter your username'
//               required
//               autoComplete='username'
//             />

//             <Input
//               label='Password'
//               name='password'
//               type='password'
//               value={formData.password}
//               onChange={handleInputChange}
//               placeholder='Enter your password'
//               required
//               autoComplete='current-password'
//             />

//             <Button
//               type='submit'
//               variant='primary'
//               disabled={loading}
//               className={styles.submitButton}
//             >
//               {loading ? 'Signing in...' : 'Sign In'}
//             </Button>
//           </form>
//         </Card>

//         <div className={styles.authFooter}>
//           <p>
//             Don't have an account?{' '}
//             <Link href='/auth/register' className={styles.authLink}>
//               Sign up
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }

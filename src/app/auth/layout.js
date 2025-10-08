export const metadata = {
  title: 'Authentication - Library Management System',
  description: 'Sign in or register to access the library management system',
}

export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  )
}

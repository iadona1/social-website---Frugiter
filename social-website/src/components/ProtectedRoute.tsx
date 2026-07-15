import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setStatus('invalid')
        return
      }

      try {
        const res = await fetch('http://localhost:3001/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setStatus('invalid')
          return
        }

        const data = await res.json()

        // Refresh the stored user with latest data from server
        localStorage.setItem('user', JSON.stringify(data.user))
        setStatus('valid')

      } catch {
        setStatus('invalid')
      }
    }

    verify()
  }, [])

  if (status === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #a8dfff 0%, #5bc8f5 20%, #59cc6e 65%, #a8f0a0 100%)',
        fontFamily: 'Nunito, sans-serif',
        fontSize: '18px',
        fontWeight: '700',
        color: 'white',
        textShadow: '0 2px 8px rgba(0,60,140,0.4)'
      }}>
        Loading...
      </div>
    )
  }

  if (status === 'invalid') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
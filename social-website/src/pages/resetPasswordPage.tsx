import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../styles/Welcome.css'
import '../styles/forgotPassword.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setStatus('error')
      setMessage('Password must be at least 6 characters.')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error)
        return
      }

      setStatus('success')
      setMessage(data.message)

    } catch {
      setStatus('error')
      setMessage('Could not connect to server. Is it running?')
    }
  }

  return (
    <div className="welcome-page">
      <div className="welcome-bg-fallback" />
      <div className="bubbles">
        {Array.from({ length: 10 }).map((_, i) => (
          <div className="bubble" key={i} />
        ))}
      </div>

      <nav className="welcome-navbar">
        <div className="navbar-logo">Aero<span>Social</span></div>
      </nav>

      <main className="fp-main">
        <div className="fp-card">

          {status !== 'success' ? (
            <>
              <div className="card-title">Reset Password</div>
              <div className="card-sub">Enter your new password below.</div>

              <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    className="aero-input"
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <input
                    className="aero-input"
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {status === 'error' && (
                  <div style={{
                    background: 'rgba(220,50,50,0.15)',
                    border: '1px solid rgba(220,50,50,0.4)',
                    color: '#a02020',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    marginBottom: '12px'
                  }}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-signup"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <div className="fp-success">
              <div className="fp-success-icon">✅</div>
              <div className="card-title">Password Reset!</div>
              <div className="card-sub" style={{ marginTop: '8px' }}>
                {message}
              </div>
              <button
                className="btn-signup"
                style={{ marginTop: '20px' }}
                onClick={() => navigate('/')}
              >
                Back to Login
              </button>
            </div>
          )}

          {status !== 'success' && (
            <button className="fp-back-btn" onClick={() => navigate('/')}>
              ← Back to Login
            </button>
          )}

        </div>
      </main>
    </div>
  )
}
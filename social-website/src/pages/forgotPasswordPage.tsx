import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Welcome.css'
import '../styles/forgotPassword.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      setMessage(data.message)
      setStatus('sent')

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

          {status !== 'sent' ? (
            <>
              <div className="card-title">Forgot Password</div>
              <div className="card-sub">
                Enter your email and we'll send you a reset link.
              </div>

              <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <input
                    className="aero-input"
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                  {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="fp-success">
              <div className="fp-success-icon">✉️</div>
              <div className="card-title">Check your email!</div>
              <div className="card-sub" style={{ marginTop: '8px' }}>
                {message}
              </div>
            </div>
          )}

          <button
            className="fp-back-btn"
            onClick={() => navigate('/')}
          >
            ← Back to Login
          </button>

        </div>
      </main>
    </div>
  )
}
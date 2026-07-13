import '../styles/Welcome.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import peopleIcon from '../assets/small-Frugiter-Icons-(2).png'

export default function Welcome() {
  const navigate = useNavigate()

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    password: '',
  })
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        setLoginError(data.error)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/home')

    } catch {
      setLoginError('Could not connect to server. Is it running?')
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError('')
    setSignupLoading(true)

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      })

      const data = await res.json()

      if (!res.ok) {
        setSignupError(data.error)
        setSignupLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/home')

    } catch {
      setSignupError('Could not connect to server. Is it running?')
      setSignupLoading(false)
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
        <form className="navbar-auth" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
          />
          <button type="submit" className="btn-login">Log In</button>
          <a href="#" className="navbar-forgot">Forgot password?</a>
        </form>
        {loginError && (
          <div style={{
            position: 'absolute',
            top: '58px',
            right: '24px',
            background: 'rgba(220,50,50,0.85)',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            backdropFilter: 'blur(8px)'
          }}>
            {loginError}
          </div>
        )}
      </nav>

      <main className="welcome-content">
        <div className="welcome-left">
          <img src={peopleIcon} alt="AeroSocial" className="welcome-icon" />
          <h1 className="welcome-tagline">
            Connect and share with the people in your life.
          </h1>
          <p className="welcome-sub">
            AeroSocial helps you stay in touch with friends and family,
            share your moments, and discover new connections.
          </p>
        </div>

        <div className="welcome-card">
          <div className="card-title">Sign Up</div>
          <div className="card-sub">It's free and always will be.</div>

          <form onSubmit={handleSignup}>
            <div className="card-row">
              <input
                className="aero-input"
                type="text"
                placeholder="First Name"
                value={signupData.firstName}
                onChange={e => setSignupData({ ...signupData, firstName: e.target.value })}
              />
              <input
                className="aero-input"
                type="text"
                placeholder="Last Name"
                value={signupData.lastName}
                onChange={e => setSignupData({ ...signupData, lastName: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <input
                className="aero-input"
                type="email"
                placeholder="Your Email"
                value={signupData.email}
                onChange={e => setSignupData({ ...signupData, email: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <input
                className="aero-input"
                type="email"
                placeholder="Re-enter Email"
                value={signupData.confirmEmail}
                onChange={e => setSignupData({ ...signupData, confirmEmail: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input
                className="aero-input"
                type="password"
                placeholder="New Password"
                value={signupData.password}
                onChange={e => setSignupData({ ...signupData, password: e.target.value })}
              />
            </div>

            {signupError && (
              <div style={{
                background: 'rgba(220,50,50,0.15)',
                border: '1px solid rgba(220,50,50,0.4)',
                color: '#a02020',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '12px'
              }}>
                {signupError}
              </div>
            )}

            <div className="card-divider" />

            <button
              type="submit"
              className="btn-signup"
              disabled={signupLoading}
            >
              {signupLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </main>

      <footer className="welcome-footer">
        <div>
          <a href="#">English</a> ·
          <a href="#">Privacy</a> ·
          <a href="#">Terms</a> ·
          <a href="#">About</a> ·
          <a href="#">Help</a>
        </div>
        <div style={{ marginTop: '4px' }}>AeroSocial © 2025</div>
      </footer>
    </div>
  )
}
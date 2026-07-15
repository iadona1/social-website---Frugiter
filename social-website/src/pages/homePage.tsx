import '../styles/Home.css'
import { useState } from 'react'
import type { User } from '../types/index'
import WindowsTitleBar from '../components/WindowsTitleBar'

export default function Home() {
  const [user] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'))

  return (
    <div className="home-page">
      <WindowsTitleBar title="AeroSocial — Home" />
      <div className="home-bg" />

      <nav className="home-navbar">
        <div className="navbar-logo">Aero<span>Social</span></div>
        <div className="navbar-user">
          <img
            src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
            alt="avatar"
            className="nav-avatar"
          />
          <span className="nav-username">{user.displayName || 'User'}</span>
        </div>
      </nav>

      <main className="home-coming-soon">
        <div className="coming-soon-card">
          <div className="coming-soon-icon">🌿</div>
          <h1 className="coming-soon-title">Coming Soon</h1>
          <p className="coming-soon-sub">
            Your feed is on its way. Something beautiful is being built.
          </p>
        </div>
      </main>
    </div>
  )
}
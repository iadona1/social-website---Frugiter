import '../styles/profilePage.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types/index'
import WindowsTitleBar from '../components/WindowsTitleBar'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'))

  return (
    <div className="profile-page">
      <WindowsTitleBar title="AeroSocial — Profile" />
      <div className="profile-bg" />

      <nav className="home-navbar">
        <div
          className="navbar-logo"
          onClick={() => navigate('/home')}
          style={{ cursor: 'pointer' }}
        >
          Aero<span>Social</span>
        </div>
        <div className="navbar-right">
          <button className="navbar-notif-btn" title="Notifications">🔔</button>
          <div
            className="navbar-user"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
              alt="avatar"
              className="nav-avatar"
            />
            <span className="nav-username">{user.displayName || 'User'}</span>
          </div>
        </div>
      </nav>

      <main className="profile-main">

        {/* Banner */}
        <div className="profile-banner">
          <div className="profile-banner-shine" />
        </div>

        {/* Profile card */}
        <div className="profile-card">
          <div className="profile-card-shine" />

          <div className="profile-avatar-wrapper">
            <img
              src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
              alt="avatar"
              className="profile-avatar"
            />
          </div>

          <div className="profile-info">
            <div className="profile-display-name">{user.displayName}</div>
            <div className="profile-email">{user.email}</div>
            <div className="profile-bio-placeholder">No bio yet.</div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-number">0</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <div className="profile-stat-number">0</div>
              <div className="profile-stat-label">Friends</div>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <div className="profile-stat-number">0</div>
              <div className="profile-stat-label">Likes</div>
            </div>
          </div>
        </div>

        {/* Coming soon posts section */}
        <div className="profile-posts-placeholder">
          <div className="profile-posts-icon">📝</div>
          <div className="profile-posts-title">Posts coming soon</div>
          <div className="profile-posts-sub">Your posts will appear here.</div>
        </div>

      </main>
    </div>
  )
}
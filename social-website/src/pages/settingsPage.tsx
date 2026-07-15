import '../styles/settings.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types/index'
import WindowsTitleBar from '../components/WindowsTitleBar'

export default function Settings() {
  const navigate = useNavigate()
  const [user] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const [visible, setVisible] = useState(true)

  const handleBack = () => {
    setVisible(false)
    setTimeout(() => {
      navigate('/home')
    }, 500)
  }

  return (
    <div className={`settings-page ${visible ? 'settings-enter' : 'settings-exit'}`}>
      <WindowsTitleBar title="AeroSocial — Settings" />
      <div className="settings-bg" />

      <div className="bubbles">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="bubble" key={i} />
        ))}
      </div>

      <div className="settings-container">

        {/* User card at top */}
        <div className="settings-user-card">
          <img
            src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
            alt="avatar"
            className="settings-avatar"
          />
          <div className="settings-user-info">
            <div className="settings-display-name">{user.displayName}</div>
            <div className="settings-email">{user.email}</div>
          </div>
          <button className="settings-back-btn" onClick={handleBack}>
            ← Back to Feed
          </button>
        </div>

        {/* Settings sections */}
        <div className="settings-grid">

          <div className="settings-card">
            <div className="settings-card-title">👤 Account</div>
            <div className="settings-item">
              <span>Display Name</span>
              <input
                className="settings-input"
                defaultValue={user.displayName}
                placeholder="Display Name"
              />
            </div>
            <div className="settings-item">
              <span>Username</span>
              <input
                className="settings-input"
                placeholder="Username"
              />
            </div>
            <div className="settings-item">
              <span>Bio</span>
              <textarea
                className="settings-input settings-textarea"
                placeholder="Write something about yourself..."
              />
            </div>
            <button className="settings-save-btn">Save Changes</button>
          </div>

          <div className="settings-card">
            <div className="settings-card-title">🎨 Avatar</div>
            <div className="settings-avatar-preview">
              <img
                src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
                alt="current avatar"
              />
              <span>Current icon</span>
            </div>
            <button
              className="settings-save-btn"
              onClick={() => navigate('/select-avatar')}
            >
              Change Avatar
            </button>
          </div>

          <div className="settings-card">
            <div className="settings-card-title">🔒 Password</div>
            <div className="settings-item">
              <span>Current Password</span>
              <input
                className="settings-input"
                type="password"
                placeholder="Current password"
              />
            </div>
            <div className="settings-item">
              <span>New Password</span>
              <input
                className="settings-input"
                type="password"
                placeholder="New password"
              />
            </div>
            <div className="settings-item">
              <span>Confirm Password</span>
              <input
                className="settings-input"
                type="password"
                placeholder="Confirm new password"
              />
            </div>
            <button className="settings-save-btn">Update Password</button>
          </div>

          <div className="settings-card">
            <div className="settings-card-title">⚠️ Danger Zone</div>
            <p style={{ fontSize: '12px', color: '#4a7ab5', marginBottom: '12px' }}>
              These actions are permanent and cannot be undone.
            </p>
            <button className="settings-danger-btn">Delete Account</button>
          </div>

        </div>
      </div>
    </div>
  )
}
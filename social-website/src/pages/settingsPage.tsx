import '../styles/settings.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types/index'
import WindowsTitleBar from '../components/WindowsTitleBar'

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const [visible, setVisible] = useState(true)

  // Account settings state
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [accountMsg, setAccountMsg] = useState('')
  const [accountErr, setAccountErr] = useState('')
  const [accountLoading, setAccountLoading] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordErr, setPasswordErr] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteErr, setDeleteErr] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleBack = () => {
    setVisible(false)
    setTimeout(() => navigate('/home'), 500)
  }

  const handleSaveAccount = async () => {
    setAccountMsg('')
    setAccountErr('')
    setAccountLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName, username, bio })
      })

      const data = await res.json()

      if (!res.ok) {
        setAccountErr(data.error)
        return
      }

      // Update localStorage with new user data
      const updatedUser = { ...user, displayName: data.user.displayName }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setAccountMsg('Settings saved successfully!')

    } catch {
      setAccountErr('Could not connect to server.')
    } finally {
      setAccountLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    setPasswordMsg('')
    setPasswordErr('')
    setPasswordLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      })

      const data = await res.json()

      if (!res.ok) {
        setPasswordErr(data.error)
        return
      }

      setPasswordMsg('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

    } catch {
      setPasswordErr('Could not connect to server.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteErr('')
    setDeleteLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/auth/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      })

      const data = await res.json()

      if (!res.ok) {
        setDeleteErr(data.error)
        setDeleteLoading(false)
        return
      }

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/')

    } catch {
      setDeleteErr('Could not connect to server.')
      setDeleteLoading(false)
    }
  }

  return (
    <div className={`settings-page ${visible ? 'settings-enter' : 'settings-exit'}`}>
      <WindowsTitleBar title="AeroSocial — Settings" />
      <div className="settings-bg" />

      <div className="settings-container">

        {/* User card */}
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

        <div className="settings-grid">

          {/* Account card */}
          <div className="settings-card">
            <div className="settings-card-title">👤 Account</div>

            <div className="settings-item">
              <span>Display Name</span>
              <input
                className="settings-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Display Name"
              />
            </div>

            <div className="settings-item">
              <span>Username</span>
              <input
                className="settings-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="New username"
              />
            </div>

            <div className="settings-item">
              <span>Bio</span>
              <textarea
                className="settings-input settings-textarea"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Write something about yourself..."
              />
            </div>

            {accountErr && <div className="settings-error">{accountErr}</div>}
            {accountMsg && <div className="settings-success">{accountMsg}</div>}

            <button
              className="settings-save-btn"
              onClick={handleSaveAccount}
              disabled={accountLoading}
            >
              {accountLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Password card */}
          <div className="settings-card">
            <div className="settings-card-title">🔒 Password</div>

            <div className="settings-item">
              <span>Current Password</span>
              <input
                className="settings-input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
            </div>

            <div className="settings-item">
              <span>New Password</span>
              <input
                className="settings-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
              />
            </div>

            <div className="settings-item">
              <span>Confirm New Password</span>
              <input
                className="settings-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            {passwordErr && <div className="settings-error">{passwordErr}</div>}
            {passwordMsg && <div className="settings-success">{passwordMsg}</div>}

            <button
              className="settings-save-btn"
              onClick={handleUpdatePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          {/* Danger zone card */}
          <div className="settings-card">
            <div className="settings-card-title">⚠️ Danger Zone</div>

            <p className="settings-danger-text">
              Deleting your account is permanent and cannot be undone. All your posts, comments and data will be lost forever.
            </p>

            {!showDeleteConfirm ? (
              <button
                className="settings-danger-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </button>
            ) : (
              <div className="settings-delete-confirm">
                <p className="settings-danger-text">
                  Enter your password to confirm deletion:
                </p>
                <input
                  className="settings-input"
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                />
                {deleteErr && <div className="settings-error">{deleteErr}</div>}
                <div className="settings-delete-btns">
                  <button
                    className="settings-back-btn"
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword('')
                      setDeleteErr('')
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="settings-danger-btn"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
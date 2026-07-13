import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_AVATARS } from '../constants/avatars'
import type { User } from '../types/index'
import '../styles/selectAvatar.css'

export default function SelectAvatar() {
  const navigate = useNavigate()
  const user: User = JSON.parse(localStorage.getItem('user') || '{}')
  const [selected, setSelected] = useState(DEFAULT_AVATARS[0].url)
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/auth/select-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatarUrl: selected })
      })
      
 await res.json()

// Update the stored user with new avatar regardless
const updatedUser = { ...user, avatarUrl: selected }
localStorage.setItem('user', JSON.stringify(updatedUser))
navigate('/home')

    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <div className="select-avatar-page">

      {/* Vista-style background */}
      <div className="vista-bg" />

      <div className="vista-container">

        <div className="vista-card">
          <div className="vista-greeting">Welcome, {user.displayName}!</div>
          <div className="vista-sub">Choose your profile icon</div>

          {/* Selected avatar display — Vista style */}
          <div className="vista-selected-wrapper">
            <div className="vista-selected-frame">
              <img
                src={selected}
                alt="Selected avatar"
                className="vista-selected-img"
              />
            </div>
          </div>

          {/* Avatar grid */}
          <div className="vista-avatar-grid">
            {DEFAULT_AVATARS.map(avatar => (
              <div
                key={avatar.id}
                className={`vista-avatar-item ${selected === avatar.url ? 'active' : ''}`}
                onClick={() => setSelected(avatar.url)}
                title={avatar.color}
              >
                <img src={avatar.url} alt={avatar.color} />
                <span>{avatar.color}</span>
              </div>
            ))}
          </div>

          <button
            className="vista-confirm-btn"
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Confirm →'}
          </button>
        </div>

      </div>

      {/* Vista bottom bar */}
      <div className="vista-taskbar">
        <div className="vista-taskbar-logo">AeroSocial</div>
      </div>

    </div>
  )
}
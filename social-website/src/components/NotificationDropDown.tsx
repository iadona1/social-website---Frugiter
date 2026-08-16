import '../styles/NotificationDropDown.css'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Notification } from '../types'

const typeIcon: Record<string, string> = {
  like: '💙',
  comment: '💬',
  friend_request: '👤',
  accepted: '✅',
  reply: '↩️'
}

export default function NotificationDropdown() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setNotifications(data.notifications)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = () => {
    setOpen(prev => !prev)
    if (!open) fetchNotifications()
  }

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('token')
    await fetch('http://localhost:3001/api/notifications/read-all', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleClick = async (n: Notification) => {
    const token = localStorage.getItem('token')
    await fetch(`http://localhost:3001/api/notifications/${n.id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    setNotifications(prev => prev.map(notif =>
      notif.id === n.id ? { ...notif, isRead: true } : notif
    ))
    setOpen(false)
    if (n.postId) navigate(`/post/${n.postId}`)
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    if (days > 0) return `${days}d ago`
    if (hrs > 0) return `${hrs}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'Just now'
  }

  return (
    <div className="notif-wrapper" ref={ref}>
      <button className="navbar-notif-btn" onClick={handleOpen} title="Notifications">
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-shine" />

          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">🔔</div>
                <div>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="notif-avatar-wrapper">
                    <img src={n.fromAvatar} alt="" className="notif-avatar" />
                    <span className="notif-type-icon">{typeIcon[n.type] || '🔔'}</span>
                  </div>
                  <div className="notif-content">
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
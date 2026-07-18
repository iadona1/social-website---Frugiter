import '../styles/notificationDropdown.css'
import { useState, useRef, useEffect } from 'react'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'friend_request' | 'accepted'
  message: string
  time: string
  read: boolean
}

// Placeholder notifications for now
const PLACEHOLDER: Notification[] = [
  {
    id: '1',
    type: 'like',
    message: 'Someone liked your post',
    time: 'Just now',
    read: false
  },
  {
    id: '2',
    type: 'comment',
    message: 'Someone commented on your post',
    time: '5m ago',
    read: false
  },
  {
    id: '3',
    type: 'friend_request',
    message: 'You have a new friend request',
    time: '1h ago',
    read: true
  },
]

const typeIcon = {
  like: '💙',
  comment: '💬',
  friend_request: '👤',
  accepted: '✅'
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(PLACEHOLDER)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="notif-wrapper" ref={ref}>
      <button
        className="navbar-notif-btn"
        onClick={() => setOpen(prev => !prev)}
        title="Notifications"
      >
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
                  className={`notif-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleMarkRead(n.id)}
                >
                  <div className="notif-icon">{typeIcon[n.type]}</div>
                  <div className="notif-content">
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                  {!n.read && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
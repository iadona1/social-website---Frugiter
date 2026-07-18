import '../styles/navDock.css'
import { useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { icon: '🏠', label: 'Home',          path: '/home' },
  { icon: '👤', label: 'Profile',       path: '/profile' },
  { icon: '🔔', label: 'Notifications', path: '/notifications' },
  { icon: '⚙️', label: 'Settings',      path: '/settings' },
]

export default function NavDock() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside className="nav-dock">
      {navItems.map(item => (
        <button
          key={item.path}
          className={`dock-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
          title={item.label}
        >
          <span className="dock-icon">{item.icon}</span>
          <span className="dock-label">{item.label}</span>
        </button>
      ))}
    </aside>
  )
}
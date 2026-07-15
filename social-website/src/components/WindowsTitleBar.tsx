import '../styles/WindowsTitleBar.css'
import { useNavigate } from 'react-router-dom'

interface WindowsTitleBarProps {
  title?: string
}

export default function WindowsTitleBar({ title = 'AeroSocial' }: WindowsTitleBarProps) {
  const navigate = useNavigate()

  const handleClose = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleMinimize = () => {
    const page = document.querySelector('.home-page') as HTMLElement
    if (!page) return

    page.classList.add('minimizing')

    setTimeout(() => {
      navigate('/settings')
    }, 500)
  }

  return (
    <div className="win-titlebar">
      <div className="win-titlebar-left">
        <div className="win-titlebar-icon">
          <img src="/assets/small-Frugiter-Icons-(2).png" alt="icon" />
        </div>
        <span className="win-titlebar-title">{title}</span>
      </div>
      <div className="win-titlebar-buttons">
        {/* Minimize - goes to settings */}
        <button className="win-btn win-minimize" title="Settings" onClick={handleMinimize}>
          <span>─</span>
        </button>
        {/* Maximize - decorative */}
        <button className="win-btn win-maximize" title="Maximize">
          <span>□</span>
        </button>
        {/* Close - logs out */}
        <button className="win-btn win-close" title="Log Out" onClick={handleClose}>
          <span>✕</span>
        </button>
      </div>
    </div>
  )
}
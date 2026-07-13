import '../styles/Home.css'



export default function Home() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')


  return (
    <div className="home-page">
      <div className="home-bg" />
      <div className="bubbles">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="bubble" key={i} />
        ))}
      </div>

      <nav className="home-navbar">
        <div className="navbar-logo">Aero<span>Social</span></div>
        <div className="navbar-user">
          <img
            src="/assets/default-avatar.png"
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
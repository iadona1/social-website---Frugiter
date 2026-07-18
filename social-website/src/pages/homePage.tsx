import '../styles/Home.css'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '../types/index'
import type { Post } from '../types/index'
import WindowsTitleBar from '../components/WindowsTitleBar'
import PostComposer from '../components/PostComposer'
import PostCard from '../components/PostCard'
import FriendsList from '../components/FriendsList'
import NotificationDropdown from '../components/NotificationDropDown'

export default function Home() {
  const navigate = useNavigate()
  const [user] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/posts', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setPosts(data.posts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleLike = async (postId: string) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      ))
    }
  }

  return (
    <div className="home-page">
      <WindowsTitleBar title="AeroSocial — Home" />
      <div className="home-bg" />

      <nav className="home-navbar">
        <div
          className="navbar-logo"
          onClick={fetchPosts}
          style={{ cursor: 'pointer' }}
          title="Refresh feed"
        >
          Aero<span>Social</span>
        </div>
        
        {/* New navbar-right setup with NotificationDropdown */}
        <div className="navbar-right">
          <NotificationDropdown />
          <div
            className="navbar-user"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
            title="View profile"
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

      <div className="home-layout">
        <main className="feed-column">
          <PostComposer user={user} onPostCreated={handlePostCreated} />

          {loading ? (
            <div className="feed-loading">
              <div className="feed-loading-spinner" />
              <span>Loading your feed...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="feed-empty">
              <div className="feed-empty-icon">🌊</div>
              <div className="feed-empty-title">Nothing here yet!</div>
              <div className="feed-empty-sub">Be the first to post something.</div>
            </div>
          ) : (
            <div className="feed-posts">
              {posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  currentUserId={user.id}
                  onLike={handleLike}
                  onDelete={handlePostDeleted}
                />
              ))}
            </div>
          )}
        </main>

        <FriendsList />
      </div>
    </div>
  )
}
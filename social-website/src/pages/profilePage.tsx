import '../styles/profilePage.css'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { User, Post } from '../types/index'
import WindowsTitleBar from '../components/WindowsTitleBar'
import PostCard from '../components/PostCard'
import NotificationDropdown from '../components/NotificationDropDown'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { username } = useParams()
  const [currentUser] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'))

  const [profileUser, setProfileUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [friendLoading, setFriendLoading] = useState(false)

  const isOwnProfile = !username || username === currentUser.id

  useEffect(() => {
    if (isOwnProfile) {
      fetchOwnProfile()
    } else {
      fetchUserProfile()
    }
  }, [username])

  const fetchOwnProfile = async () => {
    try {
      const token = localStorage.getItem('token')

      // Get own posts
      const res = await fetch('http://localhost:3001/api/posts', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        const myPosts = data.posts.filter((p: Post) => p.userId === currentUser.id)
        setPosts(myPosts)
        setProfileUser({
          ...currentUser,
          postCount: myPosts.length,
          friendCount: 0,
          likesCount: myPosts.reduce((sum: number, p: Post) => sum + p.likesCount, 0),
          friendshipStatus: 'self'
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/users/profile/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setProfileUser(data.user)
        setPosts(data.posts)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendAction = async () => {
    if (!profileUser) return
    setFriendLoading(true)
    const token = localStorage.getItem('token')

    try {
      if (profileUser.friendshipStatus === 'none') {
        const res = await fetch(`http://localhost:3001/api/users/friend-request/${profileUser.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setProfileUser((prev: any) => ({ ...prev, friendshipStatus: 'pending', friendshipDirection: 'sent' }))
      } else if (profileUser.friendshipStatus === 'pending' && profileUser.friendshipDirection === 'received') {
        const res = await fetch(`http://localhost:3001/api/users/friend-request/${profileUser.id}/accept`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setProfileUser((prev: any) => ({ ...prev, friendshipStatus: 'accepted' }))
      } else if (profileUser.friendshipStatus === 'accepted') {
        if (!confirm('Remove this friend?')) return
        const res = await fetch(`http://localhost:3001/api/users/friend/${profileUser.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setProfileUser((prev: any) => ({ ...prev, friendshipStatus: 'none', friendshipDirection: 'none' }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFriendLoading(false)
    }
  }

  const getFriendBtnLabel = () => {
    if (profileUser?.friendshipStatus === 'accepted') return '✓ Friends'
    if (profileUser?.friendshipStatus === 'pending' && profileUser?.friendshipDirection === 'sent') return 'Request Sent'
    if (profileUser?.friendshipStatus === 'pending' && profileUser?.friendshipDirection === 'received') return 'Accept Request'
    return '+ Add Friend'
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

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <div className="profile-page">
      <WindowsTitleBar title="AeroSocial — Profile" />
      <div className="profile-bg" />

      <nav className="home-navbar">
        <div className="navbar-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          Aero<span>Social</span>
        </div>
        <div className="navbar-spacer" />
        <div className="navbar-right">
          <NotificationDropdown />
          <div className="navbar-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <img src={currentUser.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'} alt="avatar" className="nav-avatar" />
            <span className="nav-username">{currentUser.displayName || 'User'}</span>
          </div>
        </div>
      </nav>

      <main className="profile-main">
        <div className="profile-banner">
          <div className="profile-banner-shine" />
        </div>

        <div className="profile-card">
          <div className="profile-card-shine" />

          <div className="profile-avatar-wrapper">
            <img
              src={profileUser?.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
              alt="avatar"
              className="profile-avatar"
            />
          </div>

          <div className="profile-info">
            <div className="profile-display-name">
              {loading ? '...' : profileUser?.displayName}
            </div>
            {profileUser?.username && (
              <div className="profile-username">@{profileUser.username}</div>
            )}
            <div className="profile-email">{isOwnProfile ? currentUser.email : ''}</div>
            <div className="profile-bio-placeholder">
              {profileUser?.bio || 'No bio yet.'}
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-number">{profileUser?.postCount ?? 0}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <div className="profile-stat-number">{profileUser?.friendCount ?? 0}</div>
              <div className="profile-stat-label">Friends</div>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <div className="profile-stat-number">{profileUser?.likesCount ?? 0}</div>
              <div className="profile-stat-label">Likes</div>
            </div>
          </div>

          {!isOwnProfile && profileUser?.friendshipStatus !== 'self' && (
            <button
              className={`profile-friend-btn ${profileUser?.friendshipStatus}`}
              onClick={handleFriendAction}
              disabled={friendLoading || (profileUser?.friendshipStatus === 'pending' && profileUser?.friendshipDirection === 'sent')}
            >
              {friendLoading ? '...' : getFriendBtnLabel()}
            </button>
          )}

          {isOwnProfile && (
            <button
              className="profile-edit-btn"
              onClick={() => navigate('/settings')}
            >
              ⚙️ Edit Profile
            </button>
          )}
        </div>

        {/* Posts */}
        <div className="profile-posts-section">
          <div className="profile-posts-header">
            {loading ? 'Loading posts...' : posts.length === 0 ? 'No posts yet' : `${posts.length} Post${posts.length !== 1 ? 's' : ''}`}
          </div>
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              currentUserId={currentUser.id}
              onLike={handleLike}
              onDelete={handlePostDeleted}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
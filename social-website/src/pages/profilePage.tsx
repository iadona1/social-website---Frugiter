import '../styles/profilePage.css'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { User, Post } from '../types/index'
import WindowsTitleBar from '../components/WindowsTitleBar'
import PostCard from '../components/PostCard'
import NotificationDropdown from '../components/NotificationDropDown'

type EditMode = null | 'choose' | 'displayName' | 'avatar'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { username } = useParams()
  const [currentUser, setCurrentUser] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'))

  const [profileUser, setProfileUser] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [friendLoading, setFriendLoading] = useState(false)

  // Edit profile popup
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [newDisplayName, setNewDisplayName] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editMsg, setEditMsg] = useState('')
  const [editErr, setEditErr] = useState('')

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

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) return
    setEditLoading(true)
    setEditErr('')
    setEditMsg('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: newDisplayName })
      })
      const data = await res.json()
      if (!res.ok) {
        setEditErr(data.error)
        return
      }
      const updatedUser = { ...currentUser, displayName: newDisplayName }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      setProfileUser((prev: any) => ({ ...prev, displayName: newDisplayName }))
      setEditMsg('Display name updated!')
      setTimeout(() => setEditMode(null), 1200)
    } catch {
      setEditErr('Could not connect to server.')
    } finally {
      setEditLoading(false)
    }
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

      {/* Edit Profile Popup */}
      {editMode && (
        <div className="edit-overlay" onClick={() => setEditMode(null)}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="edit-modal-shine" />

            {editMode === 'choose' && (
              <>
                <div className="edit-modal-title">Edit Profile</div>
                <div className="edit-modal-sub">What would you like to change?</div>
                <div className="edit-choices">
                  <button
                    className="edit-choice-btn"
                    onClick={() => {
                      setNewDisplayName(currentUser.displayName || '')
                      setEditMode('displayName')
                    }}
                  >
                    ✏️ Display Name
                  </button>
                  <button
                    className="edit-choice-btn"
                    onClick={() => {
                      setEditMode(null)
                      navigate('/select-avatar')
                    }}
                  >
                    🎨 Profile Picture
                  </button>
                </div>
                <button className="edit-cancel-btn" onClick={() => setEditMode(null)}>Cancel</button>
              </>
            )}

            {editMode === 'displayName' && (
              <>
                <div className="edit-modal-title">Change Display Name</div>
                <div className="edit-modal-sub">Enter your new display name below.</div>
                <input
                  className="edit-input"
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="New display name"
                  onKeyDown={e => e.key === 'Enter' && handleSaveDisplayName()}
                  autoFocus
                />
                {editErr && <div className="edit-error">{editErr}</div>}
                {editMsg && <div className="edit-success">{editMsg}</div>}
                <div className="edit-modal-btns">
                  <button className="edit-cancel-btn" onClick={() => setEditMode('choose')}>← Back</button>
                  <button
                    className="edit-save-btn"
                    onClick={handleSaveDisplayName}
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
              onClick={() => {
                setEditMsg('')
                setEditErr('')
                setEditMode('choose')
              }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

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
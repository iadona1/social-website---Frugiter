import '../styles/postCard.css'
import { useNavigate } from 'react-router-dom'
import type { Post } from '../types/index'

interface PostCardProps {
  post: Post
  currentUserId: string
  onLike: (postId: string) => void
  onDelete: (postId: string) => void
}

export default function PostCard({ post, currentUserId, onLike, onDelete }: PostCardProps) {
  const navigate = useNavigate()

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

  const goToProfile = (e: React.MouseEvent, username?: string) => {
    e.stopPropagation()
    if (username) navigate(`/profile/${username}`)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLike(post.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this post?')) return
    onDelete(post.id)
    fetch(`http://localhost:3001/api/posts/${post.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
  }

  const pulsePercent = Math.min((post.likesCount / 50) * 100, 100)

  return (
    <div
      className="post-card"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      {/* Left pulse + resonate */}
      <div className="post-pulse-bar">
        <div className="post-pulse-fill" style={{ height: `${pulsePercent}%` }} />
        <button
          className={`post-resonate-btn ${post.liked ? 'resonated' : ''}`}
          onClick={handleLike}
          title={post.liked ? 'Un-resonate' : 'Resonate'}
        >
          {post.liked ? '💙' : '🤍'}
          <span className="resonate-count">{post.likesCount}</span>
        </button>
      </div>

      {/* Main content */}
      <div className="post-body">
        <div className="post-card-shine" />

        <div className="post-meta">
          <img
            src={post.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
            alt={post.displayName}
            className="post-avatar clickable"
            onClick={e => goToProfile(e, post.username)}
          />
          <span className="post-author clickable" onClick={e => goToProfile(e, post.username)}>
            {post.displayName}
          </span>
          <span className="post-meta-dot">·</span>
          <span className="post-time">{timeAgo(post.createdAt)}</span>
          {post.userId === currentUserId && (
            <button className="post-delete-btn" onClick={handleDelete}>🗑️</button>
          )}
        </div>

        {post.content && (
          <div className="post-content-preview">{post.content}</div>
        )}

        <div className="post-card-footer">
          {post.imageUrl && (
            <span className="post-has-image">🖼️ Image</span>
          )}
          <span className="post-footer-stat">💬 {post.commentsCount} {post.commentsCount === 1 ? 'reply' : 'replies'}</span>
          <span className="post-footer-stat post-open-hint">Click to open →</span>
        </div>
      </div>
    </div>
  )
}
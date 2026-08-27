import '../styles/postPage.css'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { User, Post, Comment, Reply } from '../types/index'
import WindowsTitleBar from '../components/WindowsTitleBar'
import NotificationDropdown from '../components/NotificationDropDown'
import SearchBar from '../components/SearchBar'

export default function PostPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [user] = useState<User>(() => JSON.parse(localStorage.getItem('user') || '{}'))
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [postingComment, setPostingComment] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [replies, setReplies] = useState<Record<string, Reply[]>>({})
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [postingReply, setPostingReply] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [postId])

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setPost(data.post)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setComments(data.comments)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async () => {
    if (!post) return
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:3001/api/posts/${post.id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      setPost(prev => prev ? {
        ...prev,
        liked: !prev.liked,
        likesCount: prev.liked ? prev.likesCount - 1 : prev.likesCount + 1
      } : prev)
    }
  }

  const handlePostComment = async () => {
    if (!comment.trim() || !post) return
    setPostingComment(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment })
      })
      const data = await res.json()
      if (res.ok) {
        setComments(prev => [...prev, data.comment])
        setComment('')
        setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPostingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!post || !confirm('Delete this comment?')) return
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:3001/api/posts/${post.id}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const handleLikeComment = async (commentId: string) => {
    if (!post) return
    const token = localStorage.getItem('token')
    const res = await fetch(`http://localhost:3001/api/posts/${post.id}/comments/${commentId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, liked: data.liked, likesCount: data.liked ? c.likesCount + 1 : c.likesCount - 1 }
          : c
      ))
    }
  }

  const handleToggleReplies = async (commentId: string) => {
    if (!post) return
    if (!expandedReplies[commentId] && !replies[commentId]) {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `http://localhost:3001/api/posts/${post.id}/comments/${commentId}/replies`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      if (res.ok) setReplies(prev => ({ ...prev, [commentId]: data.replies }))
    }
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }))
  }

  const handleReplyInput = (commentId: string, displayName: string) => {
    setReplyInputs(prev => ({ ...prev, [commentId]: `@${displayName} ` }))
    setExpandedReplies(prev => ({ ...prev, [commentId]: true }))
  }

  const handlePostReply = async (commentId: string) => {
    if (!post) return
    const content = replyInputs[commentId]?.trim()
    if (!content) return
    setPostingReply(prev => ({ ...prev, [commentId]: true }))
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `http://localhost:3001/api/posts/${post.id}/comments/${commentId}/replies`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        }
      )
      const data = await res.json()
      if (res.ok) {
        setReplies(prev => ({ ...prev, [commentId]: [...(prev[commentId] || []), data.reply] }))
        setReplyInputs(prev => ({ ...prev, [commentId]: '' }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPostingReply(prev => ({ ...prev, [commentId]: false }))
    }
  }

  const handleLikeReply = async (commentId: string, replyId: string) => {
    if (!post) return
    const token = localStorage.getItem('token')
    const res = await fetch(
      `http://localhost:3001/api/posts/${post.id}/comments/${commentId}/replies/${replyId}/like`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    if (res.ok) {
      setReplies(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || []).map(r =>
          r.id === replyId
            ? { ...r, liked: data.liked, likesCount: data.liked ? r.likesCount + 1 : r.likesCount - 1 }
            : r
        )
      }))
    }
  }

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!post || !confirm('Delete this reply?')) return
    const token = localStorage.getItem('token')
    const res = await fetch(
      `http://localhost:3001/api/posts/${post.id}/comments/${commentId}/replies/${replyId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.ok) {
      setReplies(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || []).filter(r => r.id !== replyId)
      }))
    }
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
    <div className="post-page">
      <WindowsTitleBar title="AeroSocial — Post" />
      <div className="post-page-bg" />

      <nav className="home-navbar">
        <div className="navbar-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          Aero<span>Social</span>
        </div>
        <SearchBar />
        <div className="navbar-spacer" />
        <div className="navbar-right">
          <NotificationDropdown />
          <div className="navbar-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <img src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'} alt="avatar" className="nav-avatar" />
            <span className="nav-username">{user.displayName || 'User'}</span>
          </div>
        </div>
      </nav>

      <main className="post-page-main">
        <button className="post-back-btn" onClick={() => navigate('/home')}>
          ← Back to feed
        </button>

        {loading ? (
          <div className="feed-loading">
            <div className="feed-loading-spinner" />
            <span>Loading post...</span>
          </div>
        ) : !post ? (
          <div className="feed-empty">
            <div className="feed-empty-icon">🌊</div>
            <div className="feed-empty-title">Post not found</div>
          </div>
        ) : (
          <>
            {/* Full post */}
            <div className="full-post-card">
              <div className="full-post-shine" />

              <div className="full-post-left">
                <button
                  className={`full-resonate-btn ${post.liked ? 'resonated' : ''}`}
                  onClick={handleLike}
                >
                  {post.liked ? '💙' : '🤍'}
                  <span>{post.likesCount}</span>
                </button>
              </div>

              <div className="full-post-body">
                <div className="post-meta">
                  <img
                    src={post.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
                    alt={post.displayName}
                    className="post-avatar clickable"
                    onClick={() => navigate(`/profile/${post.username}`)}
                  />
                  <span
                    className="post-author clickable"
                    onClick={() => navigate(`/profile/${post.username}`)}
                  >
                    {post.displayName}
                  </span>
                  <span className="post-meta-dot">·</span>
                  <span className="post-time">{timeAgo(post.createdAt)}</span>
                </div>

                {post.content && (
                  <div className="full-post-content">{post.content}</div>
                )}

                {post.imageUrl && (
                  <div className="full-post-image-wrapper">
                    <img
                      src={post.imageUrl.startsWith('http') ? post.imageUrl : `http://localhost:3001${post.imageUrl}`}
                      alt="post"
                      className="full-post-image"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Comment input */}
            <div className="full-comment-box">
              <div className="full-comment-box-shine" />
              <div className="full-comment-input-row">
                <img
                  src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
                  alt="you"
                  className="thread-avatar"
                />
                <input
                  className="thread-input"
                  placeholder="Write a reply..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                />
                <button
                  className="thread-submit-btn"
                  onClick={handlePostComment}
                  disabled={postingComment}
                >
                  {postingComment ? '...' : 'Reply'}
                </button>
              </div>
            </div>

            {/* Comments */}
            <div className="full-comments-section">
              <div className="full-comments-header">
                💬 {post.commentsCount} {post.commentsCount === 1 ? 'Reply' : 'Replies'}
              </div>

              {loadingComments ? (
                <div className="thread-loading">Loading replies...</div>
              ) : comments.length === 0 ? (
                <div className="thread-empty">No replies yet. Be the first!</div>
              ) : (
                <div className="thread-comments">
                  {comments.map(c => (
                    <div key={c.id} className="thread-comment">
                      <div className="thread-comment-line" />
                      <div className="thread-comment-body">
                        <div className="thread-comment-meta">
                          <img
                            src={c.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
                            alt={c.displayName}
                            className="thread-avatar clickable"
                            onClick={() => navigate(`/profile/${c.username}`)}
                          />
                          <span
                            className="thread-author clickable"
                            onClick={() => navigate(`/profile/${c.username}`)}
                          >
                            {c.displayName}
                          </span>
                          <span className="post-meta-dot">·</span>
                          <span className="post-time">{timeAgo(c.createdAt)}</span>
                        </div>

                        <div className="thread-comment-text">{c.content}</div>

                        <div className="thread-comment-actions">
                          <button
                            className={`thread-action-btn ${c.liked ? 'liked' : ''}`}
                            onClick={() => handleLikeComment(c.id)}
                          >
                            {c.liked ? '💙' : '🤍'} {c.likesCount > 0 ? c.likesCount : ''}
                          </button>
                          <button
                            className="thread-action-btn"
                            onClick={() => handleReplyInput(c.id, c.displayName)}
                          >
                            ↩️ Reply
                          </button>
                          {c.userId === user.id && (
                            <button
                              className="thread-action-btn danger"
                              onClick={() => handleDeleteComment(c.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>

                        {expandedReplies[c.id] && (
                          <div className="thread-replies">
                            {(replies[c.id] || []).map(r => (
                              <div key={r.id} className="thread-reply">
                                <div className="thread-reply-line" />
                                <div className="thread-reply-body">
                                  <div className="thread-comment-meta">
                                    <img
                                      src={r.avatarUrl}
                                      alt={r.displayName}
                                      className="thread-avatar small clickable"
                                      onClick={() => navigate(`/profile/${r.username}`)}
                                    />
                                    <span
                                      className="thread-author clickable"
                                      onClick={() => navigate(`/profile/${r.username}`)}
                                    >
                                      {r.displayName}
                                    </span>
                                    <span className="post-meta-dot">·</span>
                                    <span className="post-time">{timeAgo(r.createdAt)}</span>
                                  </div>
                                  <div className="thread-comment-text reply-text">{r.content}</div>
                                  <div className="thread-comment-actions">
                                    <button
                                      className={`thread-action-btn ${r.liked ? 'liked' : ''}`}
                                      onClick={() => handleLikeReply(c.id, r.id)}
                                    >
                                      {r.liked ? '💙' : '🤍'} {r.likesCount > 0 ? r.likesCount : ''}
                                    </button>
                                    <button
                                      className="thread-action-btn"
                                      onClick={() => handleReplyInput(c.id, r.displayName)}
                                    >
                                      ↩️ Reply
                                    </button>
                                    {r.userId === user.id && (
                                      <button
                                        className="thread-action-btn danger"
                                        onClick={() => handleDeleteReply(c.id, r.id)}
                                      >
                                        🗑️
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div className="thread-input-row reply-input">
                              <input
                                className="thread-input"
                                placeholder="Reply..."
                                value={replyInputs[c.id] || ''}
                                onChange={e => setReplyInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handlePostReply(c.id)}
                              />
                              <button
                                className="thread-submit-btn"
                                onClick={() => handlePostReply(c.id)}
                                disabled={postingReply[c.id]}
                              >
                                {postingReply[c.id] ? '...' : 'Reply'}
                              </button>
                            </div>
                          </div>
                        )}

                        <button
                          className="replies-toggle-btn"
                          onClick={() => handleToggleReplies(c.id)}
                        >
                          {expandedReplies[c.id]
                            ? '▲ Hide replies'
                            : `▼ ${replies[c.id]?.length ? `${replies[c.id].length} replies` : 'Show replies'}`
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
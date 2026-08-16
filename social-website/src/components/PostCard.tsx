import '../styles/PostCard.css'
import { useState } from 'react'
import type { Post } from '../types/index'
import type { Comment, Reply } from '../types/index'

interface PostCardProps {
  post: Post
  index: number
  currentUserId: string
  onLike: (postId: string) => void
  onDelete: (postId: string) => void
}

export default function PostCard({ post, index, currentUserId, onLike, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [postingComment, setPostingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({})
  const [replies, setReplies] = useState<Record<string, Reply[]>>({})
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [postingReply, setPostingReply] = useState<Record<string, boolean>>({})

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

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`, {
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
    setShowComments(prev => !prev)
  }

  const handlePostComment = async () => {
    if (!comment.trim()) return
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
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPostingComment(false)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('Delete this post?')) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (res.ok) onDelete(post.id)
      else setDeleting(false)
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    try {
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
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleReplies = async (commentId: string) => {
    if (!expandedReplies[commentId] && !replies[commentId]) {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(
          `http://localhost:3001/api/posts/${post.id}/comments/${commentId}/replies`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const data = await res.json()
        if (res.ok) setReplies(prev => ({ ...prev, [commentId]: data.replies }))
      } catch (err) {
        console.error(err)
      }
    }
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }))
  }

  const handleReplyInput = (commentId: string, displayName: string) => {
    setReplyInputs(prev => ({ ...prev, [commentId]: `@${displayName} ` }))
    setExpandedReplies(prev => ({ ...prev, [commentId]: true }))
  }

  const handlePostReply = async (commentId: string) => {
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
    try {
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
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!confirm('Delete this reply?')) return
    try {
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
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className={`post-card ${index % 2 === 1 ? 'post-card-offset' : ''} ${deleting ? 'post-card-deleting' : ''}`}>
      <div className="post-card-shine" />

      <div className="post-header">
        <img src={post.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'} alt={post.displayName} className="post-avatar" />
        <div className="post-header-info">
          <div className="post-display-name">{post.displayName}</div>
          <div className="post-time">{timeAgo(post.createdAt)}</div>
        </div>
        {post.userId === currentUserId && (
          <button className="post-delete-btn" onClick={handleDeletePost} title="Delete post">🗑️</button>
        )}
      </div>

      {post.content && <div className="post-content">{post.content}</div>}

      {post.imageUrl && (
        <div className="post-image-wrapper">
          <img
            src={post.imageUrl.startsWith('http') ? post.imageUrl : `http://localhost:3001${post.imageUrl}`}
            alt="post"
            className="post-image"
          />
        </div>
      )}

      <div className="post-actions">
        <button className={`post-action-btn ${post.liked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>
          <span className="post-action-icon">💙</span>
          <span>{post.likesCount}</span>
        </button>
        <button className="post-action-btn" onClick={handleToggleComments}>
          <span className="post-action-icon">💬</span>
          <span>{post.commentsCount}</span>
        </button>
        <button className="post-action-btn">
          <span className="post-action-icon">🔗</span>
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          <div className="post-comment-input-row">
            <input
              className="post-comment-input"
              placeholder="Write a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePostComment()}
            />
            <button className="post-comment-btn" onClick={handlePostComment} disabled={postingComment}>
              {postingComment ? '...' : '→'}
            </button>
          </div>

          {loadingComments ? (
            <div className="comments-loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">No comments yet!</div>
          ) : (
            <div className="comments-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <img src={c.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'} alt={c.displayName} className="comment-avatar" />
                  <div className="comment-bubble-wrapper">
                    <div className="comment-bubble">
                      <div className="comment-name">{c.displayName}</div>
                      <div className="comment-text">{c.content}</div>
                    </div>
                    <div className="comment-actions">
                      <button
                        className={`comment-action-btn ${c.liked ? 'liked' : ''}`}
                        onClick={() => handleLikeComment(c.id)}
                      >
                        💙 {c.likesCount > 0 ? c.likesCount : ''}
                      </button>
                      <button
                        className="comment-action-btn"
                        onClick={() => handleReplyInput(c.id, c.displayName)}
                      >
                        ↩️ Reply
                      </button>
                      {c.userId === currentUserId && (
                        <button className="comment-action-btn comment-delete-btn" onClick={() => handleDeleteComment(c.id)}>
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* Replies */}
                    {expandedReplies[c.id] && (
                      <div className="replies-section">
                        {(replies[c.id] || []).map(r => (
                          <div key={r.id} className="reply-item">
                            <img src={r.avatarUrl} alt={r.displayName} className="reply-avatar" />
                            <div className="reply-bubble-wrapper">
                              <div className="reply-bubble">
                                <div className="reply-name">{r.displayName}</div>
                                <div className="reply-text">{r.content}</div>
                              </div>
                              <div className="comment-actions">
                                <button
                                  className={`comment-action-btn ${r.liked ? 'liked' : ''}`}
                                  onClick={() => handleLikeReply(c.id, r.id)}
                                >
                                  💙 {r.likesCount > 0 ? r.likesCount : ''}
                                </button>
                                <button
                                  className="comment-action-btn"
                                  onClick={() => handleReplyInput(c.id, r.displayName)}
                                >
                                  ↩️ Reply
                                </button>
                                {r.userId === currentUserId && (
                                  <button
                                    className="comment-action-btn comment-delete-btn"
                                    onClick={() => handleDeleteReply(c.id, r.id)}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="reply-input-row">
                          <input
                            className="post-comment-input"
                            placeholder={`Reply...`}
                            value={replyInputs[c.id] || ''}
                            onChange={e => setReplyInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handlePostReply(c.id)}
                          />
                          <button
                            className="post-comment-btn"
                            onClick={() => handlePostReply(c.id)}
                            disabled={postingReply[c.id]}
                          >
                            {postingReply[c.id] ? '...' : '→'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show/hide replies toggle */}
                    <button
                      className="replies-toggle-btn"
                      onClick={() => handleToggleReplies(c.id)}
                    >
                      {expandedReplies[c.id] ? '▲ Hide replies' : `▼ ${replies[c.id]?.length ? `${replies[c.id].length} replies` : 'Reply'}`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
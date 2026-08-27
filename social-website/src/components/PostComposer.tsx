import '../styles/postComposer.css'
import { useState, useRef } from 'react'
import type { User } from '../types/index'
import type { Post } from '../types/index'

interface PostComposerProps {
  user: User
  onPostCreated: (post: Post) => void
  onClose: () => void
}

export default function PostComposer({ user, onPostCreated, onClose }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!content.trim() && !image) {
      setError('Write something or add an image!')
      return
    }
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('content', content)
      if (image) formData.append('image', image)

      const res = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        setLoading(false)
        return
      }

      onPostCreated(data.post)
      onClose()

    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="composer-overlay" onClick={onClose}>
      <div className="composer-modal" onClick={e => e.stopPropagation()}>
        <div className="composer-modal-shine" />

        <div className="composer-header">
          <img
            src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
            alt="avatar"
            className="composer-avatar"
          />
          <div className="composer-header-info">
            <div className="composer-name">{user.displayName}</div>
            <div className="composer-label">New Post</div>
          </div>
          <button className="composer-close-btn" onClick={onClose}>✕</button>
        </div>

        <textarea
          className="composer-textarea"
          placeholder={`What's on your mind, ${user.displayName?.split(' ')[0]}?`}
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={5}
          autoFocus
        />

        {imagePreview && (
          <div className="composer-preview">
            <img src={imagePreview} alt="preview" />
            <button className="composer-remove-img" onClick={handleRemoveImage}>✕</button>
          </div>
        )}

        {error && <div className="composer-error">{error}</div>}

        <div className="composer-footer">
          <button
            className="composer-img-btn"
            onClick={() => fileRef.current?.click()}
          >
            🖼️ Add Photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <div className="composer-footer-right">
            <button className="composer-cancel-btn" onClick={onClose}>Cancel</button>
            <button
              className="composer-post-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
import '../styles/postComposer.css'
import { useState, useRef } from 'react'
import type { User } from '../types/index'
import type { Post } from '../types/index'

interface PostComposerProps {
  user: User
  onPostCreated: (post: Post) => void
}

export default function PostComposer({ user, onPostCreated }: PostComposerProps) {
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
      setContent('')
      setImage(null)
      setImagePreview(null)
      if (fileRef.current) fileRef.current.value = ''

    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="composer-card">
      <div className="composer-top">
        <img
          src={user.avatarUrl || '/assets/Frugiter-Icon-blue.jpg'}
          alt="avatar"
          className="composer-avatar"
        />
        <textarea
          className="composer-input"
          placeholder={`What's on your mind, ${user.displayName?.split(' ')[0] || 'friend'}?`}
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
        />
      </div>

      {imagePreview && (
        <div className="composer-preview">
          <img src={imagePreview} alt="preview" />
          <button className="composer-remove-img" onClick={handleRemoveImage}>✕</button>
        </div>
      )}

      {error && (
        <div className="composer-error">{error}</div>
      )}

      <div className="composer-bottom">
        <button
          className="composer-img-btn"
          onClick={() => fileRef.current?.click()}
          title="Add image"
        >
          🖼️ Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
        <button
          className="composer-post-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  )
}
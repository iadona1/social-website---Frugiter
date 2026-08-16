import '../styles/searchBar.css'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SearchUser } from '../types'

export default function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (value.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`http://localhost:3001/api/users/search?q=${encodeURIComponent(value)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) {
          setResults(data.users)
          setOpen(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleFriendAction = async (e: React.MouseEvent, user: SearchUser) => {
    e.stopPropagation()
    const token = localStorage.getItem('token')

    if (user.friendshipStatus === 'none') {
      const res = await fetch(`http://localhost:3001/api/users/friend-request/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setResults(prev => prev.map(u =>
          u.id === user.id
            ? { ...u, friendshipStatus: 'pending', friendshipDirection: 'sent' }
            : u
        ))
      }
    } else if (user.friendshipStatus === 'pending' && user.friendshipDirection === 'received') {
      const res = await fetch(`http://localhost:3001/api/users/friend-request/${user.id}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setResults(prev => prev.map(u =>
          u.id === user.id ? { ...u, friendshipStatus: 'accepted' } : u
        ))
      }
    } else if (user.friendshipStatus === 'accepted') {
      const res = await fetch(`http://localhost:3001/api/users/friend/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setResults(prev => prev.map(u =>
          u.id === user.id ? { ...u, friendshipStatus: 'none', friendshipDirection: 'none' } : u
        ))
      }
    }
  }

  const getFriendBtnLabel = (user: SearchUser) => {
    if (user.friendshipStatus === 'accepted') return '✓ Friends'
    if (user.friendshipStatus === 'pending' && user.friendshipDirection === 'sent') return 'Pending'
    if (user.friendshipStatus === 'pending' && user.friendshipDirection === 'received') return 'Accept'
    return '+ Add'
  }

  const getFriendBtnClass = (user: SearchUser) => {
    if (user.friendshipStatus === 'accepted') return 'search-friend-btn friends'
    if (user.friendshipStatus === 'pending' && user.friendshipDirection === 'sent') return 'search-friend-btn pending'
    if (user.friendshipStatus === 'pending' && user.friendshipDirection === 'received') return 'search-friend-btn accept'
    return 'search-friend-btn add'
  }

  return (
    <div className="search-wrapper" ref={ref}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search people..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <span className="search-spinner" />}
      </div>

      {open && (
        <div className="search-dropdown">
          <div className="search-dropdown-shine" />
          {results.length === 0 ? (
            <div className="search-empty">No users found</div>
          ) : (
            results.map(user => (
              <div
                key={user.id}
                className="search-result-item"
                style={{ cursor: 'pointer' }}
                onClick={() => { navigate(`/profile/${user.username}`); setOpen(false) }}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="search-result-avatar"
                />
                <div className="search-result-info">
                  <div className="search-result-name">{user.displayName}</div>
                  <div className="search-result-username">@{user.username}</div>
                </div>
                <button
                  className={getFriendBtnClass(user)}
                  onClick={e => handleFriendAction(e, user)}
                  disabled={user.friendshipStatus === 'pending' && user.friendshipDirection === 'sent'}
                >
                  {getFriendBtnLabel(user)}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
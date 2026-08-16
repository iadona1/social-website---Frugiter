import { Router, Request, Response } from 'express'
import pool from '../db.js'
import jwt from 'jsonwebtoken'

const router = Router()

const auth = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authorized' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Search users
router.get('/search', auth, async (req: any, res: Response) => {
  const { q } = req.query
  if (!q || String(q).length < 2) return res.json({ users: [] })

  try {
    const result = await pool.query(`
      SELECT
        u.id, u.display_name, u.username,
        pp.url as avatar_url,
        CASE
          WHEN f.id IS NOT NULL THEN f.status
          ELSE 'none'
        END as friendship_status,
        CASE
          WHEN f.requester_id = $2 THEN 'sent'
          WHEN f.receiver_id = $2 THEN 'received'
          ELSE 'none'
        END as friendship_direction
      FROM users u
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      LEFT JOIN friendships f ON (
        (f.requester_id = $2 AND f.receiver_id = u.id) OR
        (f.receiver_id = $2 AND f.requester_id = u.id)
      )
      WHERE u.id != $2
        AND (
          u.username ILIKE $1 OR
          u.display_name ILIKE $1
        )
      LIMIT 8
    `, [`%${q}%`, req.user.userId])

    const users = result.rows.map(row => ({
      id: row.id,
      displayName: row.display_name,
      username: row.username,
      avatarUrl: row.avatar_url || '/assets/Frugiter-Icon-blue.jpg',
      friendshipStatus: row.friendship_status,
      friendshipDirection: row.friendship_direction
    }))

    res.json({ users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Send friend request
router.post('/friend-request/:userId', auth, async (req: any, res: Response) => {
  const { userId } = req.params
  try { 
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot add yourself' })
    }

    const existing = await pool.query(
      `SELECT id FROM friendships
       WHERE (requester_id = $1 AND receiver_id = $2)
          OR (requester_id = $2 AND receiver_id = $1)`,
      [req.user.userId, userId]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Friend request already exists' })
    }

    await pool.query(
      `INSERT INTO friendships (requester_id, receiver_id, status)
       VALUES ($1, $2, 'pending')`,
      [req.user.userId, userId]
    )

    res.json({ message: 'Friend request sent' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }

  // Send notification to receiver
await pool.query(
  `INSERT INTO notifications (user_id, from_user_id, type)
   VALUES ($1, $2, 'friend_request')`,
  [userId, req.user.userId]
)

})


// Accept friend request
router.put('/friend-request/:userId/accept', auth, async (req: any, res: Response) => {
  const { userId } = req.params
  try {
    await pool.query(
      `UPDATE friendships SET status = 'accepted'
       WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [userId, req.user.userId]
    )
    res.json({ message: 'Friend request accepted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Decline friend request
router.put('/friend-request/:userId/decline', auth, async (req: any, res: Response) => {
  const { userId } = req.params
  try {
    await pool.query(
      `UPDATE friendships SET status = 'declined'
       WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [userId, req.user.userId]
    )
    res.json({ message: 'Friend request declined' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Remove friend
router.delete('/friend/:userId', auth, async (req: any, res: Response) => {
  const { userId } = req.params
  try {
    await pool.query(
      `DELETE FROM friendships
       WHERE (requester_id = $1 AND receiver_id = $2)
          OR (requester_id = $2 AND receiver_id = $1)`,
      [req.user.userId, userId]
    )
    res.json({ message: 'Friend removed' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Get user profile by username
router.get('/profile/:username', auth, async (req: any, res: Response) => {
  const { username } = req.params
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.display_name, u.username, u.bio, u.created_at,
        pp.url as avatar_url,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
        (SELECT COUNT(*) FROM friendships
         WHERE (requester_id = u.id OR receiver_id = u.id)
           AND status = 'accepted') as friend_count,
        (SELECT COUNT(*) FROM likes l
         JOIN posts p ON l.post_id = p.id
         WHERE p.user_id = u.id) as likes_count,
        CASE
          WHEN f.id IS NOT NULL THEN f.status
          ELSE 'none'
        END as friendship_status,
        CASE
          WHEN f.requester_id = $2 THEN 'sent'
          WHEN f.receiver_id = $2 THEN 'received'
          ELSE 'none'
        END as friendship_direction
      FROM users u
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      LEFT JOIN friendships f ON (
        (f.requester_id = $2 AND f.receiver_id = u.id) OR
        (f.receiver_id = $2 AND f.requester_id = u.id)
      )
      WHERE u.username = $1
    `, [username, req.user.userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const row = result.rows[0]

    // Get their posts
    const postsResult = await pool.query(`
      SELECT
        p.id, p.content, p.image_url, p.likes_count, p.comments_count, p.created_at,
        EXISTS(
          SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $2
        ) as liked
      FROM posts p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [row.id, req.user.userId])

    res.json({
      user: {
        id: row.id,
        displayName: row.display_name,
        username: row.username,
        bio: row.bio,
        avatarUrl: row.avatar_url || '/assets/Frugiter-Icon-blue.jpg',
        postCount: parseInt(row.post_count),
        friendCount: parseInt(row.friend_count),
        likesCount: parseInt(row.likes_count),
        friendshipStatus: row.friendship_status,
        friendshipDirection: row.friendship_direction,
        createdAt: row.created_at
      },
      posts: postsResult.rows.map(p => ({
        id: p.id,
        userId: row.id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url || '/assets/Frugiter-Icon-blue.jpg',
        content: p.content,
        imageUrl: p.image_url,
        likesCount: p.likes_count,
        commentsCount: p.comments_count,
        createdAt: p.created_at,
        liked: p.liked
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router
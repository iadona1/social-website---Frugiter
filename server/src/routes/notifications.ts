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

// Get notifications
router.get('/', auth, async (req: any, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        n.id, n.type, n.is_read, n.created_at, n.post_id,
        u.display_name as from_name,
        pp.url as from_avatar
      FROM notifications n
      JOIN users u ON n.from_user_id = u.id
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 20
    `, [req.user.userId])

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      isRead: row.is_read,
      createdAt: row.created_at,
      postId: row.post_id,
      fromName: row.from_name,
      fromAvatar: row.from_avatar || '/assets/Frugiter-Icon-blue.jpg',
      message: row.type === 'like'
        ? `${row.from_name} liked your post`
        : row.type === 'comment'
        ? `${row.from_name} commented on your post`
        : row.type === 'friend_request'
        ? `${row.from_name} sent you a friend request`
        : row.type === 'reply'
        ? `${row.from_name} replied to your comment`
        : `${row.from_name} did something`
    }))

    res.json({ notifications })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Mark all as read
router.put('/read-all', auth, async (req: any, res: Response) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.userId]
    )
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Mark one as read
router.put('/:id/read', auth, async (req: any, res: Response) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    )
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router
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

router.get('/', auth, async (req: any, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.display_name, u.username,
        pp.url as avatar_url
      FROM friendships f
      JOIN users u ON (
        CASE WHEN f.requester_id = $1 THEN f.receiver_id ELSE f.requester_id END = u.id
      )
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      WHERE (f.requester_id = $1 OR f.receiver_id = $1)
        AND f.status = 'accepted'
    `, [req.user.userId])

    const friends = result.rows.map(row => ({
      id: row.id,
      displayName: row.display_name,
      username: row.username,
      avatarUrl: row.avatar_url || '/assets/Frugiter-Icon-blue.jpg'
    }))

    res.json({ friends })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router
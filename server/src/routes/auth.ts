import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, confirmEmail } = req.body

  try {
    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (email !== confirmEmail) {
      return res.status(400).json({ error: 'Emails do not match' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' })
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create display name from first + last
    const displayName = `${firstName} ${lastName}`

    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, created_at`,
      [displayName.toLowerCase().replace(' ', '_') + '_' + Date.now(), email, passwordHash, displayName]
    )

    const user = result.rows[0]

    // Insert default profile picture
    await pool.query(
      `INSERT INTO profile_pictures (user_id, url, storage_key, file_size, mime_type, is_current)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, 'social-website/src/assets/Frugiter-Icon-blue.jpg', 'defaults/default-avatar.png', 0, 'image/jpeg', true]
    )

    // Insert default banner
    await pool.query(
      `INSERT INTO banner_images (user_id, url, storage_key, file_size, mime_type, is_current)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, '/assets/default-banner.png', 'defaults/default-banner.png', 0, 'image/png', true]
    )

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
      }
    })

  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No account found with this email' })
    }

    const user = result.rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
      }
    })

  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

export default router
import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  const { firstName, lastName, username, email, password, confirmEmail, dateOfBirth } = req.body

  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' })
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' })
    }

    if (email !== confirmEmail) {
      return res.status(400).json({ error: 'Emails do not match' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    if (!dateOfBirth) {
      return res.status(400).json({ error: 'Date of birth is required' })
    }

    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }

    if (dob > today) {
      return res.status(400).json({ error: 'Invalid date of birth' })
    }

    if (age < 15) {
      return res.status(400).json({ error: 'You must be at least 15 years old to register' })
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' })
    }

    const existingUsername = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )

    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: 'That username is already taken' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const displayName = `${firstName} ${lastName}`

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, date_of_birth)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, display_name, created_at`,
      [username, email, passwordHash, displayName, dob]
    )

    const user = result.rows[0]

    await pool.query(
      `INSERT INTO profile_pictures (user_id, url, storage_key, file_size, mime_type, is_current)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, '/assets/Frugiter-Icon-blue.jpg', 'defaults/Frugiter-Icon-blue.jpg', 0, 'image/jpeg', true]
    )

    await pool.query(
      `INSERT INTO banner_images (user_id, url, storage_key, file_size, mime_type, is_current)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, '/assets/default-banner.png', 'defaults/default-banner.png', 0, 'image/png', true]
    )

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
        avatarUrl: '/assets/Frugiter-Icon-blue.jpg'
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

    const avatarResult = await pool.query(
      'SELECT url FROM profile_pictures WHERE user_id = $1 AND is_current = true',
      [user.id]
    )

    const avatarUrl = avatarResult.rows[0]?.url || '/assets/Frugiter-Icon-blue.jpg'

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
        avatarUrl
      }
    })

  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

router.post('/select-avatar', async (req: Request, res: Response) => {
  const { avatarUrl } = req.body
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Not authorized' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    await pool.query(
      `UPDATE profile_pictures SET is_current = false WHERE user_id = $1`,
      [decoded.userId]
    )

    await pool.query(
      `INSERT INTO profile_pictures (user_id, url, storage_key, file_size, mime_type, is_current)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [decoded.userId, avatarUrl, 'defaults/selected-avatar.jpg', 0, 'image/jpeg', true]
    )

    res.json({ message: 'Avatar updated', avatarUrl })

  } catch (err) {
    console.error('Select avatar error:', err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router
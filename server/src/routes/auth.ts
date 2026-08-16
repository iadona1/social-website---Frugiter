import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  const { firstName, lastName, username, email, password, confirmPassword, dateOfBirth } = req.body

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

if (password !== confirmPassword) {
  return res.status(400).json({ error: 'Passwords do not match' })
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

    return res.status(201).json({
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
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
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

    return res.json({
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
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
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

    return res.json({ message: 'Avatar updated', avatarUrl })

  } catch (err) {
    console.error('Select avatar error:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.get('/verify', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const result = await pool.query(
      'SELECT id, display_name, email FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }

    const avatarResult = await pool.query(
      'SELECT url FROM profile_pictures WHERE user_id = $1 AND is_current = true',
      [decoded.userId]
    )

    const avatarUrl = avatarResult.rows[0]?.url || '/assets/Frugiter-Icon-blue.jpg'
    const user = result.rows[0]

    return res.json({
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        avatarUrl
      }
    })

  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
})

// Forgot password - sends reset email
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body

  try {
    const result = await pool.query(
      'SELECT id, display_name FROM users WHERE email = $1',
      [email]
    )

    // Always return success even if email not found (security)
    if (result.rows.length === 0) {
      return res.json({ message: 'If an account exists, a reset link has been sent.' })
    }

    const user = result.rows[0]
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    )

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`

    await transporter.sendMail({
      from: `"AeroSocial" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your AeroSocial password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1a4a8a;">Password Reset</h2>
          <p>Hi ${user.display_name},</p>
          <p>We received a request to reset your AeroSocial password. Click the button below to reset it.</p>
          <a href="${resetLink}" style="
            display: inline-block;
            padding: 12px 28px;
            background: linear-gradient(180deg, #48b848, #3aaa3a);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 16px 0;
          ">Reset Password</a>
          <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        </div>
      `
    })

    return res.json({ message: 'If an account exists, a reset link has been sent.' })

  } catch (err) {
    console.error('Forgot password error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// Reset password - uses token from email
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body

  try {
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' })
    }

    const resetRecord = result.rows[0]

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, resetRecord.user_id]
    )

    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetRecord.id]
    )

    return res.json({ message: 'Password updated successfully.' })

  } catch (err) {
    console.error('Reset password error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})

// Update account settings
router.put('/settings', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authorized' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { displayName, username, bio } = req.body

    if (username) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, decoded.userId]
      )
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'That username is already taken' })
      }
    }

    const result = await pool.query(
      `UPDATE users SET
        display_name = COALESCE($1, display_name),
        username = COALESCE($2, username),
        bio = COALESCE($3, bio),
        updated_at = NOW()
       WHERE id = $4
       RETURNING id, display_name, email, username, bio`,
      [displayName || null, username || null, bio || null, decoded.userId]
    )

    const user = result.rows[0]
    const avatarResult = await pool.query(
      'SELECT url FROM profile_pictures WHERE user_id = $1 AND is_current = true',
      [decoded.userId]
    )
    const avatarUrl = avatarResult.rows[0]?.url || '/assets/Frugiter-Icon-blue.jpg'

    return res.json({
      message: 'Settings updated successfully',
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        avatarUrl
      }
    })
  } catch (err) {
    console.error('Settings update error:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

// Update password
router.put('/password', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authorized' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' })
    }

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [decoded.userId]
    )

    const passwordMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash)
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, decoded.userId]
    )

    return res.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Password update error:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

// Delete account
router.delete('/account', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authorized' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' })
    }

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const passwordMatch = await bcrypt.compare(password, result.rows[0].password_hash)
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password' })
    }

    await pool.query('DELETE FROM users WHERE id = $1', [decoded.userId])
    return res.json({ message: 'Account deleted successfully' })

  } catch (err) {
    console.error('Delete account error:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router
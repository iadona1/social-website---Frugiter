import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import postRoutes from './routes/posts.js'
import friendRoutes from './routes/friends.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/friends', friendRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'AeroSocial server is running!' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
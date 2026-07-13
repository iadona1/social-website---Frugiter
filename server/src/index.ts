import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'AeroSocial server is running!' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
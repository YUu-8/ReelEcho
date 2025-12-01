/**
 * Users API Routes
 * Handles user registration, authentication, profile management
 */
import express from 'express'

const router = express.Router()
router.use(express.json())

// In-memory user storage (replace with database in production)
const users = [
  {
    id: 1,
    username: 'johndoe',
    email: 'john@reelecho.com',
    password: 'hashed_password_123', // In production, use bcrypt
    fullName: 'John Doe',
    bio: 'Movie enthusiast and content creator',
    profilePicture: 'https://example.com/avatar1.jpg',
    preferences: {
      favoriteGenres: ['Action', 'Sci-Fi'],
      notifications: true,
      privacy: 'public'
    },
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-11-20T14:20:00Z'
  },
  {
    id: 2,
    username: 'maryjane',
    email: 'mary@reelecho.com',
    password: 'hashed_password_456',
    fullName: 'Mary Jane',
    bio: 'Film critic and reviewer',
    profilePicture: 'https://example.com/avatar2.jpg',
    preferences: {
      favoriteGenres: ['Drama', 'Romance'],
      notifications: true,
      privacy: 'friends'
    },
    createdAt: '2025-02-20T09:15:00Z',
    updatedAt: '2025-11-18T16:45:00Z'
  }
]

let nextUserId = 3

/**
 * GET /api/users
 * Get all users (public profiles only)
 */
router.get('/api/users', (req, res) => {
  // Return users without passwords
  const publicUsers = users.map(({ password, ...user }) => user)
  res.status(200).json(publicUsers)
})

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
router.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' })
  }

  const user = users.find(u => u.id === userId)

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Return user without password
  const { password, ...publicUser } = user
  res.status(200).json(publicUser)
})

/**
 * POST /api/users
 * Create a new user (registration)
 */
router.post('/api/users', (req, res) => {
  const { username, email, password, fullName, bio } = req.body

  // Validate required fields
  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required' })
  }
  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required' })
  }

  // Check if username or email already exists
  const existingUser = users.find(u => u.username === username || u.email === email)
  if (existingUser) {
    return res.status(409).json({ error: 'Username or email already exists' })
  }

  // Create new user
  const newUser = {
    id: nextUserId++,
    username,
    email,
    password: `hashed_${password}`, // In production, use bcrypt.hash()
    fullName,
    bio: bio || '',
    profilePicture: null,
    preferences: {
      favoriteGenres: [],
      notifications: true,
      privacy: 'public'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  users.push(newUser)

  // Return user without password
  const { password: _, ...publicUser } = newUser
  res.status(201).json({
    message: 'User created successfully',
    user: publicUser
  })
})

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' })
  }

  const userIndex = users.findIndex(u => u.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  const { fullName, bio, profilePicture, preferences } = req.body

  // Update only provided fields
  if (fullName !== undefined) users[userIndex].fullName = fullName
  if (bio !== undefined) users[userIndex].bio = bio
  if (profilePicture !== undefined) users[userIndex].profilePicture = profilePicture
  if (preferences !== undefined) {
    users[userIndex].preferences = {
      ...users[userIndex].preferences,
      ...preferences
    }
  }

  users[userIndex].updatedAt = new Date().toISOString()

  // Return updated user without password
  const { password, ...publicUser } = users[userIndex]
  res.status(200).json({
    message: 'User updated successfully',
    user: publicUser
  })
})

/**
 * DELETE /api/users/:id
 * Delete a user account
 */
router.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' })
  }

  const userIndex = users.findIndex(u => u.id === userId)

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  const deletedUser = users.splice(userIndex, 1)[0]

  // Return deleted user without password
  const { password, ...publicUser } = deletedUser
  res.status(200).json({
    message: 'User deleted successfully',
    user: publicUser
  })
})

export default router

/**
 * Users API Routes
 * Handles user registration, authentication, profile management
 */
import express from 'express'
import * as userRepository from '../../repositories/user.repository.js'

const router = express.Router()
router.use(express.json())

/**
 * GET /api/users
 * Get all users (public profiles only)
 */
router.get('/', async (req, res) => {
  try {
    const users = await userRepository.getAllUsers()
    // Return users without passwords
    const publicUsers = users.map(({ password, ...user }) => user)
    res.status(200).json(publicUsers)
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' })
  }
})

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id

    const user = await userRepository.getUserById(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Return user without password
    const { password, ...publicUser } = user
    res.status(200).json(publicUser)
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user' })
  }
})

/**
 * POST /api/users
 * Create a new user (registration)
 */
router.post('/', async (req, res) => {
  try {
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
    const existingUser = await userRepository.findUserByUsernameOrEmail(username, email)
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' })
    }

    // Create new user
    const newUser = {
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

    const createdUser = await userRepository.createUser(newUser)

    // Return user without password
    const { password: _, ...publicUser } = createdUser
    res.status(201).json({
      message: 'User created successfully',
      user: publicUser
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' })
  }
})

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id

    const { fullName, bio, profilePicture, preferences } = req.body

    // Build update object with only provided fields
    const updateData = {}
    if (fullName !== undefined) updateData.fullName = fullName
    if (bio !== undefined) updateData.bio = bio
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture
    if (preferences !== undefined) updateData.preferences = preferences

    const updatedUser = await userRepository.updateUser(userId, updateData)

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Return updated user without password
    const { password, ...publicUser } = updatedUser
    res.status(200).json({
      message: 'User updated successfully',
      user: publicUser
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' })
  }
})

/**
 * DELETE /api/users/:id
 * Delete a user account
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id

    const deletedUser = await userRepository.deleteUser(userId)

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Return 204 No Content (Lab 6 pattern)
    res.status(204).end()
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router

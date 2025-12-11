/**
 * Users API Routes
 * Handles user registration, authentication, profile management
 */
import express from 'express'
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../../controllers/user.controller.js'

const router = express.Router()
router.use(express.json())

/**
 * GET /api/users
 * Get all users (public profiles only)
 */
router.get('/', listUsers)

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
router.get('/:id', getUserById)

/**
 * POST /api/users
 * Create a new user (registration)
 */
router.post('/', createUser)

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id', updateUser)

/**
 * DELETE /api/users/:id
 * Delete a user account
 */
router.delete('/:id', deleteUser)

export default router

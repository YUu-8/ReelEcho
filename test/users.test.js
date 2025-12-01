/**
 * Users API Tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { getDb, closeDb } from '../src/db/mongo.js'

let testUserId

beforeAll(async () => {
  // Wait for DB connection (app.js already connects)
  await new Promise(resolve => setTimeout(resolve, 1000))
})

afterAll(async () => {
  // Clean up test data
  try {
    await getDb().collection('users').deleteMany({ email: /test|newuser/ })
  } catch (error) {
    // Ignore cleanup errors
  }
  await closeDb()
})

beforeEach(async () => {
  // Insert test users before each test suite
  const existingUsers = await getDb().collection('users').find().toArray()
  if (existingUsers.length === 0) {
    const result = await getDb().collection('users').insertMany([
      {
        username: 'johndoe',
        email: 'john@reelecho.com',
        password: 'hashed_password_123',
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
    ])
    testUserId = result.insertedIds[0].toString()
  } else {
    testUserId = existingUsers[0]._id.toString()
  }
})

describe('Users API', () => {
  describe('GET /api/users', () => {
    it('should return an array of users', async () => {
      const res = await request(app).get('/api/users')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })

    it('should return users with required fields', async () => {
      const res = await request(app).get('/api/users')
      expect(res.status).toBe(200)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('_id')
      expect(res.body[0]).toHaveProperty('username')
      expect(res.body[0]).toHaveProperty('email')
      expect(res.body[0]).toHaveProperty('fullName')
    })

    it('should not return passwords', async () => {
      const res = await request(app).get('/api/users')
      expect(res.status).toBe(200)
      expect(res.body[0]).not.toHaveProperty('password')
    })
  })

  describe('GET /api/users/:id', () => {
    it('should return a user by ID', async () => {
      const res = await request(app).get(`/api/users/${testUserId}`)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('_id')
      expect(res.body).toHaveProperty('username')
      expect(res.body).not.toHaveProperty('password')
    })

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/users/507f1f77bcf86cd799439011')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const uniqueEmail = `newuser${Date.now()}@reelecho.com`
      const uniqueUsername = `newuser${Date.now()}`

      const res = await request(app)
        .post('/api/users')
        .send({
          username: uniqueUsername,
          email: uniqueEmail,
          password: 'password123',
          fullName: 'New User',
          bio: 'Test user bio'
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('message')
      expect(res.body).toHaveProperty('user')
      expect(res.body.user).toHaveProperty('_id')
      expect(res.body.user.username).toBe(uniqueUsername)
      expect(res.body.user).not.toHaveProperty('password')
    })

    it('should return 400 when username is missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          password: 'pass123',
          fullName: 'Test User'
        })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          password: 'pass123',
          fullName: 'Test User'
        })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User'
        })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 400 when fullName is missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'pass123'
        })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error')
    })

    it('should return 409 for duplicate username', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'johndoe',
          email: 'another@example.com',
          password: 'pass123',
          fullName: 'Another User'
        })

      expect(res.status).toBe(409)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('PUT /api/users/:id', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .send({
          fullName: 'John Updated Doe',
          bio: 'Updated bio'
        })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('message')
      expect(res.body.user.fullName).toBe('John Updated Doe')
      expect(res.body.user.bio).toBe('Updated bio')
    })

    it('should update user preferences', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .send({
          preferences: {
            notifications: false,
            privacy: 'private'
          }
        })

      expect(res.status).toBe(200)
      expect(res.body.user.preferences.notifications).toBe(false)
      expect(res.body.user.preferences.privacy).toBe('private')
    })

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .put('/api/users/507f1f77bcf86cd799439011')
        .send({ fullName: 'Test' })

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
    })
  })

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      // Create a user to delete
      const createRes = await request(app)
        .post('/api/users')
        .send({
          username: `deletetest${Date.now()}`,
          email: `deletetest${Date.now()}@example.com`,
          password: 'pass123',
          fullName: 'Delete Test'
        })

      const userIdToDelete = createRes.body.user._id

      const res = await request(app).delete(`/api/users/${userIdToDelete}`)

      expect(res.status).toBe(204)
    })

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).delete('/api/users/507f1f77bcf86cd799439011')

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
    })
  })
})

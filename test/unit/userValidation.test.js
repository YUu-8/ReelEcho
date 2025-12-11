import { describe, it, expect } from 'vitest'
import { isValidUser } from '../../src/utils/userValidation.js'

describe('isValidUser', () => {
  it('returns true for a fully valid user object', () => {
    const user = {
      username: 'alice',
      email: 'alice@example.com',
      password: 'secret123',
      fullName: 'Alice Example'
    }
    expect(isValidUser(user)).toBe(true)
  })

  it('returns false when username is missing or not a string', () => {
    expect(isValidUser({ email: 'a@b.com', password: 'x', fullName: 'Test' })).toBe(false)
    expect(isValidUser({ username: 42, email: 'a@b.com', password: 'x', fullName: 'Test' })).toBe(false)
  })

  it('returns false when email is missing or not a string', () => {
    expect(isValidUser({ username: 'bob', password: 'x', fullName: 'Test' })).toBe(false)
    expect(isValidUser({ username: 'bob', email: 123, password: 'x', fullName: 'Test' })).toBe(false)
  })

  it('returns false when password is missing or not a string', () => {
    expect(isValidUser({ username: 'bob', email: 'a@b.com', fullName: 'Test' })).toBe(false)
    expect(isValidUser({ username: 'bob', email: 'a@b.com', password: true, fullName: 'Test' })).toBe(false)
  })

  it('returns false when fullName is missing or not a string', () => {
    expect(isValidUser({ username: 'bob', email: 'a@b.com', password: 'x' })).toBe(false)
    expect(isValidUser({ username: 'bob', email: 'a@b.com', password: 'x', fullName: 10 })).toBe(false)
  })
})

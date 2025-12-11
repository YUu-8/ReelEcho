import User from '../models/user.model.js'

export async function listUsers (req, res, next) {
  try {
    const users = await User.find().lean()
    const publicUsers = users.map(({ password, ...rest }) => rest)
    res.status(200).json(publicUsers)
  } catch (err) {
    next(err)
  }
}

export async function getUserById (req, res, next) {
  try {
    const user = await User.findById(req.params.id).lean()
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { password, ...publicUser } = user
    res.status(200).json(publicUser)
  } catch (err) {
    next(err)
  }
}

export async function createUser (req, res, next) {
  try {
    const { username, email, password, fullName, bio } = req.body
    if (!username) return res.status(400).json({ error: 'Username is required' })
    if (!email) return res.status(400).json({ error: 'Email is required' })
    if (!password) return res.status(400).json({ error: 'Password is required' })
    if (!fullName) return res.status(400).json({ error: 'Full name is required' })

    const existing = await User.findOne({ $or: [{ username }, { email }] }).lean()
    if (existing) return res.status(409).json({ error: 'Username or email already exists' })

    const created = await User.create({
      username,
      email,
      password: `hashed_${password}`,
      fullName,
      bio: bio || '',
      profilePicture: null,
      preferences: {
        favoriteGenres: [],
        notifications: true,
        privacy: 'public'
      }
    })

    const { password: _, ...publicUser } = created.toPublicJSON()
    res.status(201).json({ message: 'User created successfully', user: publicUser })
  } catch (err) {
    next(err)
  }
}

export async function updateUser (req, res, next) {
  try {
    const updateData = {}
    const { fullName, bio, profilePicture, preferences } = req.body
    if (fullName !== undefined) updateData.fullName = fullName
    if (bio !== undefined) updateData.bio = bio
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture
    if (preferences !== undefined) updateData.preferences = preferences

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { ...updateData, updatedAt: new Date().toISOString() } },
      { new: true, lean: true }
    )

    if (!updated) return res.status(404).json({ error: 'User not found' })

    const { password, ...publicUser } = updated
    res.status(200).json({ message: 'User updated successfully', user: publicUser })
  } catch (err) {
    next(err)
  }
}

export async function deleteUser (req, res, next) {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'User not found' })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

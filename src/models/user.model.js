import mongoose from 'mongoose'

const preferencesSchema = new mongoose.Schema({
  favoriteGenres: { type: [String], default: [] },
  notifications: { type: Boolean, default: true },
  privacy: { type: String, enum: ['public', 'private', 'friends'], default: 'public' }
}, { _id: false })

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: null },
  preferences: { type: preferencesSchema, default: () => ({}) }
}, {
  timestamps: true
})

userSchema.index({ username: 1 }, { unique: true })
userSchema.index({ email: 1 }, { unique: true })

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject({ versionKey: false })
  delete obj.password
  return obj
}

export default mongoose.model('User', userSchema)

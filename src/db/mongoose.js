import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export async function connectToMongoose () {
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables')
  }
  await mongoose.connect(process.env.MONGO_URI)
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`)
  return mongoose.connection
}

export async function closeMongoose () {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }
}

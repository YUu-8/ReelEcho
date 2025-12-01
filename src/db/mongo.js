import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const client = new MongoClient(process.env.MONGO_URI)
let db

export async function connectToDb () {
  await client.connect()
  db = client.db()
  console.log('Connected to MongoDB Atlas')
}

export function getDb () {
  return db
}

export async function closeDb () {
  await client.close()
}

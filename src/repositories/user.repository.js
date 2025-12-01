import { getDb } from '../db/mongo.js'
import { ObjectId } from 'mongodb'

const COLLECTION = 'users'

export async function getAllUsers () {
  return await getDb().collection(COLLECTION).find().toArray()
}

export async function getUserById (id) {
  try {
    return await getDb()
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(id) })
  } catch (error) {
    // Invalid ObjectId format
    return null
  }
}

export async function createUser (data) {
  const result = await getDb().collection(COLLECTION).insertOne(data)
  return { _id: result.insertedId, ...data }
}

export async function updateUser (id, data) {
  try {
    const result = await getDb()
      .collection(COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date().toISOString() } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    return null
  }
}

export async function deleteUser (id) {
  try {
    const result = await getDb()
      .collection(COLLECTION)
      .findOneAndDelete({ _id: new ObjectId(id) })
    return result
  } catch (error) {
    return null
  }
}

export async function findUserByUsernameOrEmail (username, email) {
  return await getDb()
    .collection(COLLECTION)
    .findOne({
      $or: [
        { username },
        { email }
      ]
    })
}

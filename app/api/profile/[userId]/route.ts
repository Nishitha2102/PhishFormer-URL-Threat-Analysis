// app/api/profile/[userId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const DB_NAME = process.env.DB_NAME || 'your-database-name'

let client: MongoClient | null = null

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI)
    await client.connect()
  }
  return client.db(DB_NAME)
}

// GET - Fetch user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const db = await connectToDatabase()
    const usersCollection = db.collection('users')
    
    const user = await usersCollection.findOne(
      { _id: new ObjectId(params.userId) },
      {
        projection: {
          name: 1,
          email: 1,
          notifications: 1,
          privacy: 1
        }
      }
    )

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Ensure default values exist
    const profile = {
      _id: user._id,
      name: user.name || '',
      email: user.email || '',
      notifications: {
        emailAlerts: user.notifications?.emailAlerts ?? true,
        weeklyReports: user.notifications?.weeklyReports ?? true,
        securityUpdates: user.notifications?.securityUpdates ?? true,
      },
      privacy: {
        shareAnalytics: user.privacy?.shareAnalytics ?? false,
        publicProfile: user.privacy?.publicProfile ?? false,
      }
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const updates = await request.json()
    const db = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Validate the updates
    const allowedFields = ['name', 'email', 'notifications', 'privacy']
    const updateData: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    // Add updated timestamp
    updateData.updatedAt = new Date()

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(params.userId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const db = await connectToDatabase()
    const usersCollection = db.collection('users')

    // You might want to also delete related data in other collections
    // For example: user sessions, user data, etc.
    
    const result = await usersCollection.deleteOne({
      _id: new ObjectId(params.userId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Optional: Delete related data from other collections
    // await db.collection('user_sessions').deleteMany({ userId: params.userId })
    // await db.collection('user_data').deleteMany({ userId: params.userId })

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
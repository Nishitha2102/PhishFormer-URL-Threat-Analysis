import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const cookie = cookies().get("session")?.value
    if (!cookie) return NextResponse.json({ authenticated: false }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")
    const { payload } = await jwtVerify(cookie, secret)
    try {
      const db = await getDb()
      const doc = await db
        .collection("users")
        .findOne({ _id: new ObjectId(payload.sub as string) }, { projection: { passwordHash: 0 } })
      if (doc) {
        return NextResponse.json({
          authenticated: true,
          user: { id: doc._id.toString(), name: doc.name, email: doc.email, picture: (payload as any).picture },
        })
      }
    } catch {
      // ignore and fall back to JWT
    }
    return NextResponse.json({
      authenticated: true,
      user: { name: payload.name, email: payload.email, id: payload.sub, picture: (payload as any).picture },
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

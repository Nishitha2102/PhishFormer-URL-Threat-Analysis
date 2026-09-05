import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const token = cookies().get("session")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.sub as string
    const db = await getDb()
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) }, { projection: { passwordHash: 0 } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email } })
  } catch (e) {
    console.error("[v0] GET /api/profile error:", (e as any)?.message || e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const token = cookies().get("session")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.sub as string

    const { name } = await req.json()
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 })
    }

    const db = await getDb()
    await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { name } })
    // Return latest user (email unchanged here)
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) }, { projection: { passwordHash: 0 } })
    return NextResponse.json({ ok: true, user: { id: user!._id.toString(), name: user!.name, email: user!.email } })
  } catch (e) {
    console.error("[v0] PUT /api/profile error:", (e as any)?.message || e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

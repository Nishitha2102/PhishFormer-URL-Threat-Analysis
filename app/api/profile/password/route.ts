import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const token = cookies().get("session")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.sub as string

    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const db = await getDb()
    const users = db.collection("users")
    const user = await users.findOne({ _id: new ObjectId(userId) })
    if (!user?.passwordHash) return NextResponse.json({ error: "Password login not enabled" }, { status: 400 })

    const ok = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 })

    const nextHash = await bcrypt.hash(newPassword, 10)
    await users.updateOne({ _id: new ObjectId(userId) }, { $set: { passwordHash: nextHash } })

    const res = NextResponse.json({ ok: true, message: "Password updated. Please sign in again." })
    // clear session cookie
    res.cookies.set("session", "", { httpOnly: true, path: "/", maxAge: 0 })
    return res
  } catch (e) {
    console.error("[v0] POST /api/profile/password error:", (e as any)?.message || e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

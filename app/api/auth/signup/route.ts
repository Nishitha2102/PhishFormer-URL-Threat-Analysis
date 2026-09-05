import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const db = await getDb()
    const users = db.collection("users")

    const existing = await users.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const { insertedId } = await users.insertOne({
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ ok: true, userId: insertedId.toString() }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Signup error:", err?.message || err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

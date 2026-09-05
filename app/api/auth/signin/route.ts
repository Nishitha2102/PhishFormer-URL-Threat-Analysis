import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")

export async function POST(req: Request) {
  try {
    const isHttps = new URL(req.url).protocol === "https:"

    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const db = await getDb()
    const users = db.collection("users")
    const user = await users.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "JWT_SECRET not set" }, { status: 500 })
    }

    const token = await new SignJWT({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret)

    const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } })
    res.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (err: any) {
    console.error("[v0] Signin error:", err?.message || err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("session", "", { httpOnly: true, path: "/", maxAge: 0 })
  return res
}

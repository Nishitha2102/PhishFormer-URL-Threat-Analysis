import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE() {
  try {
    const token = cookies().get("session")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.sub as string

    const db = await getDb()
    await db.collection("scans").deleteMany({ userId }) // clean scans
    await db.collection("users").deleteOne({ _id: new ObjectId(userId) })

    const res = NextResponse.json({ ok: true })
    res.cookies.set("session", "", { httpOnly: true, path: "/", maxAge: 0 })
    return res
  } catch (e) {
    console.error("[v0] DELETE /api/profile/delete error:", (e as any)?.message || e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

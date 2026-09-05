import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getDb } from "@/lib/mongodb"

async function requireUser() {
  const token = cookies().get("session")?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")
    const { payload } = await jwtVerify(token, secret)
    return { id: payload.sub as string, email: payload.email as string }
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") // safe | phishing | suspicious | null
  const q = searchParams.get("q") // search term

  const db = await getDb()
  const scans = db.collection("scans")

  const query: any = { userId: user.id }
  if (status && status !== "all") query.status = status
  if (q) query.url = { $regex: q, $options: "i" }

  const results = await scans.find(query).sort({ timestamp: -1 }).limit(200).toArray()

  return NextResponse.json({ scans: results })
}

export async function POST(req: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { url, status, confidence, analysisTime, threats } = body || {}
    if (!url || !status || typeof confidence !== "number" || typeof analysisTime !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const db = await getDb()
    const scans = db.collection("scans")

    const doc = {
      userId: user.id,
      url,
      status, // "safe" | "phishing" | "suspicious"
      confidence,
      analysisTime,
      threats: Array.isArray(threats) ? threats : [],
      timestamp: new Date(),
    }

    const { insertedId } = await scans.insertOne(doc)
    return NextResponse.json({ ok: true, id: insertedId.toString() }, { status: 201 })
  } catch (err: any) {
    console.error("[v0] Save scan error:", err?.message || err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

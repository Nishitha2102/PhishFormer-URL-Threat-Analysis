import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"
import { getDb } from "@/lib/mongodb"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  // On error from Google, send back to signin
  if (error) {
    return NextResponse.redirect(`${url.origin}/signin?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    console.error("[v0] Missing OAuth code or state from Google", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
    })
    return NextResponse.redirect(`${url.origin}/signin?error=missing_code_or_state`)
  }

  // Validate state against cookie
  const stateCookie = cookies().get("oauth_state")?.value
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(`${url.origin}/signin?error=invalid_state`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const jwtSecret = process.env.JWT_SECRET
  if (!clientId || !clientSecret || !jwtSecret || !redirectUri) {
    console.error("[v0] Server not configured for Google OAuth", {
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
      hasJwtSecret: Boolean(jwtSecret),
      hasRedirectUri: Boolean(redirectUri),
    })
    return NextResponse.redirect(`${url.origin}/signin?error=server_not_configured`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    const tokenJson = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error("[v0] Google token exchange failed", {
        status: tokenRes.status,
        error: tokenJson?.error,
        error_description: tokenJson?.error_description,
      })
      const reason = tokenJson?.error ? String(tokenJson.error) : "token_exchange_failed"
      return NextResponse.redirect(`${url.origin}/signin?error=${encodeURIComponent(reason)}`)
    }

    const accessToken: string | undefined = tokenJson.access_token
    if (!accessToken) {
      return NextResponse.redirect(`${url.origin}/signin?error=missing_access_token`)
    }

    // Get user info
    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    const userInfo = await userInfoRes.json()
    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${url.origin}/signin?error=userinfo_failed`)
    }

    const googleId = String(userInfo.sub || "")
    const email = String(userInfo.email || "").toLowerCase()
    const name = String(userInfo.name || "Google User")
    const picture = String(userInfo.picture || "")

    if (!googleId || !email) {
      return NextResponse.redirect(`${url.origin}/signin?error=missing_profile`)
    }

    // Upsert user
    const db = await getDb()
    const users = db.collection("users")
    const now = new Date()
    const existing = await users.findOne({ email })

    let userId: string
    if (existing) {
      await users.updateOne({ _id: existing._id }, { $set: { name, email, googleId, picture, updatedAt: now } })
      userId = existing._id.toString()
    } else {
      const insert = await users.insertOne({
        name,
        email,
        googleId,
        picture,
        // No passwordHash for Google accounts
        createdAt: now,
        updatedAt: now,
      })
      userId = insert.insertedId.toString()
    }

    // Issue session cookie using same mechanism as email/password
    const secret = new TextEncoder().encode(jwtSecret)
    const token = await new SignJWT({ sub: userId, email, name, picture })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret)

    const res = NextResponse.redirect(`${url.origin}/dashboard`)
    const isHttps = url.protocol === "https:"
    res.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
    // Clear one-time state cookie
    res.cookies.set("oauth_state", "", { httpOnly: true, path: "/", maxAge: 0 })
    return res
  } catch (e) {
    console.error("[v0] Google OAuth callback error:", (e as any)?.message || e)
    return NextResponse.redirect(`${url.origin}/signin?error=unexpected`)
  }
}

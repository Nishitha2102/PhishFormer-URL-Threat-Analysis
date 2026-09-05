import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 })
  }

  const url = new URL(req.url)
  const origin = url.origin

  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!redirectUri) {
    console.error(
      "[v0] Missing GOOGLE_REDIRECT_URI. It must exactly match the Authorized redirect URI in Google Cloud Console.",
    )
    return NextResponse.json(
      {
        error:
          "GOOGLE_REDIRECT_URI not set. Set it to your exact callback URL, e.g., https://your-domain/api/auth/google/callback",
      },
      { status: 500 },
    )
  }
  try {
    // Validate redirectUri format
    const redirectOrigin = new URL(redirectUri).origin
    console.log("[v0] Starting Google OAuth", {
      origin,
      redirectOrigin,
      clientIdPreview: clientId.slice(0, 8) + "...",
    })
  } catch {
    return NextResponse.json({ error: "Invalid GOOGLE_REDIRECT_URI format" }, { status: 500 })
  }

  // CSRF protection with state cookie
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri, // must exactly match Google Console
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    access_type: "offline",
    include_granted_scopes: "true",
    state,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  const res = NextResponse.redirect(authUrl)
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  })

  return res
}

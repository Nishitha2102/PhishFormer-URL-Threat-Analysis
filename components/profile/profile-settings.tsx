"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Save, Trash2, Key, Shield, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ProfileSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changing, setChanging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    ;(async () => {
      try {
        setError(null)
        const res = await fetch("/api/profile", { credentials: "include", cache: "no-store" })
        if (res.status === 401) {
          window.location.href = "/signin"
          return
        }
        if (!res.ok) throw new Error("Failed to load profile")
        const data = await res.json()
        setFullName(data.user.name || "")
        setEmail(data.user.email || "")
      } catch (e: any) {
        setError(e.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const passwordIssue = useMemo(() => {
    if (!currentPassword && (newPassword || confirmPassword)) return "Enter your current password."
    if (newPassword && newPassword.length < 8) return "New password must be at least 8 characters."
    if (newPassword && !/[A-Za-z]/.test(newPassword)) return "New password must contain letters."
    if (newPassword && !/[0-9]/.test(newPassword)) return "New password must include a number."
    if (confirmPassword && confirmPassword !== newPassword) return "Passwords do not match."
    return null
  }, [currentPassword, newPassword, confirmPassword])

  const saveProfile = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      if (!fullName.trim() || fullName.trim().length < 2) {
        throw new Error("Please enter your full name.")
      }
      const res = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to save")
      window.dispatchEvent(new CustomEvent("profile:updated"))
      setSuccess("Profile updated successfully.")
      toast({ title: "Saved", description: "Your profile was updated." })
    } catch (e: any) {
      setError(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    try {
      setChanging(true)
      setError(null)
      setSuccess(null)
      if (passwordIssue) throw new Error(passwordIssue)
      const res = await fetch("/api/profile/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to change password")
      toast({ title: "Password updated", description: "Please sign in with your new password." })
      window.location.href = "/signin"
    } catch (e: any) {
      setError(e.message || "Failed to change password")
    } finally {
      setChanging(false)
    }
  }

  const deleteAccount = async () => {
    if (!confirm("This will permanently delete your account and history. Continue?")) return
    try {
      setDeleting(true)
      setError(null)
      setSuccess(null)
      const res = await fetch("/api/profile/delete", { method: "DELETE", credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to delete account")
      toast({ title: "Account deleted", description: "Your account was removed." })
      window.location.href = "/"
    } catch (e: any) {
      setError(e.message || "Failed to delete account")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-64 animate-pulse" />
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-64 animate-pulse" />
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-40 md:col-span-2 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action required</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-500/30">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Update your name. Email is shown for reference.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={email} disabled className="opacity-80" />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>Updating password will sign you out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 chars, include a number"
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordIssue && (
              <p className="text-xs text-red-400" role="status" aria-live="polite">
                {passwordIssue}
              </p>
            )}

            <Button
              variant="outline"
              onClick={changePassword}
              disabled={changing || Boolean(passwordIssue)}
              className="w-full bg-transparent"
            >
              {changing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
              {changing ? "Updating..." : "Save New Password"}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription>Delete account and all history</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={deleteAccount} disabled={deleting} className="w-full">
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { EnhancedHistory } from "@/components/dashboard/enhanced-history"
import { URLScanner } from "@/components/detection/url-scanner"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus, Shield, PanelLeft } from "lucide-react"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("scan")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true) // sidebar visibility

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setUser({ ...data.user, isAuthenticated: true })
          }
        } else {
          if (isMounted) setUser({ name: "Guest", email: "guest@example.com", isAuthenticated: false })
        }
      } catch {
        if (isMounted) setUser({ name: "Guest", email: "guest@example.com", isAuthenticated: false })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const onProfileUpdated = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setUser({ ...data.user, isAuthenticated: true })
        }
      } catch {}
    }
    window.addEventListener("profile:updated", onProfileUpdated)
    return () => window.removeEventListener("profile:updated", onProfileUpdated)
  }, [])

  console.log("[v0] Dashboard render - isLoading:", isLoading, "user:", user, "activeTab:", activeTab)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    console.log("[v0] Rendering content for tab:", activeTab)
    switch (activeTab) {
      case "scan":
        return <URLScanner />
      case "history":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Scan History</h2>
              <p className="text-muted-foreground">
                View all your previous URL scans and results with advanced filtering
              </p>
            </div>
            <EnhancedHistory />
          </div>
        )
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Profile Settings</h2>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>
            <ProfileSettings />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 bg-card/50 backdrop-blur-sm border-r border-border/50">
          <DashboardNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <button
              aria-label="Toggle sidebar"
              onClick={() => setShowSidebar((s) => !s)}
              className="p-2 rounded hover:bg-accent/40"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">PhishFormer Dashboard</h1>
          </div>

          {!user?.isAuthenticated && (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/signin")}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button size="sm" onClick={() => (window.location.href = "/signup")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </div>
          )}

          {user?.isAuthenticated && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch("/api/auth/signin", { method: "DELETE", credentials: "include" })
                  } finally {
                    localStorage.removeItem("user")
                    window.location.href = "/"
                  }
                }}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-8">{renderContent()}</div>
      </div>
    </div>
  )
}

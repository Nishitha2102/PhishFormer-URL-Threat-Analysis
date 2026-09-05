"use client"

import { Button } from "@/components/ui/button"
import { Shield, Search, History, User, LogOut } from "lucide-react"

interface DashboardNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  // remove user card state and fetch
  // const [user, setUser] = useState<any>(null)

  // useEffect(() => {
  //   fetchUserData()
  // }, [])

  // const fetchUserData = async () => {
  //   try {
  //     const userData = JSON.parse(localStorage.getItem("user") || "null")
  //     if (userData) {
  //       setUser(userData)
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch user data:", error)
  //   }
  // }

  const handleSignOut = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("scanHistory")
    window.location.href = "/"
  }

  const navItems = [
    { id: "scan", label: "Quick Scan", icon: Search },
    { id: "history", label: "History", icon: History },
    { id: "profile", label: "Profile", icon: User },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold">PhishFormer</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className={`w-full justify-start ${
              activeTab === item.id
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="w-4 h-4 mr-3" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

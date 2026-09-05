"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Chrome } from "lucide-react"

interface GoogleAuthProps {
  mode: "signin" | "signup"
}

export function GoogleAuth({ mode }: GoogleAuthProps) {
  const handleGoogleAuth = () => {
    // TODO: Implement Google OAuth
    console.log(`Google ${mode} clicked`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center pulse-glow">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-balance">
              {mode === "signin" ? "Welcome Back" : "Join PhishFormer"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === "signin"
                ? "Sign in to access advanced phishing detection"
                : "Create your account to start protecting against phishing attacks"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleAuth}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            size="lg"
          >
            <Chrome className="w-5 h-5 mr-2" />
            {mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                className="text-primary hover:text-primary/80 font-medium"
                onClick={() => (window.location.href = mode === "signin" ? "/signup" : "/signin")}
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>By continuing, you agree to our Terms of Service</p>
            <p>and Privacy Policy</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single()

      if (error || !data) {
        setError("Invalid username or password")
        return
      }

      localStorage.setItem("currentUser", JSON.stringify(data))

      if (data.user_type === "admin") {
        router.push("/admin")
      } else {
        router.push("/participant")
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoUsername: string) => {
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.from("users").select("*").eq("username", demoUsername).single()

      if (error || !data) {
        setError("Demo user not found")
        return
      }

      localStorage.setItem("currentUser", JSON.stringify(data))

      if (data.user_type === "admin") {
        router.push("/admin")
      } else {
        router.push("/participant")
      }
    } catch (err) {
      setError("Demo login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { username: "admin", name: "Admin User", type: "admin" },
    { username: "participant1", name: "John Doe", type: "participant" },
    { username: "participant2", name: "Jane Smith", type: "participant" },
    { username: "participant3", name: "Bob Johnson", type: "participant" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access the system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-3">Demo Accounts:</p>
          <div className="space-y-2">
            {demoUsers.map((user) => (
              <Button
                key={user.username}
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin(user.username)}
                className="w-full justify-start"
                disabled={loading}
              >
                <span className="font-medium">{user.name}</span>
                <span className="ml-2 text-xs text-gray-500">({user.type})</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

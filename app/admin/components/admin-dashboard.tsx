"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Users, Trophy, LogOut } from "lucide-react"
import { supabase, type User, type Lottery } from "@/lib/supabase"

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newLottery, setNewLottery] = useState({
    name: "",
    maxParticipants: 10,
    numberOfWinners: 1,
  })
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      if (userData.user_type !== "admin") {
        router.push("/")
        return
      }
      setUser(userData)
      loadLotteries()
    } else {
      router.push("/")
    }
  }, [router])

  const loadLotteries = async () => {
    try {
      const { data, error } = await supabase
        .from("lotteries")
        .select(`
          *,
          participants:lottery_participants(
            id,
            user_id,
            is_winner,
            joined_at,
            users(id, name, username)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading lotteries:", error)
        setError("Failed to load lotteries")
        return
      }

      setLotteries(data || [])
    } catch (error) {
      console.error("Error loading lotteries:", error)
      setError("Failed to load lotteries")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLottery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)

    try {
      const { data, error } = await supabase
        .from("lotteries")
        .insert({
          name: newLottery.name,
          max_participants: newLottery.maxParticipants,
          number_of_winners: newLottery.numberOfWinners,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating lottery:", error)
        setError(`Failed to create lottery: ${error.message}`)
        return
      }

      setNewLottery({ name: "", maxParticipants: 10, numberOfWinners: 1 })
      setShowCreateForm(false)
      loadLotteries() // Reload lotteries
    } catch (error) {
      console.error("Error creating lottery:", error)
      setError("Failed to create lottery. Please try again.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  if (!user || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const activeLotteries = lotteries.filter((l) => l.status === "active")
  const completedLotteries = lotteries.filter((l) => l.status === "completed")

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lotteries</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lotteries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Lotteries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLotteries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Lotteries</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedLotteries.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Manage Lotteries</h2>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Lottery
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Lottery</CardTitle>
              <CardDescription>Set up a new lottery for participants</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLottery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Lottery Name</Label>
                  <Input
                    id="name"
                    value={newLottery.name}
                    onChange={(e) => setNewLottery({ ...newLottery, name: e.target.value })}
                    placeholder="Enter lottery name"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="2"
                      max="100"
                      value={newLottery.maxParticipants}
                      onChange={(e) =>
                        setNewLottery({ ...newLottery, maxParticipants: Number.parseInt(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfWinners">Number of Winners</Label>
                    <Input
                      id="numberOfWinners"
                      type="number"
                      min="1"
                      max={newLottery.maxParticipants - 1}
                      value={newLottery.numberOfWinners}
                      onChange={(e) =>
                        setNewLottery({ ...newLottery, numberOfWinners: Number.parseInt(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">Create Lottery</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lotteries.map((lottery) => {
            const participantCount = lottery.participants?.length || 0
            const winners = lottery.participants?.filter((p) => p.is_winner) || []

            return (
              <Card key={lottery.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{lottery.name}</CardTitle>
                    <Badge variant={lottery.status === "active" ? "default" : "secondary"}>{lottery.status}</Badge>
                  </div>
                  <CardDescription>Created: {new Date(lottery.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Participants:</span>
                      <span>
                        {participantCount} / {lottery.max_participants}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Winners:</span>
                      <span>{lottery.number_of_winners}</span>
                    </div>
                    {winners.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Winners:</p>
                        <div className="space-y-1">
                          {winners.map((winner) => (
                            <Badge key={winner.id} variant="outline" className="text-xs">
                              {winner.users.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

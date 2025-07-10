"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Trophy, LogOut, CheckCircle, XCircle } from "lucide-react"
import { supabase, type User, type Lottery, type LotteryParticipant } from "@/lib/supabase"

export default function ParticipantDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [lotteries, setLotteries] = useState<Lottery[]>([])
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      if (userData.user_type !== "participant") {
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
      const response = await fetch('/api/lotteries', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Failed to load lotteries: ${errorData}`)
      }

      const lotteries = await response.json();

      setLotteries(lotteries ?? [])
    } catch (error) {
      console.error("Error loading lotteries:", error)
      setError("Failed to load lotteries")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinLottery = async (lottery: Lottery) => {
    try{
      if (!user) return

      const response = await fetch('/api/lottery/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotteryId: lottery.id,
          userId: user.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(`Failed to join lottery: ${errorData}`)
      }
      // Reload lotteries to show updated data
      loadLotteries()
    } catch (error) {
      console.error("Error joining lottery:", error)
      setError("Failed to join lottery. Please try again.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const getParticipationStatus = (lottery: Lottery) => {
    if (!user) return "not-joined"

    const participation = lottery.participants?.find((p) => p.user_id === user.id)
    if (!participation) return "not-joined"

    if (participation.is_winner) return "won"
    if (lottery.status === "completed") return "lost"
    return "joined"
  }

  if (!user || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  const activeLotteries = lotteries.filter((l) => l.status === "active")
  const completedLotteries = lotteries.filter((l) => l.status === "completed")
  const myWins = completedLotteries.filter((l) =>
    l.participants?.some((p) => p.user_id === user.id && p.is_winner),
  ).length
  const myParticipations = lotteries.filter((l) => l.participants?.some((p) => p.user_id === user.id)).length

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Participant Dashboard</h1>
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

        {notification && (
          <Alert className={`mb-6 ${notification.type === "success" ? "border-green-500" : "border-red-500"}`}>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Lotteries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLotteries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Wins</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myWins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lotteries.length > 0 ? Math.round((myParticipations / lotteries.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Active Lotteries</h2>
            {activeLotteries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">No active lotteries available</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeLotteries.map((lottery) => {
                  const status = getParticipationStatus(lottery)
                  const participantCount = lottery.participants?.length || 0

                  return (
                    <Card key={lottery.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{lottery.name}</CardTitle>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <CardDescription>Created: {new Date(lottery.created_at).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
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

                          {status === "joined" ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Already joined
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleJoinLottery(lottery)}
                              className="w-full"
                              disabled={participantCount >= lottery.max_participants}
                            >
                              {participantCount >= lottery.max_participants ? "Full" : "Join Lottery"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Completed Lotteries</h2>
            {completedLotteries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">No completed lotteries yet</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedLotteries.map((lottery) => {
                  const status = getParticipationStatus(lottery)
                  const winners = lottery.participants?.filter((p) => p.is_winner) || []

                  return (
                    <Card key={lottery.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{lottery.name}</CardTitle>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                        <CardDescription>Created: {new Date(lottery.created_at).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Participants:</span>
                            <span>
                              {lottery.participants?.length || 0} / {lottery.max_participants}
                            </span>
                          </div>

                          {status === "won" && (
                            <div className="flex items-center text-green-600 text-sm">
                              <Trophy className="w-4 h-4 mr-1" />
                              You won!
                            </div>
                          )}

                          {status === "lost" && (
                            <div className="flex items-center text-red-600 text-sm">
                              <XCircle className="w-4 h-4 mr-1" />
                              You didn't win
                            </div>
                          )}

                          {status === "not-joined" && (
                            <div className="text-gray-500 text-sm">You didn't participate</div>
                          )}

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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

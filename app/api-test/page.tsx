"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function ApiTestPage() {
  const [lotteryId, setLotteryId] = useState("")
  const [numberOfWinners, setNumberOfWinners] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/lottery/select-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotteryId,
          numberOfWinners
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "An error occurred")
      } else {
        setResult(data)
      }
    } catch (err) {
      setError("Failed to call API: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Lottery API Test</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Winner Selection API</CardTitle>
          <CardDescription>
            Enter a lottery ID to test selecting winners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lotteryId">Lottery ID</Label>
              <Input
                id="lotteryId"
                value={lotteryId}
                onChange={(e) => setLotteryId(e.target.value)}
                placeholder="Enter lottery ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="winners">Number of Winners</Label>
              <Input
                id="winners"
                type="number"
                min={1}
                value={numberOfWinners}
                onChange={(e) => setNumberOfWinners(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTest} disabled={!lotteryId || loading}>
            {loading ? "Testing..." : "Test API"}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <div className="mt-6 max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 max-w-md mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-green-800 font-medium">Success</h3>
            <pre className="mt-2 text-sm whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Users, Trophy, LogOut, Gift, LinkIcon } from "lucide-react";
import { supabase, type User, type Lottery } from "@/lib/supabase";
import ProductSelector from "@/components/product-selector";

type AdminDashboardProps = {
  lotteries: Lottery[];
};
export default function AdminDashboard({ lotteries }: AdminDashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [localLotteries, setLotteries] = useState<Lottery[]>(lotteries || []);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLottery, setNewLottery] = useState({
    name: "",
    maxParticipants: 10,
    numberOfWinners: 1,
    productId: "",
    productName: "",
    productImage: "",
    productUrl: "",
  });
  const router = useRouter();

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      if (userData.user_type !== "admin") {
        router.push("/");
        return;
      }
      setUser(userData);
    } else {
      router.push("/");
    }
  }, [router]);

  const handleCreateLottery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    try {
      const { data, error } = await supabase
        .from("lotteries")
        .insert({
          name: newLottery.name,
          max_participants: newLottery.maxParticipants,
          number_of_winners: newLottery.numberOfWinners,
          created_by: user.id,
          product_id: newLottery.productId,
          product_name: newLottery.productName,
          product_image: newLottery.productImage,
          product_url: newLottery.productUrl,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating lottery:", error);
        setError(`Failed to create lottery: ${error.message}`);
        return;
      }

      setNewLottery({
        name: "",
        maxParticipants: 10,
        numberOfWinners: 1,
        productId: "",
        productName: "",
        productImage: "",
        productUrl: "",
      });
      setShowCreateForm(false);
      // loadLotteries(); // Reload lotteries

      await fetch("/api/lotteries/revalidate");
    } catch (error) {
      console.error("Error creating lottery:", error);
      setError("Failed to create lottery. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/");
  };

  const activeLotteries = localLotteries.filter((l) => l.status === "active");
  const completedLotteries = localLotteries.filter(
    (l) => l.status === "completed"
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            {/* <p className="text-gray-600">Welcome back, {user.name}</p> */}
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
              <CardTitle className="text-sm font-medium">
                Total Lotteries
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{localLotteries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Lotteries
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLotteries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Lotteries
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedLotteries.length}
              </div>
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
              <CardDescription>
                Set up a new lottery for participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateLottery} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Lottery Name</Label>
                  <Input
                    id="name"
                    value={newLottery.name}
                    onChange={(e) =>
                      setNewLottery({ ...newLottery, name: e.target.value })
                    }
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
                        setNewLottery({
                          ...newLottery,
                          maxParticipants: Number.parseInt(e.target.value),
                        })
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
                        setNewLottery({
                          ...newLottery,
                          numberOfWinners: Number.parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    <span>Prize Product</span>
                  </Label>
                  <ProductSelector
                    selectedProduct={
                      newLottery.productId
                        ? {
                            id: newLottery.productId,
                            name: newLottery.productName,
                            image: newLottery.productImage,
                            slug: "",
                            description: "",
                          }
                        : null
                    }
                    onSelect={(product) => {
                      if (product) {
                        setNewLottery({
                          ...newLottery,
                          productId: product.id,
                          productName: product.name,
                          productImage: product.image || "",
                          productUrl: product.flaconiUrl
                            ? `https://lite-stage-de.flaconi.de/${product.flaconiUrl}`
                            : ``,
                        });
                      } else {
                        setNewLottery({
                          ...newLottery,
                          productId: "",
                          productName: "",
                          productImage: "",
                          productUrl: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit">Create Lottery</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localLotteries.map((lottery) => {
            const participantCount = lottery.participants?.length || 0;
            const winners =
              lottery.participants?.filter((p) => p.is_winner) || [];

            return (
              <Card key={lottery.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{lottery.name}</CardTitle>
                    <Badge
                      variant={
                        lottery.status === "active" ? "default" : "secondary"
                      }
                    >
                      {lottery.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Created: {new Date(lottery.created_at).toLocaleDateString()}
                  </CardDescription>
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
                    {lottery.product_name && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                        {lottery.product_image && (
                          <div className="flex justify-center">
                            <img
                              src={lottery.product_image}
                              alt={lottery.product_name}
                              className="h-24 object-contain rounded-md"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Gift className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 truncate">
                            {lottery.product_name}
                          </span>
                        </div>
                        {lottery.product_url && (
                          <div className="flex items-center gap-2 text-sm">
                            <LinkIcon className="w-3 h-3 text-gray-500" />
                            <a
                              href={lottery.product_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline truncate"
                            >
                              Product link
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {winners.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Winners:</p>
                        <div className="space-y-1">
                          {winners.map((winner) => (
                            <Badge
                              key={winner.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {winner.users.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

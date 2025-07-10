import { Lottery, supabase } from "@/lib/supabase";
import AdminDashboard from "./components/admin-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "lucide-react";

export const revalidate = 100;

const protocol = process.env.VERCEL_ENV === "development" ? "http" : "https";
export default async function AdminPage() {
  const response = await fetch(
    `${protocol}://${process.env.VERCEL_URL}/api/lotteries`,
    {
      next: { tags: ["lotteries"] },
    }
  );

  const lotteries: Lottery[] = await response.json();

  return <AdminDashboard lotteries={lotteries as any} />;
}

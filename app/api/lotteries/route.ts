import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data: lotteries, error } = await supabase
      .from("lotteries")
      .select(
        `
            *,
            participants:lottery_participants(
                id,
                user_id,
                is_winner,
                joined_at,
                users(id, name, username)
            )
            `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return NextResponse.json(lotteries);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch lotteries" }),
      {
        status: 500,
      }
    );
  }
}

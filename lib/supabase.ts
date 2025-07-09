import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface User {
  id: string
  username: string
  name: string
  user_type: "admin" | "participant"
}

export interface Lottery {
  id: string
  name: string
  max_participants: number
  number_of_winners: number
  status: "active" | "completed"
  created_at: string
  participants?: LotteryParticipant[]
}

export interface LotteryParticipant {
  id: string
  lottery_id: string
  user_id: string
  is_winner: boolean
  joined_at: string
  users: User
}

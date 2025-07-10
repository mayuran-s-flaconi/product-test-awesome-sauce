import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { LotteryParticipant } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { lotteryId, numberOfWinners = 1 } = await request.json()
    
    if (!lotteryId) {
      return NextResponse.json(
        { error: 'Missing lotteryId in request body' },
        { status: 400 }
      )
    }

    // Check if lottery exists
    const { data: lotteryData, error: lotteryError } = await supabase
      .from('lotteries')
      .select('*')
      .eq('id', lotteryId)
      .single()

    if (lotteryError || !lotteryData) {
      console.error('Error fetching lottery:', lotteryError)
      return NextResponse.json(
        { error: 'Lottery not found' },
        { status: 404 }
      )
    }

    // Check if lottery is already completed
    if (lotteryData.status === 'completed') {
      return NextResponse.json(
        { error: 'Lottery is already completed' },
        { status: 400 }
      )
    }

    // Get all participants for this lottery
    const { data: participants, error: participantsError } = await supabase
      .from('lottery_participants')
      .select(`
        id,
        user_id,
        is_winner,
        joined_at,
        users(id, name, username)
      `)
      .eq('lottery_id', lotteryId)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
      return NextResponse.json(
        { error: 'Failed to fetch lottery participants' },
        { status: 500 }
      )
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found for this lottery' },
        { status: 400 }
      )
    }

    // Ensure number of winners doesn't exceed number of participants
    const winnerCount = Math.min(numberOfWinners, participants.length)

    // Randomly select winners
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const winners = shuffled.slice(0, winnerCount)

    // Update winners in database
    for (const winner of winners) {
      const { error } = await supabase
        .from('lottery_participants')
        .update({ is_winner: true })
        .eq('id', winner.id)
      
      if (error) {
        console.error('Error updating winner:', error)
        return NextResponse.json(
          { error: 'Failed to update winners' },
          { status: 500 }
        )
      }
    }

    // Update lottery status to completed
    const { error: updateLotteryError } = await supabase
      .from('lotteries')
      .update({ status: 'completed' })
      .eq('id', lotteryId)
    
    if (updateLotteryError) {
      console.error('Error updating lottery status:', updateLotteryError)
      return NextResponse.json(
        { error: 'Failed to update lottery status' },
        { status: 500 }
      )
    }

    // Return winners with user data
    return NextResponse.json({
      success: true,
      winners: winners.map(winner => ({
        id: winner.id,
        user_id: winner.user_id,
        user: winner.users
      }))
    })

  } catch (error) {
    console.error('Error in lottery winner selection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

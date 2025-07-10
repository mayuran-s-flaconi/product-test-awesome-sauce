import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const { lotteryId, userId } = await request.json()

        const { count: countOfLotteryParticipants } = await supabase.from("lottery_participants").select("*", { count: 'exact' }).eq('lottery_id', lotteryId)
        console.log({countOfLotteryParticipants});

        if (!lotteryId || !userId) {
            return NextResponse.json(
                { error: 'Missing lotteryId or userId in request body' },
                { status: 400 }
            )
        }

        // Check if lottery exists
        const { data: lotteryData, error: lotteryError } = await supabase
            .from('lotteries')
            .select('*')
            .eq('id', lotteryId)
            .single()

        console.log("Joining lottery:", lotteryId, "for user:", userId)
        if (lotteryError || !lotteryData) {
            console.error('Error fetching lottery:', lotteryError)
            return NextResponse.json(
                { error: 'Lottery not found' },
                { status: 404 }
            )
        }

        const alreadyJoined = lotteryData.participants?.some((p: any) => p.user_id === userId)
        if (alreadyJoined) {
            return NextResponse.json(
                { error: 'You have already joined this lottery!' },
                { status: 404 }
            )
        }

        // Add participant to lottery
        const { error } = await supabase.from("lottery_participants").insert({
            lottery_id: lotteryData.id,
            user_id: userId
        })

        if (error) {
            console.error("Error joining lottery:", error)
            return NextResponse.json(
                { error: `Failed to join lottery: ${error.message}` },
                { status: 500 }
            )
        }

        // const { data: lotteryParticipants, count } = await supabase.from("lottery_participants").select("*", { count: 'exact' }).eq('lottery_id', lotteryId)

        // Check if lottery is now full
        const currentParticipants = (countOfLotteryParticipants || 0) + 1
        console.log(currentParticipants)
        console.log("Max participants:", lotteryData.max_participants)
        if (currentParticipants === lotteryData.max_participants) {
            const response = await fetch('https://v0-product-test-awesome-j0.vercel.app/api/lottery/select-winner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lotteryId: lotteryData.id,
                    numberOfWinners: lotteryData.number_of_winners,
                }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                console.error("Error selecting winners:", errorData)
            }
        }

        return NextResponse.json(
            { success: true },
        )
    } catch (error) {
        console.error('Error in joining lottery', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

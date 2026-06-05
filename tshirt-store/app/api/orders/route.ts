import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  // Cherche les sessions Stripe par email client
  const sessions = await stripe.checkout.sessions.list({
    limit: 20,
    expand: ['data.line_items'],
  })

  const orders = sessions.data
    .filter((s) => s.customer_details?.email?.toLowerCase() === email.toLowerCase())
    .map((s) => ({
      id: s.id,
      date: new Date(s.created * 1000).toISOString(),
      product: s.line_items?.data?.[0]?.description ?? 'T-shirt',
      amount: s.amount_total ?? 0,
      status: s.payment_status === 'paid' ? 'paid' : 'pending',
      tracking: s.metadata?.tracking ?? null,
    }))

  return NextResponse.json({ orders })
}

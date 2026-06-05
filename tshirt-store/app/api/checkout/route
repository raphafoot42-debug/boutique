import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { products } from '@/lib/products'

export async function POST(req: NextRequest) {
  const { productId, size } = await req.json()

  const product = products.find((p) => p.id === productId)
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: product.stripePriceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/shop`,
    metadata: {
      productId: product.id,
      size,
    },
    shipping_address_collection: {
      allowed_countries: ['FR', 'BE', 'CH', 'LU'],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'eur' },
          display_name: 'Livraison standard (3-5 jours)',
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 599, currency: 'eur' },
          display_name: 'Livraison express (1-2 jours)',
        },
      },
    ],
  })

  return NextResponse.json({ url: session.url })
}

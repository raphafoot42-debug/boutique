import { stripe } from '@/lib/stripe'
import Link from 'next/link'
import { CheckCircle2, Package } from 'lucide-react'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  let session = null

  if (searchParams.session_id) {
    try {
      session = await stripe.checkout.sessions.retrieve(searchParams.session_id, {
        expand: ['line_items'],
      })
    } catch {
      // session invalide, on affiche juste la page de succès générique
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle2 size={64} className="text-green-500" strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl font-bold mb-3">Commande confirmée !</h1>
      <p className="text-gray-500 mb-2">
        Merci pour votre achat. Un email de confirmation a été envoyé par Stripe.
      </p>

      {session?.customer_details?.email && (
        <p className="text-sm text-gray-400 mb-8">
          Confirmation envoyée à <strong>{session.customer_details.email}</strong>
        </p>
      )}

      {session?.line_items?.data?.[0] && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left">
          <p className="text-sm text-gray-500 mb-1">Commande</p>
          <p className="font-semibold">{session.line_items.data[0].description}</p>
          <p className="text-lg font-bold mt-1">
            {((session.line_items.data[0].amount_total ?? 0) / 100).toFixed(2)} €
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/orders"
          className="inline-flex items-center justify-center gap-2 border border-gray-200 px-6 py-3 rounded-full text-sm font-medium hover:border-gray-400 transition-colors"
        >
          <Package size={16} /> Voir mes commandes
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Continuer mes achats
        </Link>
      </div>
    </div>
  )
}

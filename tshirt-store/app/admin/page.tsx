import { stripe } from '@/lib/stripe'
import { TrendingUp, ShoppingBag, Users, Euro } from 'lucide-react'

async function getStats() {
  const [charges, sessions] = await Promise.all([
    stripe.charges.list({ limit: 100 }),
    stripe.checkout.sessions.list({ limit: 100, expand: ['data.line_items'] }),
  ])

  const paidSessions = sessions.data.filter((s) => s.payment_status === 'paid')
  const totalRevenue = paidSessions.reduce((sum, s) => sum + (s.amount_total ?? 0), 0)
  const uniqueEmails = new Set(paidSessions.map((s) => s.customer_details?.email).filter(Boolean))

  const recentOrders = paidSessions.slice(0, 10).map((s) => ({
    id: s.id,
    email: s.customer_details?.email ?? '—',
    product: s.line_items?.data?.[0]?.description ?? 'T-shirt',
    amount: s.amount_total ?? 0,
    date: new Date(s.created * 1000).toLocaleDateString('fr-FR'),
  }))

  return {
    totalRevenue,
    totalOrders: paidSessions.length,
    totalCustomers: uniqueEmails.size,
    avgOrder: paidSessions.length ? Math.round(totalRevenue / paidSessions.length) : 0,
    recentOrders,
  }
}

export default async function AdminPage() {
  // Protection basique — en production, ajoutez une vraie auth (NextAuth, Clerk, etc.)
  const stats = await getStats()

  const metrics = [
    { label: 'Revenus totaux', value: `${(stats.totalRevenue / 100).toFixed(2)} €`, icon: Euro, color: 'bg-green-50 text-green-600' },
    { label: 'Commandes', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Clients uniques', value: stats.totalCustomers, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Panier moyen', value: `${(stats.avgOrder / 100).toFixed(2)} €`, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard NexaWear</h1>
          <p className="text-gray-500 mt-1">Données en direct depuis Stripe</p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-full hover:border-gray-400 transition-colors"
        >
          Ouvrir Stripe →
        </a>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className={`inline-flex p-2 rounded-xl mb-3 ${m.color}`}>
              <m.icon size={18} />
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold">Commandes récentes</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Produit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {stats.recentOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-600">{order.email}</td>
                <td className="px-6 py-4 font-medium">{order.product}</td>
                <td className="px-6 py-4 text-gray-400">{order.date}</td>
                <td className="px-6 py-4 text-right font-semibold">{(order.amount / 100).toFixed(2)} €</td>
              </tr>
            ))}
            {stats.recentOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  Aucune commande pour l'instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

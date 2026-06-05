'use client'
import { useState } from 'react'
import { Package, Search, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'

type Order = {
  id: string
  date: string
  product: string
  amount: number
  status: string
  tracking?: string
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  paid: { label: 'Payé', icon: <CheckCircle2 size={14} />, color: 'text-green-600 bg-green-50' },
  shipped: { label: 'Expédié', icon: <Package size={14} />, color: 'text-blue-600 bg-blue-50' },
  pending: { label: 'En attente', icon: <Clock size={14} />, color: 'text-amber-600 bg-amber-50' },
  canceled: { label: 'Annulé', icon: <XCircle size={14} />, color: 'text-red-500 bg-red-50' },
}

export default function OrdersPage() {
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrders(data.orders)
      setSearched(true)
    } catch {
      setError('Erreur lors de la recherche. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Mes commandes</h1>
      <p className="text-gray-500 mb-8">Entrez votre email pour retrouver vos commandes.</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          required
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Rechercher
        </button>
      </form>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {searched && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucune commande trouvée pour cet email.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const s = statusConfig[order.status] ?? statusConfig.pending
            return (
              <div key={order.id} className="border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{order.product}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
                    {s.icon} {s.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">{(order.amount / 100).toFixed(2)} €</p>
                  {order.tracking && (
                    <p className="text-xs text-gray-400">Suivi : <span className="font-mono">{order.tracking}</span></p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

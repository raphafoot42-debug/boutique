'use client'
import { useState } from 'react'
import Image from 'next/image'
import { type Product } from '@/lib/products'
import { ShoppingCart, Loader2 } from 'lucide-react'

export default function ProductCard({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleBuy = async () => {
    if (!selectedSize) {
      setError('Choisissez une taille')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, size: selectedSize }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error('Pas de lien de paiement')
    } catch {
      setError('Erreur, réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="group flex flex-col border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">{product.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
        </div>

        <p className="text-lg font-bold">{(product.price / 100).toFixed(2)} €</p>

        {/* Tailles */}
        <div className="flex flex-wrap gap-1.5">
          {product.sizes.map((size) => (
            <button
              key={size}
              onClick={() => { setSelectedSize(size); setError('') }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                selectedSize === size
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleBuy}
          disabled={loading}
          className="mt-auto flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
          {loading ? 'Redirection...' : 'Acheter maintenant'}
        </button>
      </div>
    </div>
  )
}

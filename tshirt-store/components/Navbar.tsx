'use client'
import Link from 'next/link'
import { ShoppingBag, Package } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight">NexaWear</Link>
        <div className="flex items-center gap-6">
          <Link href="/shop" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ShoppingBag size={16} />
            Boutique
          </Link>
          <Link href="/orders" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <Package size={16} />
            Mes commandes
          </Link>
        </div>
      </div>
    </nav>
  )
}

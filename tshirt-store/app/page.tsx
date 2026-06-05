import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero */}
      <section className="py-24 md:py-36 text-center">
        <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-4">NexaWear</p>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          T-shirts pensés<br />pour durer.
        </h1>
        <p className="text-lg text-gray-500 max-w-md mx-auto mb-10">
          Coton bio, coupes intemporelles, fabriqué en Europe. Livraison offerte dès 60 €.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Voir la collection <ArrowRight size={16} />
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16 border-t border-gray-100">
        {[
          { icon: '🌿', title: 'Coton bio certifié', desc: 'GOTS certifié, sans pesticides, respectueux de la planète.' },
          { icon: '🏭', title: 'Fabriqué en Europe', desc: 'Ateliers partenaires au Portugal, conditions de travail éthiques.' },
          { icon: '📦', title: 'Livraison gratuite', desc: 'Offerte dès 60 € d\'achat. Retours gratuits sous 30 jours.' },
        ].map((f) => (
          <div key={f.title} className="text-center p-6">
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

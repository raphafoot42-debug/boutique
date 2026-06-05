import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NexaWear — T-shirts de qualité',
  description: 'Boutique de t-shirts premium NexaWear',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-white text-gray-900 min-h-screen`}>
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-gray-100 mt-24 py-10 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} NexaWear. Tous droits réservés.
        </footer>
      </body>
    </html>
  )
}

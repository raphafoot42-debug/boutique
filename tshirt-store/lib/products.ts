export type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  sizes: string[]
  stripePriceId: string
  colors: string[]
}

export const products: Product[] = [
  {
    id: 'nexawear-tshirt',
    name: 'NexaWear T-shirt',
    description: 'T-shirt de qualité premium, coupe moderne. Disponible en plusieurs tailles.',
    price: 1999,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stripePriceId: 'price_1TebF7LyTbnMrw2ZcIhO4CBe',
    colors: ['Noir', 'Blanc'],
  },
]

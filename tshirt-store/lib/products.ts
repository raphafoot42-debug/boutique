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
    image: 'https://i.imgur.com/9HwEcuN.png',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stripePriceId: 'price_1TebF7LyTbnMrw2ZcIhO4CBe',
    colors: ['Noir', 'Blanc'],
  },
]

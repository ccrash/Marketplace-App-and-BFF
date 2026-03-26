export interface ProductStock {
  available: number
  reserved?: number
  sold?: number
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number // pence
  category: string
  imageUrl?: string
  stock: ProductStock
}

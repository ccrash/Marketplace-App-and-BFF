export interface ProductStock {
  available: number
  reserved?: number
  sold?: number
}

export interface Product {
  id: string
  name: string
  price: number // pence
  category: string
  stock: ProductStock
}

import { create } from 'zustand'
import * as api from '@utils/api'
import { formatError } from '@utils/format'
import type { Product } from '@/types/product'

type ProductsState = {
  products: Product[]
  selectedProduct: Product | null
  isLoading: boolean
  isLoadingProduct: boolean
  error: string | null
  productError: string | null
}

type ProductsActions = {
  loadProducts: () => Promise<void>
  loadProduct: (id: string) => Promise<void>
  clearError: () => void
}

export const useProductsStore = create<ProductsState & ProductsActions>((set) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  isLoadingProduct: false,
  error: null,
  productError: null,

  loadProducts: async () => {
    set({ isLoading: true, error: null })
    try {
      const products = await api.getProducts()
      set({ products, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: formatError(err) })
    }
  },

  loadProduct: async (id) => {
    set({ isLoadingProduct: true, productError: null, selectedProduct: null })
    try {
      const product = await api.getProduct(id)
      set({ selectedProduct: product, isLoadingProduct: false })
    } catch (err) {
      set({ isLoadingProduct: false, productError: formatError(err) })
    }
  },

  clearError: () => set({ error: null, productError: null }),
}))

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
  /** Shift `available` by `delta` and `reserved` by `-delta` on the selected product. */
  adjustSelectedProductStock: (delta: number) => void
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

  adjustSelectedProductStock: (delta) =>
    set((s) => {
      if (!s.selectedProduct) return s
      const stock = s.selectedProduct.stock
      return {
        selectedProduct: {
          ...s.selectedProduct,
          stock: {
            ...stock,
            available: stock.available + delta,
            ...(stock.reserved !== undefined && { reserved: stock.reserved - delta }),
          },
        },
      }
    }),

  clearError: () => set({ error: null, productError: null }),
}))

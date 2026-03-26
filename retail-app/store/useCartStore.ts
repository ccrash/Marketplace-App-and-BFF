import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as api from '@utils/api'
import { ApiError } from '@utils/api'
import { formatError } from '@utils/format'
import type { Cart } from '@/types/cart'
import type { OrderSummary } from '@/types/order'

type CartState = {
  cartId: string | null
  cart: Cart | null
  isLoading: boolean
  /** productIds currently being mutated (add/update/remove) */
  loadingProductIds: string[]
  error: string | null
}

type CartActions = {
  /** Returns existing cartId or creates a new cart. */
  ensureCart: () => Promise<string>
  loadCart: () => Promise<void>
  addItem: (productId: string) => Promise<void>
  updateItem: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  abandonCart: () => Promise<void>
  checkout: () => Promise<OrderSummary>
  clearError: () => void
  /** Call when a 410 is received to wipe expired cart state. */
  handleExpiredCart: () => void
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      cartId: null,
      cart: null,
      isLoading: false,
      loadingProductIds: [],
      error: null,

      ensureCart: async () => {
        const existing = get().cartId
        if (existing) return existing
        const { cartId } = await api.createCart()
        set({ cartId })
        return cartId
      },

      loadCart: async () => {
        const { cartId } = get()
        if (!cartId) return
        set({ isLoading: true, error: null })
        try {
          const cart = await api.getCart(cartId)
          set({ cart, isLoading: false })
        } catch (err) {
          if (err instanceof ApiError && err.status === 410) {
            get().handleExpiredCart()
          } else {
            set({ isLoading: false, error: formatError(err) })
          }
        }
      },

      addItem: async (productId) => {
        set((s) => ({ loadingProductIds: [...s.loadingProductIds, productId], error: null }))
        try {
          const cartId = await get().ensureCart()
          const cart = await api.addItemToCart(cartId, productId, 1)
          set((s) => ({
            cart,
            loadingProductIds: s.loadingProductIds.filter((id) => id !== productId),
          }))
        } catch (err) {
          const isStaleCart =
            err instanceof ApiError && (err.status === 410 || err.status === 404)
          if (isStaleCart) {
            get().handleExpiredCart()
            // Retry once with a fresh cart
            try {
              const { cartId: newId } = await api.createCart()
              set({ cartId: newId })
              const cart = await api.addItemToCart(newId, productId, 1)
              set((s) => ({
                cart,
                loadingProductIds: s.loadingProductIds.filter((id) => id !== productId),
              }))
              return
            } catch {
              // fall through to error
            }
          }
          set((s) => ({
            loadingProductIds: s.loadingProductIds.filter((id) => id !== productId),
            error: formatError(err),
          }))
          throw err
        }
      },

      updateItem: async (productId, quantity) => {
        set((s) => ({ loadingProductIds: [...s.loadingProductIds, productId], error: null }))
        try {
          const cartId = get().cartId!
          const cart = await api.updateCartItem(cartId, productId, quantity)
          set((s) => ({
            cart,
            loadingProductIds: s.loadingProductIds.filter((id) => id !== productId),
          }))
        } catch (err) {
          if (err instanceof ApiError && err.status === 410) {
            get().handleExpiredCart()
          } else {
            set((s) => ({
              loadingProductIds: s.loadingProductIds.filter((id) => id !== productId),
              error: formatError(err),
            }))
          }
        }
      },

      removeItem: async (productId) => {
        set((s) => ({ loadingProductIds: [...s.loadingProductIds, productId], error: null }))
        try {
          const cartId = get().cartId!
          const cart = await api.removeCartItem(cartId, productId)
          set((s) => ({
            cart,
            loadingProductIds: s.loadingProductIds.filter((id) => id !== productId),
          }))
        } catch (err) {
          if (err instanceof ApiError && err.status === 410) {
            get().handleExpiredCart()
          } else {
            set((s) => ({
              loadingProductIds: s.loadingProductIds.filter((id) => id !== productId),
              error: formatError(err),
            }))
          }
        }
      },

      abandonCart: async () => {
        const { cartId } = get()
        if (!cartId) return
        try {
          await api.abandonCart(cartId)
        } catch {
          // Best-effort — still clear local state
        }
        set({ cartId: null, cart: null, error: null })
      },

      checkout: async () => {
        const cartId = get().cartId
        if (!cartId) throw new Error('No active cart')
        set({ isLoading: true, error: null })
        try {
          const order = await api.checkout(cartId)
          set({ cart: null, cartId: null, isLoading: false })
          return order
        } catch (err) {
          set({ isLoading: false, error: formatError(err) })
          throw err
        }
      },

      clearError: () => set({ error: null }),

      handleExpiredCart: () =>
        set({
          cartId: null,
          cart: null,
          isLoading: false,
          loadingProductIds: [],
          error: 'Your cart expired — please add items again',
        }),
    }),
    {
      name: 'retail-cart',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the cartId — the full cart is always refreshed from the server
      partialize: (state) => ({ cartId: state.cartId }),
    },
  ),
)

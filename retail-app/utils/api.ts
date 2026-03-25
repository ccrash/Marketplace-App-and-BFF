import type { Product } from '@/types/product'
import type { Cart } from '@/types/cart'
import type { OrderSummary } from '@/types/order'

const BASE_URL = process.env.EXPO_PUBLIC_BFF_URL ?? 'http://localhost:3000'

const REQUEST_TIMEOUT_MS = 15_000

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...((options?.headers as Record<string, string>) ?? {}),
      },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message =
        typeof body?.message === 'string'
          ? body.message
          : Array.isArray(body?.message)
            ? (body.message as string[]).join(', ')
            : `HTTP ${res.status}`
      throw new ApiError(res.status, message)
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  } catch (err) {
    if (err instanceof ApiError) throw err
    if ((err as Error).name === 'AbortError') {
      throw new ApiError(0, 'Request timed out — please try again')
    }
    throw new ApiError(0, 'Network error — check your connection')
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── Products ─────────────────────────────────────────────────────────────────

export const getProducts = (): Promise<Product[]> => fetchJson('/products')

export const getProduct = (id: string): Promise<Product> =>
  fetchJson(`/products/${id}`)

// ── Cart ──────────────────────────────────────────────────────────────────────

export const createCart = (): Promise<{ cartId: string; expiresAt: string }> =>
  fetchJson('/cart', { method: 'POST' })

export const getCart = (cartId: string): Promise<Cart> =>
  fetchJson(`/cart/${cartId}`)

export const addItemToCart = (
  cartId: string,
  productId: string,
  quantity: number,
): Promise<Cart> =>
  fetchJson(`/cart/${cartId}/items`, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  })

export const updateCartItem = (
  cartId: string,
  productId: string,
  quantity: number,
): Promise<Cart> =>
  fetchJson(`/cart/${cartId}/items/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })

export const removeCartItem = (
  cartId: string,
  productId: string,
): Promise<Cart> =>
  fetchJson(`/cart/${cartId}/items/${productId}`, { method: 'DELETE' })

export const abandonCart = (cartId: string): Promise<void> =>
  fetchJson(`/cart/${cartId}`, { method: 'DELETE' })

// ── Checkout ──────────────────────────────────────────────────────────────────

export const checkout = (cartId: string): Promise<OrderSummary> =>
  fetchJson(`/checkout/${cartId}`, { method: 'POST' })

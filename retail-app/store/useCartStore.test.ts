import { useCartStore } from '@store/useCartStore'
import { ApiError } from '@utils/api'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}))

jest.mock('@utils/api', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(mockStatus: number, message: string) {
      super(message)
      this.name = 'ApiError'
      this.status = mockStatus
    }
  },
  createCart: jest.fn(),
  getCart: jest.fn(),
  addItemToCart: jest.fn(),
  updateCartItem: jest.fn(),
  removeCartItem: jest.fn(),
  abandonCart: jest.fn(),
  checkout: jest.fn(),
}))

import {
  createCart as mockCreateCart,
  getCart as mockGetCart,
  addItemToCart as mockAddItemToCart,
  updateCartItem as mockUpdateCartItem,
  removeCartItem as mockRemoveCartItem,
  abandonCart as mockAbandonCart,
  checkout as mockCheckout,
} from '@utils/api'

const makeCart = (overrides = {}) => ({
  cartId: 'cart-123',
  status: 'ACTIVE' as const,
  items: [],
  subtotal: 0,
  appliedDiscounts: [],
  discountTotal: 0,
  grandTotal: 0,
  expiresAt: '2099-01-01T00:00:00Z',
  ...overrides,
})

const INITIAL_STATE = {
  cartId: null,
  cart: null,
  isLoading: false,
  loadingProductIds: [],
  error: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  useCartStore.setState(INITIAL_STATE)
})

describe('initial state', () => {
  it('has correct defaults', () => {
    const s = useCartStore.getState()
    expect(s.cartId).toBeNull()
    expect(s.cart).toBeNull()
    expect(s.isLoading).toBe(false)
    expect(s.loadingProductIds).toEqual([])
    expect(s.error).toBeNull()
  })
})

describe('ensureCart', () => {
  it('returns existing cartId without creating a new cart', async () => {
    useCartStore.setState({ cartId: 'existing-cart' })
    const id = await useCartStore.getState().ensureCart()
    expect(id).toBe('existing-cart')
    expect(mockCreateCart).not.toHaveBeenCalled()
  })

  it('creates a new cart when none exists', async () => {
    ;(mockCreateCart as jest.Mock).mockResolvedValue({ cartId: 'new-cart', expiresAt: '2099-01-01T00:00:00Z' })
    const id = await useCartStore.getState().ensureCart()
    expect(id).toBe('new-cart')
    expect(useCartStore.getState().cartId).toBe('new-cart')
  })
})

describe('loadCart', () => {
  it('is a no-op when there is no cartId', async () => {
    await useCartStore.getState().loadCart()
    expect(mockGetCart).not.toHaveBeenCalled()
  })

  it('fetches the cart and updates state', async () => {
    useCartStore.setState({ cartId: 'cart-123' })
    const cart = makeCart()
    ;(mockGetCart as jest.Mock).mockResolvedValue(cart)

    await useCartStore.getState().loadCart()

    expect(useCartStore.getState().cart).toEqual(cart)
    expect(useCartStore.getState().isLoading).toBe(false)
  })

  it('calls handleExpiredCart on 410', async () => {
    useCartStore.setState({ cartId: 'expired', cart: makeCart() })
    ;(mockGetCart as jest.Mock).mockRejectedValue(new ApiError(410, 'Expired'))

    await useCartStore.getState().loadCart()

    const s = useCartStore.getState()
    expect(s.cartId).toBeNull()
    expect(s.cart).toBeNull()
  })

  it('sets error on other failures', async () => {
    useCartStore.setState({ cartId: 'cart-123' })
    ;(mockGetCart as jest.Mock).mockRejectedValue(new ApiError(500, 'Server error'))

    await useCartStore.getState().loadCart()

    expect(useCartStore.getState().error).toBe('Server error')
  })
})

describe('addItem', () => {
  it('creates a cart if needed then adds the item', async () => {
    ;(mockCreateCart as jest.Mock).mockResolvedValue({ cartId: 'new-cart', expiresAt: '2099-01-01T00:00:00Z' })
    const cart = makeCart({ items: [{ productId: 'p1', quantity: 1 }] })
    ;(mockAddItemToCart as jest.Mock).mockResolvedValue(cart)

    await useCartStore.getState().addItem('p1')

    expect(mockAddItemToCart).toHaveBeenCalledWith('new-cart', 'p1', 1)
    expect(useCartStore.getState().cart).toEqual(cart)
    expect(useCartStore.getState().loadingProductIds).not.toContain('p1')
  })

  it('sets loading state during the request', async () => {
    useCartStore.setState({ cartId: 'cart-123' })
    let resolve!: (v: unknown) => void
    ;(mockAddItemToCart as jest.Mock).mockReturnValue(new Promise((r) => { resolve = r }))

    const promise = useCartStore.getState().addItem('p1')
    expect(useCartStore.getState().loadingProductIds).toContain('p1')

    resolve(makeCart())
    await promise
    expect(useCartStore.getState().loadingProductIds).not.toContain('p1')
  })

  it('handles expired cart: resets state and retries with new cart', async () => {
    useCartStore.setState({ cartId: 'old-cart' })
    ;(mockAddItemToCart as jest.Mock)
      .mockRejectedValueOnce(new ApiError(410, 'Expired'))
      .mockResolvedValue(makeCart())
    ;(mockCreateCart as jest.Mock).mockResolvedValue({ cartId: 'fresh-cart', expiresAt: '2099-01-01T00:00:00Z' })

    await useCartStore.getState().addItem('p1')

    expect(useCartStore.getState().cartId).toBe('fresh-cart')
  })

  it('sets error and throws on 400 insufficient stock', async () => {
    useCartStore.setState({ cartId: 'cart-123' })
    ;(mockAddItemToCart as jest.Mock).mockRejectedValue(new ApiError(400, 'Insufficient stock'))

    await expect(useCartStore.getState().addItem('p1')).rejects.toMatchObject({ status: 400 })
    expect(useCartStore.getState().error).toBe('Insufficient stock')
  })

  it('handles stale cart (404): resets state and retries with new cart', async () => {
    useCartStore.setState({ cartId: 'old-cart' })
    ;(mockAddItemToCart as jest.Mock)
      .mockRejectedValueOnce(new ApiError(404, 'Cart not found'))
      .mockResolvedValue(makeCart())
    ;(mockCreateCart as jest.Mock).mockResolvedValue({ cartId: 'fresh-cart', expiresAt: '2099-01-01T00:00:00Z' })

    await useCartStore.getState().addItem('p1')

    expect(useCartStore.getState().cartId).toBe('fresh-cart')
  })
})

describe('updateItem', () => {
  it('calls updateCartItem and updates cart', async () => {
    useCartStore.setState({ cartId: 'cart-123' })
    const updated = makeCart({ items: [{ productId: 'p1', quantity: 3 }] })
    ;(mockUpdateCartItem as jest.Mock).mockResolvedValue(updated)

    await useCartStore.getState().updateItem('p1', 3)

    expect(mockUpdateCartItem).toHaveBeenCalledWith('cart-123', 'p1', 3)
    expect(useCartStore.getState().cart).toEqual(updated)
  })

  it('calls handleExpiredCart on 410', async () => {
    useCartStore.setState({ cartId: 'cart-123', cart: makeCart() })
    ;(mockUpdateCartItem as jest.Mock).mockRejectedValue(new ApiError(410, 'Expired'))

    await useCartStore.getState().updateItem('p1', 2)

    expect(useCartStore.getState().cartId).toBeNull()
    expect(useCartStore.getState().cart).toBeNull()
  })
})

describe('removeItem', () => {
  it('calls removeCartItem and updates cart', async () => {
    useCartStore.setState({ cartId: 'cart-123' })
    const updated = makeCart()
    ;(mockRemoveCartItem as jest.Mock).mockResolvedValue(updated)

    await useCartStore.getState().removeItem('p1')

    expect(mockRemoveCartItem).toHaveBeenCalledWith('cart-123', 'p1')
    expect(useCartStore.getState().cart).toEqual(updated)
  })
})

describe('abandonCart', () => {
  it('calls abandonCart API and clears state', async () => {
    useCartStore.setState({ cartId: 'cart-123', cart: makeCart() })
    ;(mockAbandonCart as jest.Mock).mockResolvedValue(undefined)

    await useCartStore.getState().abandonCart()

    expect(mockAbandonCart).toHaveBeenCalledWith('cart-123')
    expect(useCartStore.getState().cartId).toBeNull()
    expect(useCartStore.getState().cart).toBeNull()
  })

  it('still clears state when API call fails', async () => {
    useCartStore.setState({ cartId: 'cart-123', cart: makeCart() })
    ;(mockAbandonCart as jest.Mock).mockRejectedValue(new Error('Network error'))

    await useCartStore.getState().abandonCart()

    expect(useCartStore.getState().cartId).toBeNull()
    expect(useCartStore.getState().cart).toBeNull()
  })

  it('is a no-op when there is no cart', async () => {
    await useCartStore.getState().abandonCart()
    expect(mockAbandonCart).not.toHaveBeenCalled()
  })
})

describe('checkout', () => {
  it('calls checkout API, clears cart, and returns order', async () => {
    useCartStore.setState({ cartId: 'cart-123', cart: makeCart() })
    const order = { orderId: 'ord-1', cartId: 'cart-123', totalPaid: 27999 }
    ;(mockCheckout as jest.Mock).mockResolvedValue(order)

    const result = await useCartStore.getState().checkout()

    expect(mockCheckout).toHaveBeenCalledWith('cart-123')
    expect(result).toEqual(order)
    expect(useCartStore.getState().cartId).toBeNull()
    expect(useCartStore.getState().cart).toBeNull()
  })

  it('throws and sets error on failure', async () => {
    useCartStore.setState({ cartId: 'cart-123' })
    ;(mockCheckout as jest.Mock).mockRejectedValue(new ApiError(410, 'Cart expired'))

    await expect(useCartStore.getState().checkout()).rejects.toMatchObject({ status: 410 })
    expect(useCartStore.getState().error).toBe('Your cart has expired — please start a new one')
  })

  it('throws when there is no active cart', async () => {
    await expect(useCartStore.getState().checkout()).rejects.toThrow('No active cart')
  })
})

describe('handleExpiredCart', () => {
  it('clears cart state and sets expiry error message', () => {
    useCartStore.setState({ cartId: 'cart-123', cart: makeCart() })
    useCartStore.getState().handleExpiredCart()
    const s = useCartStore.getState()
    expect(s.cartId).toBeNull()
    expect(s.cart).toBeNull()
    expect(s.error).toContain('expired')
  })
})

describe('clearError', () => {
  it('clears the error field', () => {
    useCartStore.setState({ error: 'some error' })
    useCartStore.getState().clearError()
    expect(useCartStore.getState().error).toBeNull()
  })
})

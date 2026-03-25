import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { makeOrder } from '../__mocks__/utils'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@theme/ThemeProvider', () => ({
  useTheme: () => ({
    scheme: 'light',
    colors: { bg: '#fff', primary: 'tomato', text: '#111', card: '#fff', border: '#eee', muted: '#999' },
    spacing: (n: number) => n * 4,
    radius: 12,
  }),
}))

const mockCheckout = jest.fn()
const mockCartState: any = {
  checkout: mockCheckout,
}

jest.mock('@store/useCartStore', () => ({
  useCartStore: (selector: any) =>
    typeof selector === 'function' ? selector(mockCartState) : mockCartState,
}))

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn() },
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockCartState.checkout = mockCheckout
})

import CheckoutScreen from './checkout'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CheckoutScreen — loading', () => {
  it('shows processing text while checkout is in flight', () => {
    mockCheckout.mockReturnValue(new Promise(() => {})) // never resolves
    render(<CheckoutScreen />)
    expect(screen.getByText('Processing your order…')).toBeTruthy()
  })

  it('calls checkout exactly once on mount', () => {
    mockCheckout.mockReturnValue(new Promise(() => {}))
    render(<CheckoutScreen />)
    expect(mockCheckout).toHaveBeenCalledTimes(1)
  })
})

describe('CheckoutScreen — success', () => {
  it('shows "Order placed!" after checkout resolves', async () => {
    mockCheckout.mockResolvedValue(makeOrder())
    render(<CheckoutScreen />)
    await waitFor(() => expect(screen.getByText('Order placed!')).toBeTruthy())
  })

  it('displays the order ID as an 8-character uppercase hex prefix', async () => {
    mockCheckout.mockResolvedValue(makeOrder({ orderId: 'abcdef1234567890' }))
    render(<CheckoutScreen />)
    await waitFor(() => expect(screen.getByText('Order #ABCDEF12')).toBeTruthy())
  })

  it('renders each ordered item with name, quantity, unit price, and line total', async () => {
    mockCheckout.mockResolvedValue(makeOrder({
      items: [{
        productId: 'p1',
        productName: 'Sony WH-1000XM5 Headphones',
        unitPrice: 27999,
        quantity: 1,
        lineTotal: 27999,
      }],
      subtotal: 27999,
      totalPaid: 27999,
    }))
    render(<CheckoutScreen />)
    await waitFor(() => {
      expect(screen.getByText('Sony WH-1000XM5 Headphones')).toBeTruthy()
      expect(screen.getByText('x1 @ £279.99')).toBeTruthy()
      expect(screen.getAllByText('£279.99').length).toBeGreaterThan(0)
    })
  })

  it('shows subtotal, total paid, and payment status', async () => {
    mockCheckout.mockResolvedValue(makeOrder({
      subtotal: 1299,
      totalPaid: 1299,
      paymentStatus: 'SIMULATED_SUCCESS',
    }))
    render(<CheckoutScreen />)
    await waitFor(() => {
      expect(screen.getByText('Subtotal')).toBeTruthy()
      expect(screen.getByText('Total paid')).toBeTruthy()
      expect(screen.getByText('SIMULATED_SUCCESS')).toBeTruthy()
    })
  })

  it('shows discount lines and savings total when discounts were applied', async () => {
    mockCheckout.mockResolvedValue(makeOrder({
      items: [{ productId: 'p1', productName: 'Coffee', unitPrice: 1299, quantity: 3, lineTotal: 3897 }],
      subtotal: 3897,
      appliedDiscounts: [{
        discountId: 'd1',
        code: 'COFFEE3FOR2',
        description: 'Buy 2 get 1 free',
        savingAmount: 1299,
      }],
      discountTotal: 1299,
      totalPaid: 2598,
    }))
    render(<CheckoutScreen />)
    await waitFor(() => {
      expect(screen.getByText(/COFFEE3FOR2/)).toBeTruthy()
      expect(screen.getByText('Savings')).toBeTruthy()
    })
  })

  it('navigates to /(tabs) when Continue Shopping is pressed', async () => {
    const { router } = require('expo-router')
    mockCheckout.mockResolvedValue(makeOrder())
    render(<CheckoutScreen />)
    await waitFor(() => screen.getByText('Continue Shopping'))
    fireEvent.press(screen.getByText('Continue Shopping'))
    expect(router.replace).toHaveBeenCalledWith('/(tabs)')
  })
})

describe('CheckoutScreen — error', () => {
  it('shows "Order failed" heading when checkout rejects', async () => {
    mockCheckout.mockRejectedValue(new Error('Insufficient stock'))
    render(<CheckoutScreen />)
    await waitFor(() => expect(screen.getByText('Order failed')).toBeTruthy())
  })

  it('displays the user-readable error message', async () => {
    mockCheckout.mockRejectedValue(new Error('Your cart has expired — please start a new one'))
    render(<CheckoutScreen />)
    await waitFor(() =>
      expect(screen.getByText('Your cart has expired — please start a new one')).toBeTruthy()
    )
  })

  it('calls router.back when Back to Cart is pressed', async () => {
    const { router } = require('expo-router')
    mockCheckout.mockRejectedValue(new Error('Some error'))
    render(<CheckoutScreen />)
    await waitFor(() => screen.getByText('Back to Cart'))
    fireEvent.press(screen.getByText('Back to Cart'))
    expect(router.back).toHaveBeenCalledTimes(1)
  })
})

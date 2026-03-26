import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { makeCart, makeCartItem } from '../../__mocks__/utils'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@theme/ThemeProvider', () => ({
  useTheme: () => ({
    scheme: 'light',
    colors: { bg: '#fff', primary: 'tomato', text: '#111', card: '#fff', border: '#eee', muted: '#999' },
    spacing: (n: number) => n * 4,
    radius: 12,
  }),
}))

const mockLoadCart = jest.fn()
const mockUpdateItem = jest.fn()
const mockRemoveItem = jest.fn()
const mockClearError = jest.fn()

const mockCartState: any = {
  cartId: null,
  cart: null,
  isLoading: false,
  loadingProductIds: [],
  error: null,
  loadCart: mockLoadCart,
  updateItem: mockUpdateItem,
  removeItem: mockRemoveItem,
  clearError: mockClearError,
}

jest.mock('@store/useCartStore', () => ({
  useCartStore: (selector: any) =>
    typeof selector === 'function' ? selector(mockCartState) : mockCartState,
}))

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}))

jest.mock('@components/CartItem', () => {
  const { Text, Pressable, View } = require('react-native')
  return ({ item, onIncrease, onDecrease, onRemove }: any) => (
    <View testID={`cart-item-${item.productId}`}>
      <Text>{item.productName}</Text>
      <Pressable testID={`increase-${item.productId}`} onPress={() => onIncrease(item.productId)}>
        <Text>+</Text>
      </Pressable>
      <Pressable testID={`decrease-${item.productId}`} onPress={() => onDecrease(item.productId)}>
        <Text>-</Text>
      </Pressable>
      <Pressable testID={`remove-${item.productId}`} onPress={() => onRemove(item.productId)}>
        <Text>Remove</Text>
      </Pressable>
    </View>
  )
})

jest.mock('@components/EmptyState', () => {
  const { Text } = require('react-native')
  return ({ title }: any) => <Text testID="empty-state">{title}</Text>
})

jest.mock('@components/ScreenErrorBoundary', () => ({
  ScreenErrorBoundary: ({ children }: any) => children,
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockCartState.cartId = null
  mockCartState.cart = null
  mockCartState.isLoading = false
  mockCartState.loadingProductIds = []
  mockCartState.error = null
  mockCartState.loadCart = mockLoadCart
  mockCartState.updateItem = mockUpdateItem
  mockCartState.removeItem = mockRemoveItem
  mockCartState.clearError = mockClearError
})

import CartScreen from './cart'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CartScreen — mount', () => {
  it('calls loadCart on mount when cartId is present', () => {
    mockCartState.cartId = 'cart-123'
    render(<CartScreen />)
    expect(mockLoadCart).toHaveBeenCalledTimes(1)
  })

  it('does not call loadCart when there is no cartId', () => {
    render(<CartScreen />)
    expect(mockLoadCart).not.toHaveBeenCalled()
  })
})

describe('CartScreen — loading', () => {
  it('does not render cart content while isLoading and cart is null', () => {
    mockCartState.cartId = 'cart-123'
    mockCartState.isLoading = true
    render(<CartScreen />)
    expect(screen.queryByText('Checkout')).toBeNull()
    expect(screen.queryByTestId('empty-state')).toBeNull()
  })

  it('renders cart content (not a full-screen spinner) once the cart is loaded', () => {
    mockCartState.isLoading = true
    mockCartState.cart = makeCart()
    render(<CartScreen />)
    expect(screen.getByTestId('empty-state')).toBeTruthy()
  })
})

describe('CartScreen — empty state', () => {
  it('shows empty state when there is no cart', () => {
    render(<CartScreen />)
    expect(screen.getByTestId('empty-state')).toBeTruthy()
  })

  it('shows empty state when the cart exists but has no items', () => {
    mockCartState.cart = makeCart({ items: [] })
    render(<CartScreen />)
    expect(screen.getByTestId('empty-state')).toBeTruthy()
  })
})

describe('CartScreen — items', () => {
  it('renders a row for each item in the cart', () => {
    mockCartState.cart = makeCart({
      items: [makeCartItem('p1'), makeCartItem('p2')],
      subtotal: 1998,
      grandTotal: 1998,
    })
    render(<CartScreen />)
    expect(screen.getByTestId('cart-item-p1')).toBeTruthy()
    expect(screen.getByTestId('cart-item-p2')).toBeTruthy()
  })

  it('renders the order summary footer when items are present', () => {
    mockCartState.cart = makeCart({
      items: [makeCartItem('p1')],
      subtotal: 999,
      grandTotal: 999,
    })
    render(<CartScreen />)
    expect(screen.getByText('Subtotal')).toBeTruthy()
    expect(screen.getByText('Total')).toBeTruthy()
    expect(screen.getByText('Checkout')).toBeTruthy()
  })

  it('renders each applied discount line in the summary', () => {
    mockCartState.cart = makeCart({
      items: [makeCartItem('p1', { unitPrice: 27999, lineTotal: 27999 })],
      subtotal: 27999,
      appliedDiscounts: [
        { discountId: 'd1', code: 'SONY15', description: '15% off', savingAmount: 4200 },
      ],
      discountTotal: 4200,
      grandTotal: 23799,
    })
    render(<CartScreen />)
    expect(screen.getByText('SONY15')).toBeTruthy()
    expect(screen.getByText('Discount total')).toBeTruthy()
  })
})

describe('CartScreen — item interactions', () => {
  it('calls updateItem with quantity + 1 when the increase button is pressed', () => {
    mockCartState.cart = makeCart({
      items: [makeCartItem('p1', { quantity: 2 })],
      subtotal: 1998,
      grandTotal: 1998,
    })
    render(<CartScreen />)
    fireEvent.press(screen.getByTestId('increase-p1'))
    expect(mockUpdateItem).toHaveBeenCalledWith('p1', 3)
  })

  it('calls updateItem with quantity - 1 when decrease is pressed and qty > 1', () => {
    mockCartState.cart = makeCart({
      items: [makeCartItem('p1', { quantity: 2 })],
      subtotal: 1998,
      grandTotal: 1998,
    })
    render(<CartScreen />)
    fireEvent.press(screen.getByTestId('decrease-p1'))
    expect(mockUpdateItem).toHaveBeenCalledWith('p1', 1)
    expect(mockRemoveItem).not.toHaveBeenCalled()
  })

  it('calls removeItem instead of updateItem when decrease is pressed and qty is 1', () => {
    mockCartState.cart = makeCart({
      items: [makeCartItem('p1', { quantity: 1 })],
      subtotal: 999,
      grandTotal: 999,
    })
    render(<CartScreen />)
    fireEvent.press(screen.getByTestId('decrease-p1'))
    expect(mockRemoveItem).toHaveBeenCalledWith('p1')
    expect(mockUpdateItem).not.toHaveBeenCalled()
  })

  it('calls removeItem when the remove button is pressed', () => {
    mockCartState.cart = makeCart({
      items: [makeCartItem('p1')],
      subtotal: 999,
      grandTotal: 999,
    })
    render(<CartScreen />)
    fireEvent.press(screen.getByTestId('remove-p1'))
    expect(mockRemoveItem).toHaveBeenCalledWith('p1')
  })

  it('navigates to /checkout when the checkout button is pressed', () => {
    const { router } = require('expo-router')
    mockCartState.cart = makeCart({
      items: [makeCartItem('p1')],
      subtotal: 999,
      grandTotal: 999,
    })
    render(<CartScreen />)
    fireEvent.press(screen.getByText('Checkout'))
    expect(router.push).toHaveBeenCalledWith('/checkout')
  })
})

describe('CartScreen — error banner', () => {
  it('shows the error message when error is set', () => {
    mockCartState.error = 'Insufficient stock'
    render(<CartScreen />)
    expect(screen.getByText('Insufficient stock')).toBeTruthy()
  })

  it('calls clearError when the error banner is pressed', () => {
    mockCartState.error = 'Insufficient stock'
    render(<CartScreen />)
    fireEvent.press(screen.getByText('Insufficient stock'))
    expect(mockClearError).toHaveBeenCalledTimes(1)
  })
})

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@theme/ThemeProvider', () => ({
  useTheme: () => ({
    scheme: 'light',
    colors: { bg: '#fff', primary: 'tomato', text: '#111', card: '#fff', border: '#eee', muted: '#999' },
    spacing: (n: number) => n * 4,
    radius: 12,
  }),
}))

const mockLoadProducts = jest.fn()
const mockProductsState: any = {
  products: [],
  isLoading: false,
  error: null,
  loadProducts: mockLoadProducts,
}

jest.mock('@store/useProductsStore', () => ({
  useProductsStore: (selector: any) =>
    typeof selector === 'function' ? selector(mockProductsState) : mockProductsState,
}))

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}))

jest.mock('@components/ProductCard', () => {
  const { Text, Pressable } = require('react-native')
  return ({ product, onPress }: any) => (
    <Pressable testID={`product-${product.id}`} onPress={() => onPress(product)}>
      <Text>{product.name}</Text>
    </Pressable>
  )
})

jest.mock('@components/EmptyState', () => {
  const { Text } = require('react-native')
  return ({ title }: any) => <Text testID="empty-state">{title}</Text>
})

jest.mock('@components/ScreenErrorBoundary', () => ({
  ScreenErrorBoundary: ({ children }: any) => children,
}))

const makeProduct = (id: string) => ({
  id,
  name: `Product ${id}`,
  price: 999,
  category: 'electronics',
  stock: { available: 10 },
})

beforeEach(() => {
  jest.clearAllMocks()
  mockProductsState.products = []
  mockProductsState.isLoading = false
  mockProductsState.error = null
  mockProductsState.loadProducts = mockLoadProducts
})

import ProductsScreen from './index'

describe('ProductsScreen — initial load', () => {
  it('calls loadProducts on mount', () => {
    render(<ProductsScreen />)
    expect(mockLoadProducts).toHaveBeenCalledTimes(1)
  })

  it('shows loading spinner while loading and products array is empty', () => {
    mockProductsState.isLoading = true
    render(<ProductsScreen />)
    expect(screen.getByTestId('activity-indicator-loading-wrapper')).toBeTruthy()
  })

  it('shows empty state when not loading and no products', () => {
    render(<ProductsScreen />)
    expect(screen.getByTestId('empty-state')).toBeTruthy()
  })
})

describe('ProductsScreen — product list', () => {
  it('renders a card for each product', () => {
    mockProductsState.products = [makeProduct('p1'), makeProduct('p2')]
    render(<ProductsScreen />)
    expect(screen.getByTestId('product-p1')).toBeTruthy()
    expect(screen.getByTestId('product-p2')).toBeTruthy()
  })

  it('navigates to product detail when a card is pressed', () => {
    const { router } = require('expo-router')
    mockProductsState.products = [makeProduct('p1')]
    render(<ProductsScreen />)
    fireEvent.press(screen.getByTestId('product-p1'))
    expect(router.push).toHaveBeenCalledWith('/product/p1')
  })
})

describe('ProductsScreen — error state', () => {
  it('shows error message and retry button when loading fails and list is empty', () => {
    mockProductsState.error = 'Network error — check your connection'
    render(<ProductsScreen />)
    expect(screen.getByText('Network error — check your connection')).toBeTruthy()
    expect(screen.getByText('Retry')).toBeTruthy()
  })

  it('calls loadProducts when retry is pressed', () => {
    mockProductsState.error = 'Network error'
    render(<ProductsScreen />)
    fireEvent.press(screen.getByText('Retry'))
    expect(mockLoadProducts).toHaveBeenCalledTimes(2) // once on mount, once on retry
  })

  it('does not show error UI when products are present even if error is set', () => {
    mockProductsState.error = 'Some error'
    mockProductsState.products = [makeProduct('p1')]
    render(<ProductsScreen />)
    expect(screen.queryByText('Retry')).toBeNull()
    expect(screen.getByTestId('product-p1')).toBeTruthy()
  })
})

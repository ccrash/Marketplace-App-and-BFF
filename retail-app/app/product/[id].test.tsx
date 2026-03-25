import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { makeProduct } from '../../__mocks__/utils'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@theme/ThemeProvider', () => ({
  useTheme: () => ({
    scheme: 'light',
    colors: { bg: '#fff', primary: 'tomato', text: '#111', card: '#fff', border: '#eee', muted: '#999' },
    spacing: (n: number) => n * 4,
    radius: 12,
  }),
}))

const mockLoadProduct = jest.fn()
const mockProductsState: any = {
  selectedProduct: null,
  isLoadingProduct: false,
  productError: null,
  loadProduct: mockLoadProduct,
}

jest.mock('@store/useProductsStore', () => ({
  useProductsStore: (selector: any) =>
    typeof selector === 'function' ? selector(mockProductsState) : mockProductsState,
}))

const mockAddItem = jest.fn()
const mockCartState: any = {
  loadingProductIds: [],
  addItem: mockAddItem,
}

jest.mock('@store/useCartStore', () => ({
  useCartStore: (selector: any) =>
    typeof selector === 'function' ? selector(mockCartState) : mockCartState,
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'prod_001' }),
  router: { push: jest.fn() },
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  mockProductsState.selectedProduct = null
  mockProductsState.isLoadingProduct = false
  mockProductsState.productError = null
  mockProductsState.loadProduct = mockLoadProduct
  mockCartState.loadingProductIds = []
  mockCartState.addItem = mockAddItem
})

import ProductDetailScreen from './[id]'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProductDetailScreen — mount', () => {
  it('calls loadProduct with the route id on mount', () => {
    render(<ProductDetailScreen />)
    expect(mockLoadProduct).toHaveBeenCalledWith('prod_001')
  })
})

describe('ProductDetailScreen — loading', () => {
  it('does not render product content while the product is loading', () => {
    mockProductsState.isLoadingProduct = true
    render(<ProductDetailScreen />)
    expect(screen.queryByText('Add to Cart')).toBeNull()
    expect(screen.queryByText('Out of Stock')).toBeNull()
  })
})

describe('ProductDetailScreen — error state', () => {
  it('shows error message and a retry button when productError is set', () => {
    mockProductsState.productError = 'Not found'
    render(<ProductDetailScreen />)
    expect(screen.getByText('Not found')).toBeTruthy()
    expect(screen.getByText('Retry')).toBeTruthy()
  })

  it('calls loadProduct again when retry is pressed', () => {
    mockProductsState.productError = 'Not found'
    render(<ProductDetailScreen />)
    fireEvent.press(screen.getByText('Retry'))
    expect(mockLoadProduct).toHaveBeenCalledTimes(2)
    expect(mockLoadProduct).toHaveBeenLastCalledWith('prod_001')
  })
})

describe('ProductDetailScreen — product display', () => {
  it('renders name, category, and formatted price', () => {
    mockProductsState.selectedProduct = makeProduct('prod_001', {
      name: 'Sony WH-1000XM5 Headphones',
      category: 'electronics',
      price: 27999,
    })
    render(<ProductDetailScreen />)
    expect(screen.getByText('Sony WH-1000XM5 Headphones')).toBeTruthy()
    expect(screen.getByText('electronics')).toBeTruthy()
    expect(screen.getByText('£279.99')).toBeTruthy()
  })

  it('renders the available stock count and label', () => {
    mockProductsState.selectedProduct = makeProduct('prod_001', {
      stock: { available: 15 },
    })
    render(<ProductDetailScreen />)
    expect(screen.getByText('15')).toBeTruthy()
    expect(screen.getByText('Available')).toBeTruthy()
  })

  it('renders reserved and sold counts when present', () => {
    mockProductsState.selectedProduct = makeProduct('prod_001', {
      stock: { available: 10, reserved: 3, sold: 5 },
    })
    render(<ProductDetailScreen />)
    expect(screen.getByText('Reserved')).toBeTruthy()
    expect(screen.getByText('Sold')).toBeTruthy()
  })
})

describe('ProductDetailScreen — add to cart', () => {
  it('shows "Add to Cart" button for an in-stock product', () => {
    mockProductsState.selectedProduct = makeProduct('prod_001', { stock: { available: 10 } })
    render(<ProductDetailScreen />)
    expect(screen.getByText('Add to Cart')).toBeTruthy()
  })

  it('shows "Out of Stock" label when available stock is 0', () => {
    mockProductsState.selectedProduct = makeProduct('prod_001', { stock: { available: 0 } })
    render(<ProductDetailScreen />)
    expect(screen.getByText('Out of Stock')).toBeTruthy()
  })

  it('calls addItem with the product id when the button is pressed', async () => {
    mockAddItem.mockResolvedValue(undefined)
    mockProductsState.selectedProduct = makeProduct('prod_001', { stock: { available: 10 } })
    render(<ProductDetailScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText('Add to Cart'))
    })
    expect(mockAddItem).toHaveBeenCalledWith('prod_001')
  })

  it('shows "Added to cart!" feedback after a successful add', async () => {
    mockAddItem.mockResolvedValue(undefined)
    mockProductsState.selectedProduct = makeProduct('prod_001', { stock: { available: 10 } })
    render(<ProductDetailScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText('Add to Cart'))
    })
    expect(screen.getByText('Added to cart!')).toBeTruthy()
  })

  it('shows an inline error message when addItem rejects', async () => {
    mockAddItem.mockRejectedValue(new Error('Insufficient stock'))
    mockProductsState.selectedProduct = makeProduct('prod_001', { stock: { available: 10 } })
    render(<ProductDetailScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText('Add to Cart'))
    })
    expect(screen.getByText('Insufficient stock')).toBeTruthy()
  })

  it('navigates to the cart tab when View Cart is pressed', () => {
    const { router } = require('expo-router')
    mockProductsState.selectedProduct = makeProduct('prod_001')
    render(<ProductDetailScreen />)
    fireEvent.press(screen.getByText('View Cart'))
    expect(router.push).toHaveBeenCalledWith('/(tabs)/cart')
  })
})

import { useProductsStore } from '@store/useProductsStore'
import { ApiError } from '@utils/api'

jest.mock('@utils/api', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(mockStatus: number, message: string) {
      super(message)
      this.name = 'ApiError'
      this.status = mockStatus
    }
  },
  getProducts: jest.fn(),
  getProduct: jest.fn(),
}))

import { getProducts as mockGetProducts, getProduct as mockGetProduct } from '@utils/api'

const INITIAL_STATE = {
  products: [],
  selectedProduct: null,
  isLoading: false,
  isLoadingProduct: false,
  error: null,
  productError: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  useProductsStore.setState(INITIAL_STATE)
})

describe('initial state', () => {
  it('has correct defaults', () => {
    const s = useProductsStore.getState()
    expect(s.products).toEqual([])
    expect(s.selectedProduct).toBeNull()
    expect(s.isLoading).toBe(false)
    expect(s.error).toBeNull()
  })
})

describe('loadProducts', () => {
  it('fetches products and stores them', async () => {
    const products = [
      { id: 'prod_001', name: 'Sony Headphones', price: 27999, category: 'electronics', stock: { available: 10 } },
    ]
    ;(mockGetProducts as jest.Mock).mockResolvedValue(products)

    await useProductsStore.getState().loadProducts()

    const s = useProductsStore.getState()
    expect(s.products).toEqual(products)
    expect(s.isLoading).toBe(false)
    expect(s.error).toBeNull()
  })

  it('sets error on API failure', async () => {
    ;(mockGetProducts as jest.Mock).mockRejectedValue(new ApiError(500, 'Server error'))

    await useProductsStore.getState().loadProducts()

    const s = useProductsStore.getState()
    expect(s.isLoading).toBe(false)
    expect(s.error).toBe('Server error')
    expect(s.products).toEqual([])
  })

  it('sets user-friendly error for network failure', async () => {
    ;(mockGetProducts as jest.Mock).mockRejectedValue(new ApiError(0, 'Network error — check your connection'))

    await useProductsStore.getState().loadProducts()

    expect(useProductsStore.getState().error).toBe('Network error — check your connection')
  })

  it('sets isLoading=true during fetch', () => {
    ;(mockGetProducts as jest.Mock).mockReturnValue(new Promise(() => {}))
    useProductsStore.getState().loadProducts()
    expect(useProductsStore.getState().isLoading).toBe(true)
  })
})

describe('loadProduct', () => {
  it('fetches a single product and stores it as selectedProduct', async () => {
    const product = {
      id: 'prod_001',
      name: 'Sony Headphones',
      price: 27999,
      category: 'electronics',
      stock: { available: 10, reserved: 2, sold: 5 },
    }
    ;(mockGetProduct as jest.Mock).mockResolvedValue(product)

    await useProductsStore.getState().loadProduct('prod_001')

    const s = useProductsStore.getState()
    expect(s.selectedProduct).toEqual(product)
    expect(s.isLoadingProduct).toBe(false)
    expect(s.productError).toBeNull()
  })

  it('clears selectedProduct and sets productError on 404', async () => {
    ;(mockGetProduct as jest.Mock).mockRejectedValue(new ApiError(404, 'Not Found'))

    await useProductsStore.getState().loadProduct('bad-id')

    const s = useProductsStore.getState()
    expect(s.selectedProduct).toBeNull()
    expect(s.productError).toBe('Not found')
    expect(s.isLoadingProduct).toBe(false)
  })

  it('sets isLoadingProduct=true during fetch', () => {
    ;(mockGetProduct as jest.Mock).mockReturnValue(new Promise(() => {}))
    useProductsStore.getState().loadProduct('prod_001')
    expect(useProductsStore.getState().isLoadingProduct).toBe(true)
  })

  it('clears selectedProduct at start of each load', async () => {
    useProductsStore.setState({
      selectedProduct: { id: 'old', name: 'Old', price: 0, category: '', stock: { available: 0 } },
    })
    ;(mockGetProduct as jest.Mock).mockReturnValue(new Promise(() => {}))
    useProductsStore.getState().loadProduct('new-id')
    expect(useProductsStore.getState().selectedProduct).toBeNull()
  })
})

describe('clearError', () => {
  it('clears both error and productError', () => {
    useProductsStore.setState({ error: 'some error', productError: 'product error' })
    useProductsStore.getState().clearError()
    const s = useProductsStore.getState()
    expect(s.error).toBeNull()
    expect(s.productError).toBeNull()
  })
})

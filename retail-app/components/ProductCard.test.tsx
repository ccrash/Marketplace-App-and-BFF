import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'

jest.mock('@theme/ThemeProvider', () => ({
  useTheme: () => ({
    scheme: 'light',
    colors: { card: '#fff', border: '#eee', primary: 'tomato', text: '#111', muted: '#999', bg: '#fafafa' },
    spacing: (n: number) => n * 4,
    radius: 12,
  }),
}))

const makeProduct = (overrides = {}) => ({
  id: 'prod_001',
  name: 'Sony WH-1000XM5 Headphones',
  price: 27999,
  category: 'electronics',
  stock: { available: 15 },
  ...overrides,
})

import ProductCard from '@components/ProductCard'

describe('ProductCard', () => {
  it('renders the product name', () => {
    render(<ProductCard product={makeProduct()} onPress={jest.fn()} />)
    expect(screen.getByText('Sony WH-1000XM5 Headphones')).toBeTruthy()
  })

  it('renders the formatted price', () => {
    render(<ProductCard product={makeProduct()} onPress={jest.fn()} />)
    expect(screen.getByText('£279.99')).toBeTruthy()
  })

  it('renders the category', () => {
    render(<ProductCard product={makeProduct()} onPress={jest.fn()} />)
    expect(screen.getByText('electronics')).toBeTruthy()
  })

  it('shows available stock count when in stock', () => {
    render(<ProductCard product={makeProduct({ stock: { available: 15 } })} onPress={jest.fn()} />)
    expect(screen.getByText('15 left')).toBeTruthy()
  })

  it('shows "Out of stock" when available is 0', () => {
    render(<ProductCard product={makeProduct({ stock: { available: 0 } })} onPress={jest.fn()} />)
    expect(screen.getByText('Out of stock')).toBeTruthy()
  })

  it('calls onPress with the product when pressed', () => {
    const product = makeProduct()
    const onPress = jest.fn()
    render(<ProductCard product={product} onPress={onPress} />)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledWith(product)
  })

  it('has a descriptive accessibilityLabel', () => {
    const product = makeProduct()
    render(<ProductCard product={product} onPress={jest.fn()} />)
    expect(
      screen.getByLabelText('Sony WH-1000XM5 Headphones, £279.99'),
    ).toBeTruthy()
  })
})

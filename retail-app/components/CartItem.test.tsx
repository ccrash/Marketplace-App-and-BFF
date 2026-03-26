import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Image, ActivityIndicator } from 'react-native'
import { makeCartItem } from '../__mocks__/utils'

jest.mock('@theme/ThemeProvider', () => ({
  useTheme: () => ({
    scheme: 'light',
    colors: {
      text: '#111',
      card: '#fff',
      border: '#eee',
      primary: 'tomato',
      error: '#e00',
      bg: '#fafafa',
      muted: '#999',
    },
    spacing: (n: number) => n * 4,
    radius: 12,
  }),
}))

jest.mock('@utils/format', () => ({
  formatPrice: (pence: number) => `£${(pence / 100).toFixed(2)}`,
}))

import CartItem from '@components/CartItem'

const baseProps = {
  item: makeCartItem('prod_001', { productName: 'Test Headphones', quantity: 2, lineTotal: 5998 }),
  isLoading: false,
  onIncrease: jest.fn(),
  onDecrease: jest.fn(),
  onRemove: jest.fn(),
}

beforeEach(() => jest.clearAllMocks())

describe('CartItem', () => {
  describe('rendering', () => {
    it('renders the product name', () => {
      render(<CartItem {...baseProps} />)
      expect(screen.getByText('Test Headphones')).toBeTruthy()
    })

    it('renders the formatted line total', () => {
      render(<CartItem {...baseProps} />)
      expect(screen.getByText('£59.98')).toBeTruthy()
    })

    it('renders the current quantity', () => {
      render(<CartItem {...baseProps} />)
      expect(screen.getByText('2')).toBeTruthy()
    })

    it('renders fallback icon when no imageUrl is provided', () => {
      render(<CartItem {...baseProps} />)
      expect(screen.getByText('cube-outline')).toBeTruthy()
    })

    it('renders an Image when imageUrl is provided', () => {
      const { UNSAFE_getByType } = render(<CartItem {...baseProps} imageUrl="/images/headphones.jpg" />)
      const image = UNSAFE_getByType(Image)
      expect(image.props.source.uri).toBe('http://localhost:3000/images/headphones.jpg')
    })
  })

  describe('quantity controls', () => {
    it('calls onIncrease with the productId when increase is pressed', () => {
      render(<CartItem {...baseProps} />)
      fireEvent.press(screen.getByLabelText('Increase quantity'))
      expect(baseProps.onIncrease).toHaveBeenCalledWith('prod_001')
      expect(baseProps.onIncrease).toHaveBeenCalledTimes(1)
    })

    it('calls onDecrease with the productId when decrease is pressed', () => {
      render(<CartItem {...baseProps} />)
      fireEvent.press(screen.getByLabelText('Decrease quantity'))
      expect(baseProps.onDecrease).toHaveBeenCalledWith('prod_001')
      expect(baseProps.onDecrease).toHaveBeenCalledTimes(1)
    })

    it('disables the decrease button when quantity is 1', () => {
      const item = makeCartItem('prod_001', { quantity: 1 })
      render(<CartItem {...baseProps} item={item} />)
      const decreaseBtn = screen.getByLabelText('Decrease quantity')
      expect(decreaseBtn.props.accessibilityState?.disabled).toBe(true)
    })

    it('does not disable the decrease button when quantity is greater than 1', () => {
      render(<CartItem {...baseProps} />)
      const decreaseBtn = screen.getByLabelText('Decrease quantity')
      expect(decreaseBtn.props.accessibilityState?.disabled).toBeFalsy()
    })
  })

  describe('remove', () => {
    it('calls onRemove with the productId when trash is pressed', () => {
      render(<CartItem {...baseProps} />)
      fireEvent.press(screen.getByLabelText('Remove Test Headphones'))
      expect(baseProps.onRemove).toHaveBeenCalledWith('prod_001')
      expect(baseProps.onRemove).toHaveBeenCalledTimes(1)
    })
  })

  describe('loading state', () => {
    it('shows an ActivityIndicator instead of quantity when loading', () => {
      const { UNSAFE_getByType } = render(<CartItem {...baseProps} isLoading />)
      expect(screen.queryByText('2')).toBeNull()
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
    })

    it('disables the increase button when loading', () => {
      render(<CartItem {...baseProps} isLoading />)
      const increaseBtn = screen.getByLabelText('Increase quantity')
      expect(increaseBtn.props.accessibilityState?.disabled).toBe(true)
    })

    it('disables the decrease button when loading', () => {
      render(<CartItem {...baseProps} isLoading />)
      const decreaseBtn = screen.getByLabelText('Decrease quantity')
      expect(decreaseBtn.props.accessibilityState?.disabled).toBe(true)
    })

    it('disables the remove button when loading', () => {
      render(<CartItem {...baseProps} isLoading />)
      const removeBtn = screen.getByLabelText('Remove Test Headphones')
      expect(removeBtn.props.accessibilityState?.disabled).toBe(true)
    })
  })
})

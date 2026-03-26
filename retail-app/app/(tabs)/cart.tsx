import { useEffect, useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { useCartStore } from '@store/useCartStore'
import { useProductsStore } from '@store/useProductsStore'
import { useTheme } from '@theme/ThemeProvider'
import type { AppTheme } from '@theme/tokens'
import { ERROR_COLOR } from '@theme/tokens'
import CartItemComponent from '@components/CartItem'
import EmptyState from '@components/EmptyState'
import { formatPrice } from '@utils/format'
import type { CartItem } from '@/types/cart'

export { ScreenErrorBoundary as ErrorBoundary } from '@components/ScreenErrorBoundary'

export default function CartScreen() {
  const products = useProductsStore((s) => s.products)
  const cartId = useCartStore((s) => s.cartId)
  const cart = useCartStore((s) => s.cart)
  const isLoading = useCartStore((s) => s.isLoading)
  const loadingProductIds = useCartStore((s) => s.loadingProductIds)
  const error = useCartStore((s) => s.error)
  const loadCart = useCartStore((s) => s.loadCart)
  const updateItem = useCartStore((s) => s.updateItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearError = useCartStore((s) => s.clearError)

  const theme = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])

  useEffect(() => {
    if (cartId) loadCart()
  }, [cartId, loadCart])

  const onIncrease = useCallback(
    (productId: string) => {
      const item = cart?.items.find((i) => i.productId === productId)
      if (item) updateItem(productId, item.quantity + 1)
    },
    [cart, updateItem],
  )

  const onDecrease = useCallback(
    (productId: string) => {
      const item = cart?.items.find((i) => i.productId === productId)
      if (!item) return
      if (item.quantity <= 1) {
        removeItem(productId)
      } else {
        updateItem(productId, item.quantity - 1)
      }
    },
    [cart, updateItem, removeItem],
  )

  const onRemove = useCallback(
    (productId: string) => removeItem(productId),
    [removeItem],
  )

  const onCheckout = useCallback(() => {
    router.push('/checkout')
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <CartItemComponent
        item={item}
        imageUrl={products.find((p) => p.id === item.productId)?.imageUrl}
        isLoading={loadingProductIds.includes(item.productId)}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
        onRemove={onRemove}
      />
    ),
    [loadingProductIds, onIncrease, onDecrease, onRemove],
  )

  const items = cart?.items ?? []
  const hasItems = items.length > 0

  if (isLoading && !cart) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {error && (
        <Pressable onPress={clearError} style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorDismiss}>✕</Text>
        </Pressable>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, !hasItems && styles.listEmpty]}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            subtitle="Browse products and add something!"
          />
        }
        ListFooterComponent={hasItems ? (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(cart!.subtotal)}</Text>
            </View>

            {cart!.appliedDiscounts.length > 0 && (
              <>
                {cart!.appliedDiscounts.map((d) => (
                  <View key={d.discountId} style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.discountLabel]}>
                      {d.code}
                    </Text>
                    <Text style={styles.discountValue}>
                      −{formatPrice(d.savingAmount)}
                    </Text>
                  </View>
                ))}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount total</Text>
                  <Text style={styles.discountValue}>
                    −{formatPrice(cart!.discountTotal)}
                  </Text>
                </View>
              </>
            )}

            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatPrice(cart!.grandTotal)}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.checkoutBtn, pressed && { opacity: 0.8 }]}
              onPress={onCheckout}
              accessibilityRole="button"
              accessibilityLabel="Proceed to checkout"
            >
              <Text style={styles.checkoutText}>Checkout</Text>
            </Pressable>
          </View>
        ) : null}
      />
    </View>
  )
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: { flex: 1 },
    list: { paddingTop: t.spacing(4), paddingBottom: t.spacing(4) },
    listEmpty: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorBanner: {
      backgroundColor: '#fef2f2',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: t.spacing(4),
      paddingVertical: t.spacing(3),
      borderBottomWidth: 1,
      borderBottomColor: '#fecaca',
    },
    errorText: { flex: 1, color: ERROR_COLOR, fontSize: 14 },
    errorDismiss: { color: ERROR_COLOR, fontSize: 16, paddingLeft: t.spacing(2) },
    summary: {
      margin: t.spacing(4),
      padding: t.spacing(4),
      backgroundColor: t.colors.card,
      borderRadius: t.radius,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: t.spacing(2),
    },
    summaryLabel: { fontSize: 14, color: t.colors.muted },
    summaryValue: { fontSize: 14, color: t.colors.text },
    discountLabel: { color: '#16a34a' },
    discountValue: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
    grandTotalRow: {
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      paddingTop: t.spacing(3),
      marginTop: t.spacing(2),
      marginBottom: t.spacing(4),
    },
    grandTotalLabel: { fontSize: 16, fontWeight: '700', color: t.colors.text },
    grandTotalValue: { fontSize: 18, fontWeight: '700', color: t.colors.primary },
    checkoutBtn: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius,
      paddingVertical: t.spacing(4),
      alignItems: 'center',
    },
    checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  })

import { useEffect, useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native'
import { router } from 'expo-router'
import { useProductsStore } from '@store/useProductsStore'
import { useTheme } from '@theme/ThemeProvider'
import type { AppTheme } from '@theme/tokens'
import { ERROR_COLOR } from '@theme/tokens'
import ProductCard from '@components/ProductCard'
import EmptyState from '@components/EmptyState'
import type { Product } from '@/types/product'

export { ScreenErrorBoundary as ErrorBoundary } from '@components/screenErrorBoundary'

export default function ProductsScreen() {
  const products = useProductsStore((s) => s.products)
  const isLoading = useProductsStore((s) => s.isLoading)
  const error = useProductsStore((s) => s.error)
  const loadProducts = useProductsStore((s) => s.loadProducts)

  const theme = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    if (!isLoading) setIsRefreshing(false)
  }, [isLoading])

  const onRefresh = useCallback(() => {
    setIsRefreshing(true)
    loadProducts()
  }, [loadProducts])

  const onPressProduct = useCallback((product: Product) => {
    router.push(`/product/${product.id}`)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard product={item} onPress={onPressProduct} />
    ),
    [onPressProduct],
  )

  if (isLoading && products.length === 0 && !isRefreshing) {
    return (
      <View testID="activity-indicator-loading-wrapper" style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    )
  }

  if (error && products.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={loadProducts}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={2}
      contentContainerStyle={[styles.list, products.length === 0 && styles.listEmpty]}
      style={{ backgroundColor: theme.colors.bg }}
      ListEmptyComponent={
        <EmptyState icon="storefront-outline" title="No products available" />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
          progressBackgroundColor={theme.colors.card}
        />
      }
    />
  )
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    list: { paddingTop: t.spacing(2), paddingBottom: t.spacing(8), paddingHorizontal: t.spacing(2) },
    listEmpty: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    error: { color: ERROR_COLOR, fontSize: 15, textAlign: 'center', marginBottom: 16 },
    retryBtn: {
      paddingVertical: t.spacing(3),
      paddingHorizontal: t.spacing(6),
      backgroundColor: t.colors.primary,
      borderRadius: t.radius,
    },
    retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  })

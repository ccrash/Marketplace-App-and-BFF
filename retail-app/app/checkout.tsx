import { useEffect, useState, useMemo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCartStore } from '@store/useCartStore'
import { useTheme } from '@theme/ThemeProvider'
import type { AppTheme } from '@theme/tokens'
import { ERROR_COLOR } from '@theme/tokens'
import { formatPrice, formatError } from '@utils/format'
import type { OrderSummary } from '@/types/order'

type ScreenState =
  | { status: 'loading' }
  | { status: 'success'; order: OrderSummary }
  | { status: 'error'; message: string }

export default function CheckoutScreen() {
  const checkout = useCartStore((s) => s.checkout)

  const theme = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])

  const [state, setState] = useState<ScreenState>({ status: 'loading' })

  useEffect(() => {
    checkout()
      .then((order) => setState({ status: 'success', order }))
      .catch((err) => setState({ status: 'error', message: formatError(err) }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  if (state.status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
          Processing your order…
        </Text>
      </View>
    )
  }

  if (state.status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <Ionicons name="close-circle" size={64} color={ERROR_COLOR} />
        <Text style={styles.errorTitle}>Order failed</Text>
        <Text style={styles.errorMessage}>{state.message}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Back to Cart</Text>
        </Pressable>
      </View>
    )
  }

  const { order } = state

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.bg }}
      contentContainerStyle={styles.container}
    >
      {/* Success header */}
      <View style={styles.successHeader}>
        <Ionicons name="checkmark-circle" size={72} color="#16a34a" />
        <Text style={styles.successTitle}>Order placed!</Text>
        <Text style={[styles.orderId, { color: theme.colors.muted }]}>
          Order #{order.orderId.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items ordered</Text>
        {order.items.map((item) => (
          <View key={item.productId} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={[styles.itemQty, { color: theme.colors.muted }]}>
                x{item.quantity} @ {formatPrice(item.unitPrice)}
              </Text>
            </View>
            <Text style={styles.itemTotal}>{formatPrice(item.lineTotal)}</Text>
          </View>
        ))}
      </View>

      {/* Pricing breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.muted }]}>Subtotal</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {formatPrice(order.subtotal)}
          </Text>
        </View>

        {order.appliedDiscounts.map((d) => (
          <View key={d.discountId} style={styles.summaryRow}>
            <Text style={styles.discountLabel}>{d.code} — {d.description}</Text>
            <Text style={styles.discountValue}>−{formatPrice(d.savingAmount)}</Text>
          </View>
        ))}

        {order.discountTotal > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.muted }]}>Savings</Text>
            <Text style={styles.discountValue}>−{formatPrice(order.discountTotal)}</Text>
          </View>
        )}

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total paid</Text>
          <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
            {formatPrice(order.totalPaid)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.muted }]}>Payment</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {order.paymentStatus}
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}
        onPress={() => router.replace('/(tabs)')}
        accessibilityRole="button"
      >
        <Text style={styles.primaryBtnText}>Continue Shopping</Text>
      </Pressable>
    </ScrollView>
  )
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: { padding: t.spacing(5), paddingBottom: t.spacing(12) },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: t.spacing(6),
    },
    loadingText: { marginTop: t.spacing(4), fontSize: 15 },
    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: ERROR_COLOR,
      marginTop: t.spacing(4),
      marginBottom: t.spacing(2),
    },
    errorMessage: {
      fontSize: 15,
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: t.spacing(6),
    },
    successHeader: { alignItems: 'center', marginBottom: t.spacing(8) },
    successTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: '#16a34a',
      marginTop: t.spacing(3),
    },
    orderId: { fontSize: 13, marginTop: t.spacing(1) },
    section: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius,
      padding: t.spacing(4),
      marginBottom: t.spacing(4),
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: t.colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: t.spacing(3),
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: t.spacing(2),
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    itemInfo: { flex: 1, marginRight: t.spacing(3) },
    itemName: { fontSize: 14, fontWeight: '600', color: t.colors.text },
    itemQty: { fontSize: 12, marginTop: 2 },
    itemTotal: { fontSize: 14, fontWeight: '600', color: t.colors.text },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: t.spacing(2),
    },
    summaryLabel: { fontSize: 14 },
    summaryValue: { fontSize: 14 },
    discountLabel: { fontSize: 13, color: '#16a34a', flex: 1 },
    discountValue: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      paddingTop: t.spacing(3),
      marginTop: t.spacing(2),
      marginBottom: t.spacing(3),
    },
    totalLabel: { fontSize: 16, fontWeight: '700', color: t.colors.text },
    totalValue: { fontSize: 18, fontWeight: '800' },
    primaryBtn: {
      backgroundColor: t.colors.primary,
      borderRadius: t.radius,
      paddingVertical: t.spacing(4),
      alignItems: 'center',
      marginTop: t.spacing(2),
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  })

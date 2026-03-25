import { memo } from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@theme/ThemeProvider'
import type { AppTheme } from '@theme/tokens'
import { formatPrice } from '@utils/format'
import type { CartItem as CartItemType } from '@/types/cart'

type Props = {
  item: CartItemType
  isLoading: boolean
  onIncrease: (productId: string) => void
  onDecrease: (productId: string) => void
  onRemove: (productId: string) => void
}

function CartItem({ item, isLoading, onIncrease, onDecrease, onRemove }: Props) {
  const theme = useTheme()
  const styles = makeStyles(theme)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>{item.productName}</Text>
        <Pressable
          onPress={() => onRemove(item.productId)}
          disabled={isLoading}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.productName}`}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.qtyRow}>
          <Pressable
            onPress={() => onDecrease(item.productId)}
            disabled={isLoading || item.quantity <= 1}
            hitSlop={8}
            style={[styles.qtyBtn, (isLoading || item.quantity <= 1) && styles.qtyBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
          >
            <Ionicons name="remove" size={18} color={theme.colors.text} />
          </Pressable>

          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={styles.qtyNum} />
          ) : (
            <Text style={styles.qtyNum}>{item.quantity}</Text>
          )}

          <Pressable
            onPress={() => onIncrease(item.productId)}
            disabled={isLoading}
            hitSlop={8}
            style={[styles.qtyBtn, isLoading && styles.qtyBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
          >
            <Ionicons name="add" size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.priceCol}>
          <Text style={styles.unitPrice}>{formatPrice(item.unitPrice)} each</Text>
          <Text style={styles.lineTotal}>{formatPrice(item.lineTotal)}</Text>
        </View>
      </View>
    </View>
  )
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius,
      padding: t.spacing(4),
      marginHorizontal: t.spacing(4),
      marginBottom: t.spacing(3),
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: t.spacing(3),
    },
    name: { flex: 1, fontSize: 15, fontWeight: '600', color: t.colors.text, marginRight: t.spacing(2) },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(2) },
    qtyBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnDisabled: { opacity: 0.4 },
    qtyNum: { fontSize: 16, fontWeight: '600', color: t.colors.text, minWidth: 28, textAlign: 'center' },
    priceCol: { alignItems: 'flex-end' },
    unitPrice: { fontSize: 12, color: t.colors.muted },
    lineTotal: { fontSize: 16, fontWeight: '700', color: t.colors.primary },
  })

export default memo(CartItem)

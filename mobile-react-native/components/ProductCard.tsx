import { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@theme/ThemeProvider'
import type { AppTheme } from '@theme/tokens'
import { formatPrice } from '@utils/format'
import type { Product } from '@/types/product'

type Props = {
  product: Product
  onPress: (product: Product) => void
}

function ProductCard({ product, onPress }: Props) {
  const theme = useTheme()
  const styles = makeStyles(theme)
  const outOfStock = product.stock.available === 0

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.price)}`}
    >
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="cube-outline" size={28} color={theme.colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.category}>{product.category}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <Text style={[styles.stock, outOfStock && styles.stockOut]}>
            {outOfStock ? 'Out of stock' : `${product.stock.available} left`}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius,
      padding: t.spacing(4),
      marginHorizontal: t.spacing(4),
      marginBottom: t.spacing(3),
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    pressed: { opacity: 0.7 },
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing(3) },
    icon: {
      width: 44,
      height: 44,
      borderRadius: t.radius,
      backgroundColor: t.colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: '600', color: t.colors.text, marginBottom: 2 },
    category: { fontSize: 12, color: t.colors.muted, textTransform: 'capitalize' },
    right: { alignItems: 'flex-end' },
    price: { fontSize: 16, fontWeight: '700', color: t.colors.primary },
    stock: { fontSize: 12, color: t.colors.muted, marginTop: 2 },
    stockOut: { color: '#ef4444' },
  })

export default memo(ProductCard)

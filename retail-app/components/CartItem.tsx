import { memo } from 'react'
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@theme/ThemeProvider'
import type { AppTheme } from '@theme/tokens'
import { formatPrice } from '@utils/format'
import type { CartItem as CartItemType } from '@/types/cart'

const BASE_URL = process.env.EXPO_PUBLIC_BFF_URL ?? 'http://localhost:3000'

type Props = {
  item: CartItemType
  imageUrl?: string
  isLoading: boolean
  onIncrease: (productId: string) => void
  onDecrease: (productId: string) => void
  onRemove: (productId: string) => void
}

function CartItem({ item, imageUrl, isLoading, onIncrease, onDecrease, onRemove }: Props) {
  const theme = useTheme()
  const styles = makeStyles(theme)

  return (
    <View style={styles.container}>
      {/* Left: product image */}
      <View style={styles.imageBox}>
        {imageUrl ? (
          <Image
            source={{ uri: `${BASE_URL}${imageUrl}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="cube-outline" size={28} color={theme.colors.primary} />
        )}
      </View>

      {/* Right: content */}
      <View style={styles.content}>
        {/* Row 1: title */}
        <Text style={styles.name} numberOfLines={1}>{item.productName}</Text>

        {/* Row 2: qty controls + trash */}
        <View style={styles.controls}>
          <View style={styles.qtyRow}>
            <Pressable
              onPress={() => onDecrease(item.productId)}
              disabled={isLoading || item.quantity <= 1}
              hitSlop={8}
              style={[styles.qtyBtn, (isLoading || item.quantity <= 1) && styles.qtyBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons name="remove" size={16} color={theme.colors.text} />
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
              <Ionicons name="add" size={16} color={theme.colors.text} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => onRemove(item.productId)}
            disabled={isLoading}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.productName}`}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
          </Pressable>
        </View>

        {/* Row 3: price (right-aligned) */}
        <Text style={styles.price}>{formatPrice(item.lineTotal)}</Text>
      </View>
    </View>
  )
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: t.colors.card,
      borderRadius: t.radius,
      marginHorizontal: t.spacing(4),
      marginBottom: t.spacing(3),
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden',
    },
    imageBox: {
      width: 135,
      height: 135,
      backgroundColor: t.colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: 135,
      height: 135,
    },
    content: {
      flex: 1,
      padding: t.spacing(3),
      justifyContent: 'space-between',
    },
    name: {
      fontSize: 14,
      fontWeight: '600',
      color: t.colors.text,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    qtyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing(2),
    },
    qtyBtn: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnDisabled: { opacity: 0.4 },
    qtyNum: {
      fontSize: 14,
      fontWeight: '600',
      color: t.colors.text,
      minWidth: 20,
      textAlign: 'center',
    },
    price: {
      fontSize: 15,
      fontWeight: '700',
      color: t.colors.primary,
      textAlign: 'right',
    },
  })

export default memo(CartItem)

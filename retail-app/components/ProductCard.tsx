import { memo } from 'react'
import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@theme/ThemeProvider'
import type { AppTheme } from '@theme/tokens'
import { formatPrice } from '@utils/format'
import type { Product } from '@/types/product'

const BASE_URL = process.env.EXPO_PUBLIC_BFF_URL ?? 'http://localhost:3000'

type Props = {
  product: Product
  onPress: (product: Product) => void
}

function ProductCard({ product, onPress }: Props) {
  const theme = useTheme()
  const styles = makeStyles(theme)

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatPrice(product.price)}`}
    >
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image
            source={{ uri: `${BASE_URL}${product.imageUrl}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={40} color={theme.colors.primary} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <View style={styles.footer}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>
        {product.stock.available === 0 ? (
          <Text style={styles.outOfStock}>Out of stock</Text>
        ) : (
          <Text style={styles.stock}>{product.stock.available} left</Text>
        )}
      </View>
    </Pressable>
  )
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: t.colors.card,
      borderRadius: t.radius,
      margin: t.spacing(2),
      borderWidth: 1,
      borderColor: t.colors.border,
      overflow: 'hidden',
    },
    pressed: { opacity: 0.7 },
    imageContainer: {
      width: '100%',
      height: 160,
      backgroundColor: t.colors.bg,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      padding: t.spacing(3),
      gap: t.spacing(1),
    },
    name: {
      fontSize: 15,
      fontWeight: '600',
      color: t.colors.text,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    category: {
      fontSize: 12,
      color: t.colors.muted,
      textTransform: 'capitalize',
    },
    price: {
      fontSize: 15,
      fontWeight: '700',
      color: t.colors.primary,
    },
    stock: {
      fontSize: 12,
      color: t.colors.muted,
    },
    outOfStock: {
      fontSize: 12,
      color: t.colors.error,
    },
  })

export default memo(ProductCard)

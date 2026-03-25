import { Tabs } from 'expo-router'
import { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { HapticTab } from '@components/haptic-tab'
import { useTheme } from '@theme/ThemeProvider'
import HeaderLogo from '@components/header/logo'
import HeaderTitle from '@components/header/title'
import HeaderThemeSwitch from '@components/header/themeSwitch'
import { useCartStore } from '@store/useCartStore'

export default function TabLayout() {
  const theme = useTheme()

  const cartId = useCartStore((s) => s.cartId)
  const loadCart = useCartStore((s) => s.loadCart)

  // Hydrate cart on first mount if we have a persisted cartId
  useEffect(() => {
    if (cartId) loadCart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cartItemCount = useCartStore((s) =>
    s.cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
  )

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarButton: HapticTab,
        headerStyle: { backgroundColor: theme.colors.card },
        headerLeft: () => <HeaderLogo />,
        headerTitle: () => <HeaderTitle />,
        headerRight: () => <HeaderThemeSwitch />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => (
            <Ionicons name="storefront-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

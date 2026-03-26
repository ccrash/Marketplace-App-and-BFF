import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context'
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import 'react-native-reanimated'
import { ThemeProvider } from '@theme/ThemeProvider'
import ThemedStatusBar from '@components/ThemedStatusBar'
import { RootErrorBoundary } from '@components/RootErrorBoundary'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          {(navTheme) => (
            <NavThemeProvider value={navTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: '' }} />
                <Stack.Screen
                  name="product/[id]"
                  options={{ title: 'Product Details', headerBackButtonDisplayMode: 'minimal' }}
                />
                <Stack.Screen
                  name="checkout"
                  options={{ title: 'Order Confirmation', headerBackButtonDisplayMode: 'minimal' }}
                />
              </Stack>
              <ThemedStatusBar />
            </NavThemeProvider>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  )
}

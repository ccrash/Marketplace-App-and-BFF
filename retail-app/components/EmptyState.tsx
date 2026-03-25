import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@theme/ThemeProvider'

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name']
  title: string
  subtitle?: string
}

export default function EmptyState({ icon, title, subtitle }: Props) {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={theme.colors.muted} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: theme.colors.muted }]}>{subtitle}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  title: { fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
})

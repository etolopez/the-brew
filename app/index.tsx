import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCoffee } from '@/context/CoffeeContext';

export default function Index() {
  const colors = useColors();
  const { hydrated, state } = useCoffee();
  if (hydrated && !state.profile.username.trim()) return <Redirect href="/setup" />;
  if (hydrated) return <Redirect href="/(tabs)" />;
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.mark, { color: colors.coffeeDeep }]}>brew</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>your next cup, considered</Text>
      <ActivityIndicator color={colors.blue} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { fontSize: 52, fontWeight: '700', letterSpacing: -3 },
  sub: { fontSize: 14, marginTop: 4 },
});
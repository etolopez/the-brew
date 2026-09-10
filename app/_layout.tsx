import React, { useEffect } from 'react';
import { StatusBar as NativeStatusBar, StyleSheet, useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { CoffeeProvider, useCoffee } from '@/context/CoffeeContext';
import { LocaleProvider, useLocale } from '@/context/LocaleContext';
import { useColors } from '@/hooks/useColors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { t } = useLocale();
  const { hydrated, state } = useCoffee();
  const router = useRouter();
  const segments = useSegments();
  const hasName = state.profile.username.trim().length > 0;
  const hasCoffee = state.coffees.length > 0;
  const isSetupRoute = segments[0] === 'setup';
  const isBrewRoute = segments[0] === 'brew';

  useEffect(() => {
    if (!hydrated) return;
    if (!hasName && !isSetupRoute) {
      router.replace('/setup');
    } else if (hasName && !hasCoffee && isBrewRoute) {
      router.replace('/(tabs)');
    }
  }, [hasCoffee, hasName, hydrated, isBrewRoute, isSetupRoute, router]);

  if (!hydrated || (!hasName && !isSetupRoute) || (hasName && !hasCoffee && isBrewRoute)) return null;

  return (
    <Stack screenOptions={{ headerBackTitle: t('back') }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="setup" options={{ headerShown: false }} />
      <Stack.Screen name="coffee/new" options={{ headerShown: false }} />
      <Stack.Screen name="brew/setup" options={{ headerShown: false }} />
      <Stack.Screen name="brew/timer" options={{ headerShown: false }} />
      <Stack.Screen name="brew/feedback" options={{ headerShown: false }} />
      <Stack.Screen name="recipe/new" options={{ headerShown: false }} />
      <Stack.Screen name="recipe/share" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="compliance" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NativeStatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} translucent={false} />
      <SafeAreaProvider>
        <LocaleProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <CoffeeProvider>
                <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background }]}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </CoffeeProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </LocaleProvider>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

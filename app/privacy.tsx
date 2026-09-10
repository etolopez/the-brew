import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, ScreenTitle } from '@/components/CoffeeUI';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/context/LocaleContext';
import { router } from 'expo-router';

export default function PrivacyScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const sections = [
    ['privacyDataTitle', 'privacyDataBody'],
    ['privacySharingTitle', 'privacySharingBody'],
    ['privacyCameraTitle', 'privacyCameraBody'],
    ['privacyStorageTitle', 'privacyStorageBody'],
    ['privacyChoicesTitle', 'privacyChoicesBody'],
    ['privacyContactTitle', 'privacyContactBody'],
  ] as const;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: insets.bottom + 42, paddingHorizontal: 22 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle
          eyebrow={t('privacyEyebrow')}
          title={t('privacyTitle')}
          subtitle={t('privacySubtitle')}
          action={<IconButton icon="x" label={t('close')} onPress={() => router.back()} />}
        />
        <Text style={[styles.updated, { color: colors.mutedForeground }]}>{t('privacyUpdated')}</Text>
        <Text style={[styles.intro, { color: colors.foreground }]}>{t('privacyIntro')}</Text>
        {sections.map(([title, body]) => (
          <View key={title} style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t(title)}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>{t(body)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  updated: { fontSize: 12, marginTop: 24 },
  intro: { fontSize: 15, lineHeight: 23, marginTop: 18 },
  section: { borderTopWidth: 1, paddingTop: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22 },
});
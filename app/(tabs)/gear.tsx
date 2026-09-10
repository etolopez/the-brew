import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChoicePill, Field, IconButton, PrimaryButton, ScreenTitle, SectionLabel } from '@/components/CoffeeUI';
import { GRINDERS, METHODS, getCompatibleFilters, getDefaultFilter, resolveFilterForMethod, translateFilterName, translateGrinder, translateMethod, useCoffee } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/context/LocaleContext';

export default function GearScreen() {
  const colors = useColors();
  const { t, locale, setLocale } = useLocale();
  const insets = useSafeAreaInsets();
  const { state, updateProfile } = useCoffee();
  const [grinder, setGrinder] = useState(state.profile.grinder);
  const [username, setUsername] = useState(state.profile.username);
  const [methods, setMethods] = useState(state.profile.methods);
  const [filters, setFilters] = useState(state.profile.filters);
  const [saved, setSaved] = useState(false);

  const toggle = (method: string) =>
    setMethods((current) => (current.includes(method) ? current.filter((item) => item !== method) : [...current, method]));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: insets.bottom + 108, paddingHorizontal: 22 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle
          eyebrow={t('gearEyebrow')}
          title={t('gearTitle')}
          subtitle={t('gearSubtitle')}
          action={<IconButton icon="x" label={t('close')} onPress={() => router.back()} />}
        />
        <View style={styles.section}>
          <SectionLabel>{t('gearName')}</SectionLabel>
          <Field label={t('gearNameLabel')} value={username} onChangeText={setUsername} maxLength={32} autoCapitalize="words" />
        </View>
        <View style={styles.section}>
          <SectionLabel>{t('gearLanguage')}</SectionLabel>
          <View style={styles.wrap}>
            <ChoicePill label="English" selected={locale === 'en'} onPress={() => setLocale('en')} />
            <ChoicePill label="Español" selected={locale === 'es'} onPress={() => setLocale('es')} />
          </View>
        </View>
        <View style={styles.section}>
          <SectionLabel>{t('gearLegal')}</SectionLabel>
          <View style={styles.legalLinks}>
            <Pressable onPress={() => router.push('/privacy')}>
              <Text style={[styles.legalLink, { color: colors.blue }]}>{t('gearPrivacy')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/compliance')}>
              <Text style={[styles.legalLink, { color: colors.blue }]}>{t('gearCompliance')}</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.section}>
          <SectionLabel>{t('gearGrinder')}</SectionLabel>
          <View style={styles.wrap}>
            {GRINDERS.map((item) => <ChoicePill key={item} label={translateGrinder(item, t)} selected={grinder === item} onPress={() => setGrinder(item)} />)}
          </View>
        </View>
        <View style={styles.section}>
          <SectionLabel>{t('gearBrewers')}</SectionLabel>
          <View style={styles.wrap}>
            {METHODS.map((item) => <ChoicePill key={item} label={translateMethod(item, t)} selected={methods.includes(item)} onPress={() => toggle(item)} />)}
          </View>
        </View>
        <View style={styles.section}>
          <SectionLabel>{t('gearFilters')}</SectionLabel>
          {methods.map((method) => (
            <View key={method} style={styles.filterRow}>
              <Text style={[styles.method, { color: colors.foreground }]}>{translateMethod(method, t)}</Text>
              <View style={styles.filterChoices}>
                {getCompatibleFilters(method).map((filter) => (
                  <ChoicePill key={filter} label={translateFilterName(filter, t)} selected={(filters[method] ?? getDefaultFilter(method)) === filter} onPress={() => setFilters((current) => ({ ...current, [method]: filter }))} />
                ))}
              </View>
            </View>
          ))}
        </View>
        <PrimaryButton
          label={saved ? t('gearSaved') : t('gearSave')}
          icon={saved ? 'check' : 'save'}
          onPress={() => {
            const selectedMethods = methods.length ? methods : ['V60'];
            const normalizedFilters = Object.fromEntries(selectedMethods.map((method) => [method, resolveFilterForMethod(method, filters[method])]));
            updateProfile({ username: username.trim(), grinder, methods: selectedMethods, filters: normalizedFilters });
            setSaved(true);
            setTimeout(() => setSaved(false), 1600);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: { marginTop: 32 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  filterRow: { marginBottom: 24 },
  method: { fontSize: 16, fontWeight: '700', marginBottom: 11 },
  filterChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legalLinks: { gap: 14 },
  legalLink: { fontSize: 14, fontWeight: '700' },
});
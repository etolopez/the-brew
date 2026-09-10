import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChoicePill, Field, PrimaryButton, ScreenTitle, SectionLabel } from '@/components/CoffeeUI';
import { GRINDERS, METHODS, getCompatibleFilters, getDefaultFilter, resolveFilterForMethod, translateFilterName, translateGrinder, translateMethod, useCoffee } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/context/LocaleContext';

export default function SetupScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { state, completeSetup } = useCoffee();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(state.profile.username);
  const [grinder, setGrinder] = useState(state.profile.grinder);
  const [methods, setMethods] = useState<string[]>(state.profile.methods);
  const [filters, setFilters] = useState<Record<string, string>>(state.profile.filters);

  const stepCopy = useMemo(
    () => [
      { eyebrow: t('setupEyebrowName'), title: t('setupTitleName'), subtitle: t('setupSubName') },
      { eyebrow: t('setupEyebrow1'), title: t('setupTitle1'), subtitle: t('setupSub1') },
      { eyebrow: t('setupEyebrow2'), title: t('setupTitle2'), subtitle: t('setupSub2') },
      { eyebrow: t('setupEyebrow3'), title: t('setupTitle3'), subtitle: t('setupSub3') },
    ][step],
    [step, t],
  );

  const toggleMethod = (method: string) => {
    setMethods((current) => (current.includes(method) ? current.filter((item) => item !== method) : [...current, method]));
  };

  const next = () => {
    if (step < 3) setStep((current) => current + 1);
    else {
      const selectedMethods = methods.length ? methods : ['V60'];
      const normalizedFilters = Object.fromEntries(selectedMethods.map((method) => [method, resolveFilterForMethod(method, filters[method])]));
      completeSetup({ username: username.trim(), grinder, methods: selectedMethods, filters: normalizedFilters });
      router.replace({ pathname: '/coffee/new', params: { onboarding: '1' } });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 26, paddingBottom: insets.bottom + 34, paddingHorizontal: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressRow}>
          <Text style={[styles.brand, { color: colors.coffeeDeep }]}>{t('setupBrand')}</Text>
          <Text style={[styles.progress, { color: colors.mutedForeground }]}>{step + 1} / 4</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.blue, width: `${((step + 1) / 4) * 100}%` }]} />
        </View>
        <View style={styles.heading}>
          <ScreenTitle eyebrow={stepCopy.eyebrow} title={stepCopy.title} subtitle={stepCopy.subtitle} />
        </View>

        {step === 0 ? (
          <Field
            label={t('setupNameLabel')}
            placeholder={t('setupNamePh')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={32}
          />
        ) : null}

        {step === 1 ? (
          <View style={styles.list}>
            {GRINDERS.map((item) => (
              <ChoicePill key={item} label={translateGrinder(item, t)} selected={grinder === item} onPress={() => setGrinder(item)} icon={item.includes('Electric') ? 'zap' : 'disc'} />
            ))}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.list}>
            {METHODS.map((item) => (
              <ChoicePill key={item} label={translateMethod(item, t)} selected={methods.includes(item)} onPress={() => toggleMethod(item)} icon="coffee" />
            ))}
          </View>
        ) : null}

        {step === 3 ? (
          <View>
            {methods.map((method) => (
              <View key={method} style={styles.methodBlock}>
                <SectionLabel>{translateMethod(method, t)}</SectionLabel>
                <View style={styles.wrap}>
                  {getCompatibleFilters(method).map((filter) => (
                    <ChoicePill
                      key={filter}
                      label={translateFilterName(filter, t)}
                      selected={(filters[method] ?? getDefaultFilter(method)) === filter}
                      onPress={() => setFilters((current) => ({ ...current, [method]: filter }))}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <PrimaryButton label={step === 3 ? t('setupBuildProfile') : t('setupContinue')} onPress={next} icon={step === 3 ? 'check' : 'arrow-right'} style={{ marginTop: 26 }} disabled={step === 0 && !username.trim()} />
        {step > 0 ? (
          <Text onPress={() => setStep((current) => current - 1)} style={[styles.back, { color: colors.mutedForeground }]}>
            {t('setupBack')}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4 },
  progress: { fontSize: 13, fontWeight: '600' },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 17, marginBottom: 40, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  heading: { marginBottom: 28 },
  list: { gap: 10 },
  methodBlock: { marginBottom: 27 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  back: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 20, padding: 8 },
});
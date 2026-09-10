import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { ChoicePill, Field, PrimaryButton, ScreenTitle } from '@/components/CoffeeUI';
import { translateGrinder, translateMethod, useCoffee } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/context/LocaleContext';

const generalFlavors = ['Citrus', 'Floral', 'Sweet', 'Cocoa', 'Juicy', 'Clean', 'Bitter', 'Dry'];

function suggestedSetting(value: string) {
  return value.match(/(?:start|inicia(?: en)?) ([\d.]+)/i)?.[1] ?? (/^[\d.]+$/.test(value.trim()) ? value.trim() : '');
}

export default function FeedbackScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { state, saveBrew } = useCoffee();
  const recipe = state.activeBrew;
  const coffee = [...state.coffees, ...state.archivedCoffees].find((item) => item.id === recipe?.coffeeId);
  const [rating, setRating] = useState(4);
  const [selected, setSelected] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [otherFlavors, setOtherFlavors] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(true);
  const [grinderSetting, setGrinderSetting] = useState(() => suggestedSetting(recipe?.grindSetting ?? ''));
  const durationSeconds = state.activeElapsedSeconds || recipe?.brewTimeSeconds || 0;
  const flavors = useMemo(() => {
    const unique = new Map<string, string>();
    [...(coffee?.flavors ?? []), ...generalFlavors].forEach((flavor) => {
      const trimmed = flavor.trim();
      if (trimmed) unique.set(trimmed.toLocaleLowerCase(), unique.get(trimmed.toLocaleLowerCase()) ?? trimmed);
    });
    return [...unique.values()];
  }, [coffee?.flavors]);

  useEffect(() => {
    if (!recipe) router.replace('/(tabs)');
  }, [recipe]);

  if (!recipe) {
    return null;
  }

  const toggleFlavor = (flavor: string) => setSelected((current) => current.includes(flavor) ? current.filter((item) => item !== flavor) : [...current, flavor]);
  const flavorLabel = (flavor: string) => {
    const general = generalFlavors.find((item) => item.toLocaleLowerCase() === flavor.toLocaleLowerCase());
    return general ? t(`flavor${general}` as any) : flavor;
  };

  const logCup = () => {
    const loggedRecipe = grinderSetting.trim() ? { ...recipe, grindSetting: grinderSetting.trim() } : recipe;
    const customFlavors = showOther
      ? otherFlavors.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const foundFlavors = [...new Map([...selected, ...customFlavors].map((flavor) => [flavor.toLocaleLowerCase(), flavor])).values()];
    saveBrew({ recipe: loggedRecipe, rating, foundFlavors, note, saved, durationSeconds });
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ paddingTop: insets.top + 26, paddingBottom: insets.bottom + 38, paddingHorizontal: 22 }} showsVerticalScrollIndicator={false} bottomOffset={24}>
        <ScreenTitle eyebrow={t('fbEyebrow')} title={t('fbTitle')} subtitle={t('fbSubtitle', { name: recipe.coffeeName, method: translateMethod(recipe.method, t), water: recipe.waterMl, time: formatTime(durationSeconds) })} />
        <View style={styles.ratingArea}>
          <Text style={[styles.ratingPrompt, { color: colors.foreground }]}>{t('fbPrompt')}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => <Text key={value} onPress={() => setRating(value)} style={[styles.star, { color: value <= rating ? colors.coffee : colors.border }]}>★</Text>)}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('fbWhatFound')}</Text>
          <View style={styles.wrap}>
            {flavors.map((flavor) => <ChoicePill key={flavor} label={flavorLabel(flavor)} selected={selected.includes(flavor)} onPress={() => toggleFlavor(flavor)} />)}
            <ChoicePill label={t('fbOther')} selected={showOther} onPress={() => setShowOther((current) => !current)} />
          </View>
          {showOther ? (
            <Field
              label={t('fbOtherLabel')}
              placeholder={t('fbOtherPh')}
              value={otherFlavors}
              onChangeText={setOtherFlavors}
              autoCapitalize="none"
              style={styles.otherField}
            />
          ) : null}
        </View>
        <Field label={t('fbNoteLabel')} placeholder={t('fbNotePh')} value={note} onChangeText={setNote} multiline />
        <View style={styles.grinderSection}>
          <Field
            label={t('fbGrinderLabel', { grinder: translateGrinder(recipe.grinder, t) })}
            placeholder={t('fbGrinderPh')}
            value={grinderSetting}
            onChangeText={setGrinderSetting}
            keyboardType={suggestedSetting(recipe.grindSetting) ? 'decimal-pad' : 'default'}
          />
          <Text style={[styles.settingHint, { color: colors.mutedForeground }]}>{t('fbGrinderHint', { setting: recipe.grindSetting })}</Text>
        </View>
        <View style={styles.saveRow}>
          <View style={styles.saveCopy}>
            <Text style={[styles.saveTitle, { color: colors.foreground }]}>{t('fbSaveTitle')}</Text>
            <Text style={[styles.saveSub, { color: colors.mutedForeground }]}>{t('fbSaveSub')}</Text>
          </View>
          <View style={styles.saveChoices}>
            <ChoicePill label={t('fbSaveRecipe')} selected={saved} onPress={() => setSaved(true)} />
            <ChoicePill label={t('fbDontSave')} selected={!saved} onPress={() => setSaved(false)} />
          </View>
        </View>
        <PrimaryButton label={t('fbLogCup')} onPress={logCup} icon="check" style={{ marginTop: 26 }} />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  ratingArea: { alignItems: 'center', paddingVertical: 31 },
  ratingPrompt: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  stars: { flexDirection: 'row', gap: 9, marginTop: 17 },
  star: { fontSize: 34 },
  section: { marginBottom: 27 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  otherField: { marginTop: 18, marginBottom: -8 },
  grinderSection: { marginTop: 8, marginBottom: 8 },
  settingHint: { fontSize: 12, lineHeight: 17, marginTop: -10 },
  saveRow: { gap: 13, paddingVertical: 18 },
  saveCopy: { flex: 1 },
  saveTitle: { fontSize: 15, fontWeight: '700' },
  saveSub: { fontSize: 12, marginTop: 4 },
  saveChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
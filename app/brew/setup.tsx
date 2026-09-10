import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChoicePill, CoffeeImage, Field, IconButton, PrimaryButton, ScreenTitle, SectionLabel } from '@/components/CoffeeUI';
import { AeroPressStyle, BrewGoal, applyLearnedDuration, buildRecipe, resolveFilterForMethod, translateFilterName, translateGrinder, translateMethod, translateProcess, useCoffee } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/context/LocaleContext';

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export default function BrewSetupScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { state, setActiveBrew } = useCoffee();
  const { coffeeId: requestedCoffeeId } = useLocalSearchParams<{ coffeeId?: string }>();
  const initialCoffeeId = requestedCoffeeId && state.coffees.some((coffee) => coffee.id === requestedCoffeeId)
    ? requestedCoffeeId
    : state.coffees[0]?.id ?? '';
  const [coffeeId, setCoffeeId] = useState(initialCoffeeId);
  const [method, setMethod] = useState(state.profile.methods[0] ?? 'V60');
  const [goal, setGoal] = useState<BrewGoal>('sweet');
  const [grams, setGrams] = useState(method === 'Chemex' || method === 'French Press' ? '20' : '15');
  const [aeroPressStyle, setAeroPressStyle] = useState<AeroPressStyle>('standard');
  const coffee = state.coffees.find((item) => item.id === coffeeId) ?? state.coffees[0];
  const filter = resolveFilterForMethod(method, state.profile.filters[method]);
  const gramsValue = Number.parseFloat(grams);
  const recipe = useMemo(() => coffee ? buildRecipe(coffee, method, filter, state.profile.grinder, goal, gramsValue, aeroPressStyle, t) : null, [aeroPressStyle, coffee, filter, goal, gramsValue, method, state.profile.grinder, t]);
  const learned = recipe ? state.learning[recipe.id] : undefined;
  const activeRecipe = recipe && learned ? applyLearnedDuration(recipe, learned.averageDurationSeconds) : recipe;

  const goals: { id: BrewGoal; label: string; note: string }[] = [
    { id: 'bright', label: t('goalBright'), note: t('goalBrightNote') },
    { id: 'sweet', label: t('goalSweet'), note: t('goalSweetNote') },
    { id: 'body', label: t('goalBody'), note: t('goalBodyNote') },
  ];

  if (!coffee || !recipe) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: insets.bottom + 36, paddingHorizontal: 22 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow={t('brewEyebrow')} title={t('brewTitle')} subtitle={t('brewSubtitle')} action={<IconButton icon="x" label={t('close')} onPress={() => router.back()} />} />

        <View style={styles.section}>
          <SectionLabel>{t('brewYourCoffee')}</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {state.coffees.map((item) => (
              <ChoicePill key={item.id} label={item.name} selected={coffeeId === item.id} onPress={() => setCoffeeId(item.id)} style={{ minWidth: 145 }} />
            ))}
          </ScrollView>
          <View style={styles.coffeeSnapshot}>
            <CoffeeImage image={coffee.image} height={82} width={92} radius={14} />
            <View style={styles.snapshotCopy}>
              <Text style={[styles.snapshotName, { color: colors.foreground }]}>{coffee.farm === 'Unknown farm' ? t('coffeeUnknownFarm') : coffee.farm}</Text>
              <Text style={[styles.snapshotMeta, { color: colors.mutedForeground }]}>{coffee.zone} · {coffee.altitude === '—' ? coffee.altitude : `${coffee.altitude.replace(/\s*m$/i, '')} m`} · {coffee.variety === 'Not specified' ? t('coffeeUnspecified') : coffee.variety} · {translateProcess(coffee.process, t)}</Text>
              <Text style={[styles.snapshotFlavor, { color: colors.coffee }]}>{coffee.flavors.join(' · ')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>{t('brewLead')}</SectionLabel>
          <View style={styles.goalList}>
            {goals.map((item) => (
              <ChoicePill key={item.id} label={`${item.label}  ·  ${item.note}`} selected={goal === item.id} onPress={() => setGoal(item.id)} style={{ flex: 1 }} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>{t('brewSetupLabel')}</SectionLabel>
          <View style={styles.setupLine}>
            <Text style={[styles.setupValue, { color: colors.foreground }]}>{translateGrinder(state.profile.grinder, t)}</Text>
            <Text style={[styles.setupLabel, { color: colors.mutedForeground }]}>{t('brewGrinderLabel')}</Text>
          </View>
          <View style={styles.setupLine}>
            <Text style={[styles.setupValue, { color: colors.foreground }]}>{translateMethod(method, t)}</Text>
            <Text style={[styles.setupLabel, { color: colors.mutedForeground }]}>{t('brewFilterLabel', { filter: translateFilterName(filter, t).toLowerCase() })}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {state.profile.methods.map((item) => <ChoicePill key={item} label={translateMethod(item, t)} selected={method === item} onPress={() => setMethod(item)} />)}
          </ScrollView>
          {method === 'AeroPress' ? (
            <View style={styles.aeroPressChoice}>
              <SectionLabel>{t('brewAeroStyle')}</SectionLabel>
              <View style={styles.wrap}>
                <ChoicePill label={t('aeroStandard')} selected={aeroPressStyle === 'standard'} onPress={() => setAeroPressStyle('standard')} />
                <ChoicePill label={t('aeroInverted')} selected={aeroPressStyle === 'inverted'} onPress={() => setAeroPressStyle('inverted')} />
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.doseSection}>
          <View style={styles.doseHeading}>
            <View style={styles.doseCopy}>
              <SectionLabel>{t('brewDose')}</SectionLabel>
              <Text style={[styles.doseHint, { color: colors.mutedForeground }]}>{t('brewDoseHint', { ratio: activeRecipe?.ratio || '' })}</Text>
            </View>
            <Field label={t('brewGrams')} value={grams} onChangeText={setGrams} keyboardType="decimal-pad" style={styles.gramsField} />
          </View>
        </View>

        <View style={[styles.recipePreview, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <Text style={[styles.previewEyebrow, { color: colors.blue }]}>{t('brewRecipeEyebrow')}</Text>
          <Text style={[styles.previewTitle, { color: colors.foreground }]}>{recipe.title}</Text>
          <Text style={[styles.previewCopy, { color: colors.mutedForeground }]}>{t('brewRecipeCopy', { grams: activeRecipe?.coffeeGrams || 0, ratio: activeRecipe?.ratio?.split(':')[1] || '', water: activeRecipe?.waterMl || 0, temp: activeRecipe?.temperature || 0 })}</Text>
          <Text style={[styles.previewCopy, { color: colors.mutedForeground }]}>{t('brewRecipeCopy2', { grinder: translateGrinder(activeRecipe?.grinder || '', t), setting: activeRecipe?.grindSetting || '', method: translateMethod(activeRecipe?.method || '', t) })}</Text>
          <Text style={[styles.reasonLabel, { color: colors.blue }]}>{t('brewWhySettings')}</Text>
          <Text style={[styles.reasonCopy, { color: colors.mutedForeground }]}>{activeRecipe?.grindRationale}</Text>
          <Text style={[styles.reasonCopy, { color: colors.mutedForeground }]}>{activeRecipe?.filterRationale}</Text>
          <Text style={[styles.previewTime, { color: colors.coffee }]}>
            {t('brewEndAround', { time: formatTime(activeRecipe?.brewTimeSeconds ?? 0) })}
            {learned ? ` · ${t(learned.attempts === 1 ? 'brewLearnedSingle' : 'brewLearned', { attempts: learned.attempts })}` : ''}
          </Text>
        </View>
        <PrimaryButton label={t('brewStart')} onPress={() => { if (activeRecipe) { setActiveBrew(activeRecipe); router.push('/brew/timer'); } }} icon="play" disabled={state.coffees.length === 0 || !activeRecipe} />
        <Text onPress={() => router.push('/recipe/new')} style={[styles.customLink, { color: colors.blue }]}>{t('brewCustomLink')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: { marginTop: 31 },
  rail: { gap: 8, paddingVertical: 2 },
  coffeeSnapshot: { flexDirection: 'row', gap: 13, marginTop: 13 },
  snapshotCopy: { flex: 1, justifyContent: 'center' },
  snapshotName: { fontSize: 16, fontWeight: '700' },
  snapshotMeta: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  snapshotFlavor: { fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 5 },
  goalList: { gap: 9 },
  setupLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 38 },
  setupValue: { fontSize: 15, fontWeight: '700' },
  setupLabel: { fontSize: 13 },
  aeroPressChoice: { marginTop: 22 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doseSection: { marginTop: 29 },
  doseHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 },
  doseCopy: { flex: 1, paddingTop: 2 },
  doseHint: { fontSize: 12, lineHeight: 18, marginTop: -3 },
  gramsField: { width: 92, marginBottom: 0 },
  recipePreview: { paddingVertical: 19, marginTop: 28, marginBottom: 20 },
  previewEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  previewTitle: { fontSize: 21, fontWeight: '700' },
  previewCopy: { fontSize: 13, lineHeight: 20, marginTop: 5 },
  reasonLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginTop: 14 },
  reasonCopy: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  previewTime: { fontSize: 12, fontWeight: '700', marginTop: 10 },
  customLink: { textAlign: 'center', fontSize: 13, fontWeight: '700', marginTop: 16, padding: 6 },
});
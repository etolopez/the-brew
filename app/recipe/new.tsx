import React, { useState } from 'react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ChoicePill, Field, IconButton, PrimaryButton, ScreenTitle, SectionLabel } from '@/components/CoffeeUI';
import { AeroPressStyle, METHODS, BrewRecipe, getDoseTimeScale, getFilterGuidance, getGrindRecommendation, resolveFilterForMethod, useCoffee, makeI18nMarker, parseI18nMarker, translateGrinder, translateMethod } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';
import { TranslationFunction, useLocale } from '@/context/LocaleContext';

function parseTargetTime(value: string) {
  const parts = value.split(':').map(Number);
  if (parts.length === 2 && parts.every((part) => Number.isFinite(part) && part >= 0) && parts[1] < 60) return parts[0] * 60 + parts[1];
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 180;
}

type StageDraft = {
  id: string;
  time: string;
  label: string;
  detail: string;
  water: string;
};

function parseStageTime(value: string) {
  const parts = value.split(':').map(Number);
  if (parts.length === 2 && parts.every((part) => Number.isFinite(part) && part >= 0) && parts[1] < 60) return parts[0] * 60 + parts[1];
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
}

function formatStageTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
}

function defaultStageDrafts(method: string, dose: number, water: number, totalTime: number, aeroPressStyle: AeroPressStyle, t: TranslationFunction): StageDraft[] {
  const firstTarget = Math.round(water * 0.45);
  const stage = (id: string, time: number, label: string, detail: string, waterTarget: number): StageDraft => ({
    id,
    time: formatStageTime(time),
    label,
    detail,
    water: String(waterTarget),
  });

  if (method === 'AeroPress' && aeroPressStyle === 'inverted') {
    return [
      stage('stage-1', 0, t('stageAeroInvBuildLabel'), t('stageAeroInvBuildDetail', { grams: dose, water }), water),
      stage('stage-2', 20, t('stageAeroInvCapLabel'), t('stageAeroInvCapDetail'), water),
      stage('stage-3', Math.max(45, totalTime - 30), t('stageAeroInvPressLabel'), t('stageAeroInvPressDetailDyn'), water),
    ];
  }

  return [
    stage('stage-1', 0, method === 'AeroPress' ? t('stageAeroStdAddLabel') : t('stagePourBloomLabel'), method === 'AeroPress' ? t('stageAeroStdAddDetail', { grams: dose, water }) : t('stagePourBloomDetailDyn', { bloom: Math.min(45, firstTarget) }), method === 'AeroPress' ? water : Math.min(45, firstTarget)),
    stage('stage-2', method === 'AeroPress' ? 30 : 35, method === 'AeroPress' ? t('stageAeroStdStirLabel') : t('stagePour1Label'), method === 'AeroPress' ? t('stageAeroStdStirDetailDyn') : t('stagePour1DetailKalita', { first: firstTarget }), method === 'AeroPress' ? water : firstTarget),
    stage('stage-3', Math.max(method === 'AeroPress' ? 90 : 80, totalTime - 30), method === 'AeroPress' ? t('stageAeroStdPressLabel') : t('stagePourFinalLabel'), method === 'AeroPress' ? t('stageAeroStdPressDetail') : t('stagePourFinalDetailV60', { water }), water),
  ];
}

export default function NewRecipeScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { state, addCustomRecipe } = useCoffee();
  const initialMethod = state.profile.methods[0] ?? METHODS[0];
  const [name, setName] = useState(makeI18nMarker('customNamePh'));
  const [coffeeId, setCoffeeId] = useState(state.coffees[0]?.id ?? '');
  const [method, setMethod] = useState(initialMethod);
  const [grams, setGrams] = useState('15');
  const [ratio, setRatio] = useState('16');
  const [temperature, setTemperature] = useState('92');
  const [targetTime, setTargetTime] = useState('02:45');
  const [aeroPressStyle, setAeroPressStyle] = useState<AeroPressStyle>('standard');
  const [stages, setStages] = useState<StageDraft[]>(() => defaultStageDrafts(initialMethod, 15, 240, 165, 'standard', t));
  const coffee = state.coffees.find((item) => item.id === coffeeId) ?? state.coffees[0];

  const resetStagesForMethod = (nextMethod: string, nextAeroPressStyle = aeroPressStyle) => {
    const dose = Number.parseFloat(grams) || 15;
    const water = Math.round(dose * (Number.parseFloat(ratio) || 16));
    setStages(defaultStageDrafts(nextMethod, dose, water, parseTargetTime(targetTime), nextAeroPressStyle, t));
  };

  const changeDose = (value: string) => {
    const previousDose = Number.parseFloat(grams);
    const nextDose = Number.parseFloat(value);
    setGrams(value);
    if (!(previousDose > 0) || !(nextDose > 0)) return;

    const timeScale = getDoseTimeScale(method, previousDose, nextDose);
    const waterScale = nextDose / previousDose;
    setTargetTime((current) => formatStageTime(Math.max(5, Math.round((parseTargetTime(current) * timeScale) / 5) * 5)));
    setStages((current) => current.map((stage) => ({
      ...stage,
      time: formatStageTime(stage.time === '00:00' ? 0 : Math.max(5, Math.round((parseStageTime(stage.time) * timeScale) / 5) * 5)),
      water: String(Math.max(0, Math.round((Number.parseFloat(stage.water) || 0) * waterScale))),
    })));
  };

  const updateStage = (id: string, field: keyof Omit<StageDraft, 'id'>, value: string) => {
    setStages((current) => current.map((stage) => stage.id === id ? { ...stage, [field]: value } : stage));
  };

  const addStage = () => {
    const previous = stages[stages.length - 1];
    const nextTime = previous ? parseStageTime(previous.time) + 30 : 0;
    setStages((current) => [
      ...current,
      {
        id: `stage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: formatStageTime(nextTime),
        label: makeI18nMarker('customNewStep'),
        detail: makeI18nMarker('customNewDetail'),
        water: previous?.water ?? String(Math.round((Number.parseFloat(grams) || 15) * (Number.parseFloat(ratio) || 16))),
      },
    ]);
  };

  const removeStage = (id: string) => {
    setStages((current) => current.length > 1 ? current.filter((stage) => stage.id !== id) : current);
  };

  const createRecipe = () => {
    if (!coffee || !name.trim()) return;
    const dose = Number.parseFloat(grams);
    const ratioNumber = Number.parseFloat(ratio);
    const coffeeDose = dose > 0 ? dose : 15;
    const recipeRatio = ratioNumber > 0 ? ratioNumber : 16;
    const water = Math.round(coffeeDose * recipeRatio);
    const totalTime = parseTargetTime(targetTime);
    const recipeStages: BrewRecipe['stages'] = stages
      .map((stage) => ({
        atSeconds: parseStageTime(stage.time),
        label: stage.label.trim() || t('customUntitled'),
        detail: stage.detail.trim() || t('customFollowStep'),
        waterMl: Math.max(0, Number.parseFloat(stage.water) || 0),
      }))
      .sort((a, b) => a.atSeconds - b.atSeconds);
    recipeStages.forEach((stage, index) => {
      if (index > 0 && stage.atSeconds <= recipeStages[index - 1].atSeconds) stage.atSeconds = recipeStages[index - 1].atSeconds + 5;
    });
    const lastStageTime = recipeStages[recipeStages.length - 1]?.atSeconds ?? 0;
    const recipeFilter = resolveFilterForMethod(method, state.profile.filters[method]);
    const grindRecommendation = getGrindRecommendation(state.profile.grinder, method, recipeFilter, 'sweet', t);
    const filterGuidance = getFilterGuidance(method, recipeFilter, t);
    const recipe: BrewRecipe = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      coffeeId: coffee.id,
      coffeeName: coffee.name,
      method,
      filter: recipeFilter,
      grinder: state.profile.grinder,
      grindSetting: grindRecommendation.setting,
      grindRationale: grindRecommendation.rationale,
      filterRationale: filterGuidance.rationale,
      temperature: Number.parseFloat(temperature) || 92,
      coffeeGrams: coffeeDose,
      waterMl: water,
      ratio: `1:${recipeRatio}`,
      title: name.trim(),
      description: makeI18nMarker('customPersonal'),
      goal: 'sweet',
      brewTimeSeconds: Math.max(totalTime, lastStageTime),
      aeroPressStyle: method === 'AeroPress' ? aeroPressStyle : undefined,
      isCustom: true,
      stages: recipeStages,
    };
    addCustomRecipe(recipe);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: insets.bottom + 38, paddingHorizontal: 22 }} showsVerticalScrollIndicator={false} bottomOffset={24}>
        <ScreenTitle eyebrow={t('customEyebrow')} title={t('customTitle')} subtitle={t('customSubtitle')} action={<IconButton icon="x" label={t('close')} onPress={() => router.back()} />} />

        <View style={styles.form}>
          <Field label={t('customName')} value={parseI18nMarker(name, t)} onChangeText={setName} placeholder={t('customNamePh')} />
          <SectionLabel>{t('customCoffee')}</SectionLabel>
          <View style={styles.wrap}>{state.coffees.map((item) => <ChoicePill key={item.id} label={item.name} selected={coffeeId === item.id} onPress={() => setCoffeeId(item.id)} />)}</View>
          <View style={styles.choiceSection}>
            <SectionLabel>{t('customBrewer')}</SectionLabel>
            <View style={styles.wrap}>{state.profile.methods.map((item) => <ChoicePill key={item} label={translateMethod(item, t)} selected={method === item} onPress={() => { setMethod(item); resetStagesForMethod(item); }} />)}</View>
          </View>
          {method === 'AeroPress' ? (
            <View style={styles.choiceSection}>
              <SectionLabel>{t('brewAeroStyle')}</SectionLabel>
              <View style={styles.wrap}>
                <ChoicePill label={t('aeroStandard')} selected={aeroPressStyle === 'standard'} onPress={() => { setAeroPressStyle('standard'); resetStagesForMethod(method, 'standard'); }} />
                <ChoicePill label={t('aeroInverted')} selected={aeroPressStyle === 'inverted'} onPress={() => { setAeroPressStyle('inverted'); resetStagesForMethod(method, 'inverted'); }} />
              </View>
            </View>
          ) : null}
          <View style={styles.twoFields}>
            <Field label={t('customDose')} value={grams} onChangeText={changeDose} keyboardType="decimal-pad" style={styles.halfField} />
            <Field label={t('customRatio')} value={ratio} onChangeText={setRatio} keyboardType="decimal-pad" style={styles.halfField} />
          </View>
          <Text style={[styles.doseNote, { color: colors.mutedForeground }]}>{t('customDoseNote')}</Text>
          <View style={styles.twoFields}>
            <Field label={t('customTemp')} value={temperature} onChangeText={setTemperature} keyboardType="decimal-pad" style={styles.halfField} />
            <Field label={t('customEndAround')} value={targetTime} onChangeText={setTargetTime} placeholder="02:45" keyboardType="numbers-and-punctuation" style={styles.halfField} />
          </View>

          <View style={styles.stepsHeader}>
            <View style={styles.stepsHeading}>
              <SectionLabel>{t('customSteps')}</SectionLabel>
              <Text style={[styles.helper, { color: colors.mutedForeground }]}>{t('customStepsHelper')}</Text>
            </View>
            <Pressable onPress={addStage} style={({ pressed }) => [styles.addStep, { borderColor: colors.blue }, pressed && { opacity: 0.7 }]}>
              <Feather name="plus" size={15} color={colors.blue} />
              <Text style={[styles.addStepLabel, { color: colors.blue }]}>{t('customAddStep')}</Text>
            </Pressable>
          </View>
          <View style={styles.stageList}>
            {stages.map((stage, index) => (
              <View key={stage.id} style={[styles.stageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.stageHeader}>
                  <Text style={[styles.stageNumber, { color: colors.coffee }]}>{t('customStepX', { step: index + 1 })}</Text>
                  {stages.length > 1 ? <Pressable onPress={() => removeStage(stage.id)} hitSlop={8}><Feather name="trash-2" size={17} color={colors.destructive} /></Pressable> : null}
                </View>
                <View style={styles.twoFields}>
                  <Field label={t('customStartsAt')} value={stage.time} onChangeText={(value) => updateStage(stage.id, 'time', value)} placeholder="00:30" keyboardType="numbers-and-punctuation" style={styles.halfField} />
                  <Field label={t('customWaterTarget')} value={stage.water} onChangeText={(value) => updateStage(stage.id, 'water', value)} keyboardType="decimal-pad" style={styles.halfField} />
                </View>
                <Field label={t('customStepName')} value={parseI18nMarker(stage.label, t)} onChangeText={(value) => updateStage(stage.id, 'label', value)} placeholder={t('customStepNamePh')} />
                <Field label={t('customInst')} value={parseI18nMarker(stage.detail, t)} onChangeText={(value) => updateStage(stage.id, 'detail', value)} placeholder={t('customInstPh')} multiline />
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.preview, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <Text style={[styles.previewLabel, { color: colors.blue }]}>{t('customPreviewEyebrow')}</Text>
          <Text style={[styles.previewCopy, { color: colors.foreground }]}>{t('customPreviewCopy', { grams: grams || '15', ratio: ratio || '16', water: Math.round((Number.parseFloat(grams) || 15) * (Number.parseFloat(ratio) || 16)) })}</Text>
          <Text style={[styles.previewDetail, { color: colors.mutedForeground }]}>{t('customPreviewDetail', { steps: stages.length, time: targetTime || '02:45' })}</Text>
          <Text style={[styles.previewDetail, { color: colors.mutedForeground }]}>{translateGrinder(state.profile.grinder, t)} · {getGrindRecommendation(state.profile.grinder, method, resolveFilterForMethod(method, state.profile.filters[method]), 'sweet', t).setting}</Text>
        </View>
        <PrimaryButton label={t('customSave')} onPress={createRecipe} icon="save" />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  form: { marginTop: 30 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  choiceSection: { marginTop: 2 },
  twoFields: { flexDirection: 'row', gap: 16 },
  halfField: { flex: 1 },
  doseNote: { fontSize: 12, lineHeight: 17, marginTop: -9, marginBottom: 16 },
  stepsHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 14, marginBottom: 12 },
  stepsHeading: { flex: 1 },
  helper: { fontSize: 12, lineHeight: 17, marginTop: -4 },
  addStep: { minHeight: 36, paddingHorizontal: 10, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addStepLabel: { fontSize: 12, fontWeight: '700' },
  stageList: { gap: 12 },
  stageCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  stageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  stageNumber: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  preview: { paddingVertical: 17, marginBottom: 20 },
  previewLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  previewCopy: { fontSize: 14, fontWeight: '700', marginTop: 7 },
  previewDetail: { fontSize: 12, marginTop: 6 },
});
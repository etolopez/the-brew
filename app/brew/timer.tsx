import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field, IconButton, PrimaryButton } from '@/components/CoffeeUI';
import { resizeRecipeDose, translateFilterName, translateGrinder, translateMethod, useCoffee } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/context/LocaleContext';

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export default function BrewTimerScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { state, setActiveBrew, setActiveElapsed } = useCoffee();
  const baseRecipe = state.activeBrew;
  const [dose, setDose] = useState(baseRecipe ? String(baseRecipe.coffeeGrams) : '');
  const doseValue = Number.parseFloat(dose);
  const recipe = useMemo(() => baseRecipe ? resizeRecipeDose(baseRecipe, doseValue) : null, [baseRecipe, doseValue]);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const waterProgress = useRef(new Animated.Value(0)).current;
  const announcedStageIndex = useRef<number | null>(null);
  const stepAlertPlayer = useAudioPlayer(require('../../assets/sounds/step-alert.wav'));

  useEffect(() => {
    if (!running || !recipe) return;
    const interval = setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, [recipe, running]);

  const activeStageIndex = useMemo(() => {
    if (!recipe) return 0;
    let index = 0;
    recipe.stages.forEach((stage, stageIndex) => {
      if (stage.atSeconds <= elapsed) index = stageIndex;
    });
    return index;
  }, [elapsed, recipe]);
  const stage = recipe?.stages[activeStageIndex];
  const nextStage = recipe?.stages[activeStageIndex + 1];
  const water = stage?.waterMl ?? 0;
  const targetSeconds = recipe?.brewTimeSeconds ?? (recipe ? recipe.stages[recipe.stages.length - 1].atSeconds + 35 : 0);
  const targetReached = elapsed >= targetSeconds;

  useEffect(() => {
    if (!recipe) return;
    Animated.timing(waterProgress, {
      toValue: targetSeconds > 0 ? Math.min(elapsed / targetSeconds, 1) : 0,
      duration: running ? 1000 : 180,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [elapsed, recipe, running, targetSeconds, waterProgress]);

  useEffect(() => {
    if (!recipe) router.replace('/brew/setup');
  }, [recipe]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  useEffect(() => {
    if (!started || !running || !nextStage) return;
    const alertAt = Math.max(0, nextStage.atSeconds - 5);
    const upcomingStageIndex = activeStageIndex + 1;
    if (elapsed >= alertAt && elapsed < nextStage.atSeconds && announcedStageIndex.current !== upcomingStageIndex) {
      announcedStageIndex.current = upcomingStageIndex;
      void stepAlertPlayer.seekTo(0).then(() => stepAlertPlayer.play());
    }
  }, [activeStageIndex, elapsed, nextStage, running, started, stepAlertPlayer]);

  if (!recipe) {
    return null;
  }

  const startBrew = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveBrew(recipe);
    setStarted(true);
    setRunning(true);
  };

  const endAndLog = () => {
    setRunning(false);
    setActiveElapsed(elapsed);
    router.push('/brew/feedback');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <IconButton icon="x" label={t('close')} onPress={() => router.back()} />
        <View style={styles.headerCopy}><Text style={[styles.headerCoffee, { color: colors.foreground }]}>{recipe.coffeeName}</Text><Text style={[styles.headerMeta, { color: colors.mutedForeground }]}>{translateMethod(recipe.method, t)} · {recipe.title}</Text></View>
        <Text style={[styles.headerRatio, { color: colors.blue }]}>{recipe.ratio}</Text>
      </View>

      <View style={styles.content}>
        {!started ? (
          <View style={[styles.instructionBar, { backgroundColor: colors.blueSoft }]}>
            <Text style={[styles.instructionLabel, { color: colors.blue }]}>{t('timerBefore')}</Text>
            <Text style={[styles.instruction, { color: colors.accentForeground }]}>
              {t('timerInstruction', {
                temp: recipe.temperature,
                filter: translateFilterName(recipe.filter, t).toLowerCase(),
                grinder: translateGrinder(recipe.grinder, t),
                setting: recipe.grindSetting,
                grams: recipe.coffeeGrams
              })}
            </Text>
            <View style={styles.doseAdjust}>
              <View style={styles.doseCopy}>
                <Text style={[styles.doseLabel, { color: colors.blue }]}>{t('timerAdjustDose')}</Text>
                <Text style={[styles.doseHint, { color: colors.accentForeground }]}>{t('timerAdjustDoseHint')}</Text>
              </View>
              <Field label={t('brewGrams')} value={dose} onChangeText={setDose} keyboardType="decimal-pad" style={styles.doseField} />
            </View>
          </View>
        ) : null}

        {!started ? (
          <View style={styles.startAction}>
            <PrimaryButton label={t('timerBrew')} onPress={startBrew} icon="play" disabled={!Number.isFinite(doseValue) || doseValue <= 0} />
          </View>
        ) : (
          <View style={styles.timerArea}>
            <Text style={[styles.timerEyebrow, { color: colors.mutedForeground }]}>{targetReached ? t('timerTargetReached') : running ? t('timerInProgress') : t('timerPaused')}</Text>
            <Text style={[styles.timer, { color: colors.foreground }]}>{formatTime(elapsed)}</Text>
            <View style={styles.activeStep}>
              <Text style={[styles.activeStepCount, { color: colors.coffee }]}>{t('timerStepCount', { step: activeStageIndex + 1, total: recipe.stages.length })}</Text>
              <Text style={[styles.activeStepTitle, { color: colors.foreground }]}>{stage?.label}</Text>
              <Text style={[styles.activeStepDetail, { color: colors.mutedForeground }]}>{stage?.detail}</Text>
            </View>
            <View style={styles.waterBarHeader}>
              <Text style={[styles.waterBarLabel, { color: colors.mutedForeground }]}>{t('timerWaterTarget')}</Text>
              <Text style={[styles.waterBarValue, { color: colors.blue }]}>{water} / {recipe.waterMl}ml</Text>
            </View>
            <View style={[styles.waterTrack, { backgroundColor: colors.muted }]}>
              <Animated.View style={[styles.waterFill, { backgroundColor: colors.blue, width: waterProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <View style={styles.stageMarkers}>
              {recipe.stages.map((recipeStage, index) => {
                if (recipeStage.atSeconds === 0) return null;
                const position = targetSeconds > 0 ? (recipeStage.atSeconds / targetSeconds) * 100 : 0;
                const left = `${Math.max(4, Math.min(96, position))}%` as `${number}%`;
                const active = index === activeStageIndex;
                return (
                  <View key={`${index}-${recipeStage.atSeconds}-${recipeStage.waterMl}`} style={[styles.stageMarker, { left }]}>
                    <View style={[styles.stageMarkerTick, { backgroundColor: active ? colors.blue : colors.border }]} />
                    <Text style={[styles.stageMarkerTime, { color: active ? colors.blue : colors.mutedForeground }]}>{formatTime(recipeStage.atSeconds)}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.waterLabels}><Text style={[styles.waterLabel, { color: colors.mutedForeground }]}>0ml</Text><Text style={[styles.waterNow, { color: colors.mutedForeground }]}>{t('timerSlowlyFill')}</Text><Text style={[styles.waterLabel, { color: colors.mutedForeground }]}>{recipe.waterMl}ml</Text></View>
          </View>
        )}

        {!started ? (
          <View style={[styles.stageArea, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <Text style={[styles.stageCount, { color: colors.coffee }]}>{t('timerStepCount', { step: activeStageIndex + 1, total: recipe.stages.length })}</Text>
            <Text style={[styles.stageTitle, { color: colors.foreground }]}>{stage?.label}</Text>
            <Text style={[styles.stageDetail, { color: colors.mutedForeground }]}>{stage?.detail}</Text>
          </View>
        ) : null}

        {nextStage && !targetReached ? (
          <View style={[styles.timeline, { borderBottomColor: colors.border }]}>
            <Text style={[styles.timelineLabel, { color: colors.mutedForeground }]}>{t('timerComingUp')}</Text>
            <View style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: colors.blueSoft, borderColor: colors.blue }]}><Text style={[styles.timelineNumber, { color: colors.blue }]}>{activeStageIndex + 2}</Text></View>
              <View style={styles.timelineCopy}><Text style={[styles.timelineTitle, { color: colors.foreground }]}>{nextStage.label}</Text><Text style={[styles.timelineDetail, { color: colors.mutedForeground }]}>{nextStage.detail}</Text></View>
              <Text style={[styles.timelineTime, { color: colors.mutedForeground }]}>{formatTime(nextStage.atSeconds)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.bottom}>
          <View style={[styles.endTarget, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View><Text style={[styles.endTargetLabel, { color: colors.mutedForeground }]}>{t('timerEndAt')}</Text><Text style={[styles.endTargetCopy, { color: colors.foreground }]}>{t('timerTargetTime')}</Text></View>
            <Text style={[styles.endTargetTime, { color: colors.coffee }]}>{formatTime(targetSeconds)}</Text>
          </View>
          <View style={[styles.measureRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.measure}><Text style={[styles.measureLabel, { color: colors.mutedForeground }]}>{t('timerMeasureCoffee')}</Text><Text style={[styles.measureValue, { color: colors.foreground }]}>{recipe.coffeeGrams}g</Text></View>
            <View style={styles.measure}><Text style={[styles.measureLabel, { color: colors.mutedForeground }]}>{t('timerMeasureRatio')}</Text><Text style={[styles.measureValue, { color: colors.blue }]}>{recipe.ratio}</Text></View>
            <View style={styles.measure}><Text style={[styles.measureLabel, { color: colors.mutedForeground }]}>{t('timerMeasureWater')}</Text><Text style={[styles.measureValue, { color: colors.foreground }]}>{recipe.waterMl}ml</Text></View>
          </View>
          {started && !targetReached ? <Pressable onPress={() => setRunning((current) => !current)} style={({ pressed }) => [styles.pauseButton, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}><Text style={[styles.pauseLabel, { color: colors.foreground }]}>{running ? t('timerPause') : t('timerResume')}</Text></Pressable> : null}
          {started ? <PrimaryButton label={targetReached ? t('timerEndLog') : t('timerEndEarlyLog')} onPress={endAndLog} icon="check" style={{ marginTop: 10 }} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1 },
  headerCoffee: { fontSize: 15, fontWeight: '700' },
  headerMeta: { fontSize: 12, marginTop: 3 },
  headerRatio: { fontSize: 15, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 22 },
  instructionBar: { padding: 15, borderRadius: 16, marginTop: 24 },
  instructionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 6 },
  instruction: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  doseAdjust: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 15 },
  doseCopy: { flex: 1, paddingBottom: 4 },
  doseLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  doseHint: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  doseField: { width: 82, marginBottom: 0 },
  startAction: { marginTop: 22 },
  timerArea: { alignItems: 'center', marginTop: 34 },
  timerEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  timer: { fontSize: 64, fontWeight: '700', letterSpacing: -2.6, marginTop: 5 },
  activeStep: { width: '100%', alignItems: 'center', marginTop: 8, paddingHorizontal: 10 },
  activeStepCount: { fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  activeStepTitle: { fontSize: 21, lineHeight: 26, fontWeight: '700', marginTop: 5, textAlign: 'center' },
  activeStepDetail: { fontSize: 14, lineHeight: 20, marginTop: 4, textAlign: 'center', maxWidth: 340 },
  waterBarHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 19, marginBottom: 9 },
  waterBarLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  waterBarValue: { fontSize: 15, fontWeight: '700' },
  waterTrack: { width: '100%', height: 16, borderRadius: 8, overflow: 'hidden' },
  waterFill: { height: 16, borderRadius: 8 },
  stageMarkers: { width: '100%', height: 32, position: 'relative' },
  stageMarker: { position: 'absolute', top: 0, width: 44, marginLeft: -22, alignItems: 'center' },
  stageMarkerTick: { width: 2, height: 8, borderRadius: 1 },
  stageMarkerTime: { fontSize: 10, fontWeight: '700', marginTop: 3, fontVariant: ['tabular-nums'] },
  waterLabels: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  waterLabel: { fontSize: 11 },
  waterNow: { fontSize: 11, fontWeight: '700' },
  stageArea: { marginTop: 27, paddingVertical: 17 },
  stageCount: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  stageTitle: { fontSize: 25, fontWeight: '700', marginTop: 9 },
  stageDetail: { fontSize: 15, lineHeight: 22, marginTop: 5 },
  next: { fontSize: 12, marginTop: 14 },
  timeline: { paddingVertical: 11, borderBottomWidth: 1 },
  timelineLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineDot: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timelineNumber: { fontSize: 11, fontWeight: '700' },
  timelineCopy: { flex: 1 },
  timelineTitle: { fontSize: 13, fontWeight: '700' },
  timelineDetail: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  timelineTime: { fontSize: 11, paddingTop: 4 },
  endTarget: { minHeight: 60, borderRadius: 16, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  endTargetLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  endTargetCopy: { fontSize: 12, marginTop: 4 },
  endTargetTime: { fontSize: 22, fontWeight: '700' },
  bottom: { marginTop: 14, paddingBottom: 22 },
  pauseButton: { minHeight: 56, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pauseLabel: { fontSize: 16, fontWeight: '700' },
  measureRow: { minHeight: 66, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 },
  measure: { alignItems: 'center', minWidth: 70 },
  measureLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  measureValue: { fontSize: 17, fontWeight: '700', marginTop: 5 },
});
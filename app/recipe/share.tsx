import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { ChoicePill, IconButton, PrimaryButton, ScreenTitle, SectionLabel } from '@/components/CoffeeUI';
import { BrewRecipe, Coffee, CoffeeHue, ImageKey, translateMethod, translateRecipe, useCoffee } from '@/context/CoffeeContext';
import { useLocale } from '@/context/LocaleContext';
import { useColors } from '@/hooks/useColors';

type SharePayload = { v: 1; n: string; r: BrewRecipe[]; c?: Coffee[] };
type CompactRecipe = {
  c: string; cn: string; m: string; f: string; gr: string; gs: string;
  t: number; g: number; w: number; ra: string; ti: string; d: string;
  go: BrewRecipe['goal']; bt: number; ap?: BrewRecipe['aeroPressStyle'];
  cu?: boolean; ct?: boolean; st: [number, string, string, number][];
};
type CompactPayload = { v: 1; n: string; r: CompactRecipe[] };
type CompactCoffee = {
  i: string; n: string; f: string; z: string; co: string; a: string; p: string; ro: string;
  v: string; fl: string[]; im: ImageKey; h: CoffeeHue;
};
type CompactPayloadWithCoffee = CompactPayload & { c?: CompactCoffee[] };
type Mode = 'create' | 'scan';
type Stage = 'choose' | 'code' | 'camera' | 'preview' | 'done' | 'invalid';
const PREFIX = 'BREWPROFILE:1:';

function encodePayload(name: string, recipes: BrewRecipe[], coffees: Coffee[]) {
  const compactRecipes: CompactRecipe[] = recipes.map((recipe) => ({
    c: recipe.coffeeId,
    cn: recipe.coffeeName,
    m: recipe.method,
    f: recipe.filter,
    gr: recipe.grinder,
    gs: recipe.grindSetting,
    t: recipe.temperature,
    g: recipe.coffeeGrams,
    w: recipe.waterMl,
    ra: recipe.ratio,
    ti: recipe.isCustom || recipe.customTitle ? recipe.title : '',
    d: recipe.isCustom ? recipe.description : '',
    go: recipe.goal,
    bt: recipe.brewTimeSeconds,
    ap: recipe.aeroPressStyle,
    cu: recipe.isCustom,
    ct: recipe.customTitle,
    st: recipe.stages.map((stage) => [stage.atSeconds, stage.label, stage.detail, stage.waterMl]),
  }));
  const compactCoffees: CompactCoffee[] = coffees.map((coffee) => ({
    i: coffee.id,
    n: coffee.name,
    f: coffee.farm,
    z: coffee.zone,
    co: coffee.country,
    a: coffee.altitude,
    p: coffee.process,
    ro: coffee.roast,
    v: coffee.variety,
    fl: coffee.flavors,
    im: coffee.image,
    h: coffee.hue,
  }));
  return `${PREFIX}${JSON.stringify({ v: 1, n: name, r: compactRecipes, ...(compactCoffees.length ? { c: compactCoffees } : {}) } satisfies CompactPayloadWithCoffee)}`;
}

function decodePayload(data: string): SharePayload | null {
  if (!data.startsWith(PREFIX)) return null;
  try {
    const parsed = JSON.parse(data.slice(PREFIX.length)) as Partial<CompactPayloadWithCoffee>;
    if (parsed.v !== 1 || typeof parsed.n !== 'string' || !Array.isArray(parsed.r) || parsed.r.length < 1 || parsed.r.length > 3) return null;
    const valid = parsed.r.every((recipe) =>
      recipe &&
      typeof recipe.c === 'string' &&
      typeof recipe.cn === 'string' &&
      typeof recipe.m === 'string' &&
      typeof recipe.g === 'number' &&
      typeof recipe.w === 'number' &&
      typeof recipe.bt === 'number' &&
      Array.isArray(recipe.st) &&
      recipe.st.every((stage) => Array.isArray(stage) && typeof stage[0] === 'number' && typeof stage[1] === 'string' && typeof stage[2] === 'string' && typeof stage[3] === 'number'),
    );
    if (!valid) return null;
    const coffees = Array.isArray(parsed.c) ? parsed.c.filter((coffee) =>
      coffee &&
      typeof coffee.i === 'string' &&
      typeof coffee.n === 'string' &&
      typeof coffee.f === 'string' &&
      typeof coffee.z === 'string' &&
      typeof coffee.co === 'string' &&
      typeof coffee.a === 'string' &&
      typeof coffee.p === 'string' &&
      typeof coffee.ro === 'string' &&
      typeof coffee.v === 'string' &&
      Array.isArray(coffee.fl) &&
      coffee.fl.every((flavor) => typeof flavor === 'string') &&
      ['still', 'farm', 'harvest'].includes(coffee.im) &&
      ['coffee', 'blue', 'sage', 'terracotta', 'gold', 'plum'].includes(coffee.h),
    ).map((coffee) => ({
      id: coffee.i,
      name: coffee.n,
      farm: coffee.f,
      zone: coffee.z,
      country: coffee.co,
      altitude: coffee.a,
      process: coffee.p,
      roast: coffee.ro,
      variety: coffee.v,
      flavors: coffee.fl,
      image: coffee.im,
      hue: coffee.h,
    })) : [];
    return {
      v: 1,
      n: parsed.n,
      r: parsed.r.map((recipe, index) => ({
        id: `shared-${index}`,
        coffeeId: recipe.c,
        coffeeName: recipe.cn,
        method: recipe.m,
        filter: recipe.f,
        grinder: recipe.gr,
        grindSetting: recipe.gs,
        temperature: recipe.t,
        coffeeGrams: recipe.g,
        waterMl: recipe.w,
        ratio: recipe.ra,
        title: recipe.ti,
        description: recipe.d,
        goal: recipe.go,
        brewTimeSeconds: recipe.bt,
        aeroPressStyle: recipe.ap,
        isCustom: recipe.cu,
        customTitle: recipe.ct,
        stages: recipe.st.map(([atSeconds, label, detail, waterMl]) => ({ atSeconds, label, detail, waterMl })),
      })),
      ...(coffees.length ? { c: coffees } : {}),
    };
  } catch {
    return null;
  }
}

export default function RecipeShareScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { state, importRecipes } = useCoffee();
  const recipes = useMemo(() => [...state.customRecipes, ...state.favoriteRecipes], [state.customRecipes, state.favoriteRecipes]);
  const [mode, setMode] = useState<Mode>('create');
  const [stage, setStage] = useState<Stage>('choose');
  const [selected, setSelected] = useState<string[]>([]);
  const [includeCoffees, setIncludeCoffees] = useState(true);
  const [incoming, setIncoming] = useState<SharePayload | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const sender = state.profile.username.trim() || t('shareAnonymous');
  const chosen = recipes.filter((recipe) => selected.includes(recipe.id));
  const chosenCoffees = includeCoffees
    ? [...new Map(chosen
      .map((recipe) => [...state.coffees, ...state.archivedCoffees].find((coffee) => coffee.id === recipe.coffeeId))
      .filter((coffee): coffee is Coffee => Boolean(coffee))
      .map((coffee) => [coffee.id, coffee])).values()]
    : [];
  const qrValue = encodePayload(sender, chosen, chosenCoffees);
  const qrTooLarge = qrValue.length > 2600;

  const switchMode = (next: Mode) => {
    setMode(next);
    setIncoming(null);
    setStage(next === 'create' ? 'choose' : 'camera');
  };

  const onScanned = ({ data }: { data: string }) => {
    if (stage !== 'camera') return;
    const parsed = decodePayload(data);
    if (!parsed) {
      setStage('invalid');
      return;
    }
    setIncoming(parsed);
    setStage('preview');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: insets.bottom + 36, paddingHorizontal: 22 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle eyebrow={t('shareEyebrow')} title={t('shareTitle')} subtitle={t('shareSubtitle')} action={<IconButton icon="x" label={t('close')} onPress={() => router.back()} />} />
        <View style={styles.tabs}>
          <ChoicePill label={t('shareCreateTab')} selected={mode === 'create'} onPress={() => switchMode('create')} icon="grid" />
          <ChoicePill label={t('shareScanTab')} selected={mode === 'scan'} onPress={() => switchMode('scan')} icon="camera" />
        </View>

        {mode === 'create' && stage === 'choose' ? (
          <View style={styles.section}>
            <SectionLabel>{t('shareChoose')}</SectionLabel>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>{t('shareChooseHelper')}</Text>
            {recipes.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground, borderColor: colors.border }]}>{t('shareNoRecipes')}</Text> : recipes.map((recipe) => {
              const localized = translateRecipe(recipe, t);
              const checked = selected.includes(recipe.id);
              return (
                <Pressable
                  key={recipe.id}
                  onPress={() => setSelected((current) => checked ? current.filter((id) => id !== recipe.id) : current.length < 3 ? [...current, recipe.id] : current)}
                  style={[styles.recipe, { borderColor: checked ? colors.blue : colors.border, backgroundColor: checked ? colors.blueSoft : colors.card }]}
                >
                  <View style={styles.recipeCopy}>
                    <Text style={[styles.recipeTitle, { color: colors.foreground }]}>{localized.title}</Text>
                    <Text style={[styles.recipeMeta, { color: colors.mutedForeground }]}>{localized.coffeeName} · {translateMethod(localized.method, t)} · {localized.coffeeGrams}g / {localized.waterMl}ml</Text>
                  </View>
                  <Text style={[styles.check, { color: checked ? colors.blue : colors.mutedForeground }]}>{checked ? '✓' : '○'}</Text>
                </Pressable>
              );
            })}
            {selected.length > 0 ? (
              <View style={styles.coffeeChoice}>
                <SectionLabel>{t('shareCoffeeChoice')}</SectionLabel>
                <Text style={[styles.helper, { color: colors.mutedForeground }]}>{t('shareCoffeeChoiceHelper')}</Text>
                <View style={styles.choiceRow}>
                  <ChoicePill label={t('shareIncludeCoffee')} selected={includeCoffees} onPress={() => setIncludeCoffees(true)} />
                  <ChoicePill label={t('shareRecipesOnly')} selected={!includeCoffees} onPress={() => setIncludeCoffees(false)} />
                </View>
              </View>
            ) : null}
            {qrTooLarge ? <Text style={[styles.sizeWarning, { color: colors.destructive }]}>{t('shareTooLarge')}</Text> : null}
            {recipes.length > 0 ? <PrimaryButton label={selected.length ? t('shareSelectedCount', { count: selected.length }) : t('shareShowCode')} icon="grid" disabled={!selected.length || qrTooLarge} onPress={() => setStage('code')} style={{ marginTop: 20 }} /> : null}
          </View>
        ) : null}

        {mode === 'create' && stage === 'code' ? (
          <View style={styles.centerSection}>
            <Text style={[styles.codeTitle, { color: colors.foreground }]}>{t('shareQrTitle', { name: sender })}</Text>
            <Text style={[styles.centerHelper, { color: colors.mutedForeground }]}>{t('shareQrHelper')}</Text>
            <View style={styles.qrCard}><QRCode value={qrValue} size={260} ecl="L" backgroundColor="#ffffff" color="#2c201b" /></View>
            <PrimaryButton label={t('shareChangeSelection')} icon="edit-3" onPress={() => setStage('choose')} style={{ marginTop: 24 }} />
          </View>
        ) : null}

        {mode === 'scan' && stage === 'camera' ? (
          <View style={styles.centerSection}>
            {!permission?.granted ? (
              <>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>{t('shareCameraPermission')}</Text>
                <PrimaryButton label={t('shareAllowCamera')} icon="camera" onPress={() => void requestPermission()} style={{ marginTop: 22 }} />
              </>
            ) : (
              <>
                <Text style={[styles.codeTitle, { color: colors.foreground }]}>{t('shareCameraTitle')}</Text>
                <Text style={[styles.centerHelper, { color: colors.mutedForeground }]}>{t('shareCameraHelper')}</Text>
                <View style={[styles.cameraFrame, { borderColor: colors.blue }]}>
                  <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={onScanned} />
                </View>
              </>
            )}
          </View>
        ) : null}

        {mode === 'scan' && stage === 'invalid' ? (
          <View style={styles.centerSection}>
            <Text style={[styles.codeTitle, { color: colors.foreground }]}>{t('shareInvalidCode')}</Text>
            <PrimaryButton label={t('shareTryAgain')} icon="camera" onPress={() => setStage('camera')} style={{ marginTop: 22 }} />
          </View>
        ) : null}

        {mode === 'scan' && stage === 'preview' && incoming ? (
          <View style={styles.section}>
            <ScreenTitle title={t('shareImportTitle', { name: incoming.n || t('shareAnonymous') })} subtitle={incoming.r.length === 1 ? t('shareImportOne', { name: incoming.n || t('shareAnonymous'), recipe: translateRecipe(incoming.r[0], t).title }) : t('shareImportPrompt', { name: incoming.n || t('shareAnonymous'), count: incoming.r.length })} />
            <View style={styles.previewList}>
              {incoming.r.map((recipe) => {
                const localized = translateRecipe(recipe, t);
                return <View key={recipe.id} style={[styles.previewRecipe, { borderBottomColor: colors.border }]}><Text style={[styles.recipeTitle, { color: colors.foreground }]}>{localized.title}</Text><Text style={[styles.recipeMeta, { color: colors.mutedForeground }]}>{localized.coffeeName} · {translateMethod(localized.method, t)} · {localized.coffeeGrams}g / {localized.waterMl}ml</Text></View>;
              })}
            </View>
            {incoming.c?.length ? <Text style={[styles.helper, { color: colors.mutedForeground }]}>{t('shareImportCoffees', { count: incoming.c.length })}</Text> : null}
            <PrimaryButton label={t('shareImport')} icon="download" onPress={() => { importRecipes(incoming.r, incoming.c); setStage('done'); }} />
          </View>
        ) : null}

        {mode === 'scan' && stage === 'done' && incoming ? (
          <View style={styles.centerSection}>
            <Text style={[styles.success, { color: colors.success }]}>✓</Text>
            <Text style={[styles.codeTitle, { color: colors.foreground }]}>{t('shareImported', { count: incoming.r.length })}</Text>
            <PrimaryButton label={t('shareDone')} icon="check" onPress={() => router.replace('/(tabs)')} style={{ marginTop: 22 }} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flexDirection: 'row', gap: 9, marginTop: 26 },
  section: { marginTop: 30 },
  centerSection: { marginTop: 38, alignItems: 'center' },
  helper: { fontSize: 13, lineHeight: 19, marginTop: -2, marginBottom: 14 },
  coffeeChoice: { marginTop: 12, marginBottom: 4 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  centerHelper: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, maxWidth: 310 },
  empty: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 24, fontSize: 14, lineHeight: 21 },
  recipe: { minHeight: 76, borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recipeCopy: { flex: 1 },
  recipeTitle: { fontSize: 15, fontWeight: '700' },
  recipeMeta: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  check: { fontSize: 23, fontWeight: '700' },
  codeTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', textAlign: 'center' },
  qrCard: { padding: 18, backgroundColor: '#ffffff', borderRadius: 20, marginTop: 24 },
  cameraFrame: { width: 292, height: 292, borderWidth: 3, borderRadius: 24, overflow: 'hidden', marginTop: 24 },
  previewList: { marginVertical: 22 },
  previewRecipe: { paddingVertical: 14, borderBottomWidth: 1 },
  success: { fontSize: 54, fontWeight: '700', marginBottom: 14 },
  sizeWarning: { fontSize: 13, lineHeight: 19, marginTop: 10 },
});
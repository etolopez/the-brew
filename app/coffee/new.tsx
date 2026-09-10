import React, { useRef, useState } from 'react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoicePill, Field, IconButton, PrimaryButton, ScreenTitle, SectionLabel } from '@/components/CoffeeUI';
import { coffeeImages } from '@/components/CoffeeUI';
import { Coffee, CoffeeHue, ImageKey, translateProcess, translateRoast, useCoffee } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/context/LocaleContext';

const processes = [
  'Washed',
  'Honey',
  'White Honey',
  'Yellow Honey',
  'Red Honey',
  'Black Honey',
  'Natural',
  'Anaerobic',
  'Lactic Fermentation',
  'Carbonic Maceration',
  'Thermal Shock',
  'Double Fermentation',
  'Co-fermented',
];
const roasts = ['Light', 'Light-medium', 'Medium'];

function ArchivedCoffeeRow({ coffee, onRestore, onDelete }: { coffee: Coffee; onRestore: () => void; onDelete: () => void }) {
  const colors = useColors();
  const { t } = useLocale();
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => translateX.setValue(Math.max(-92, Math.min(0, gesture.dx))),
    onPanResponderRelease: (_, gesture) => {
      Animated.spring(translateX, {
        toValue: gesture.dx < -42 || gesture.vx < -0.45 ? -92 : 0,
        useNativeDriver: false,
        bounciness: 0,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start();
    },
  })).current;

  return (
    <View style={[styles.archiveSwipe, { borderTopColor: colors.border }]}>
      <Pressable accessibilityLabel={t('coffeeDeleteAcc', { name: coffee.name })} onPress={onDelete} style={[styles.deleteAction, { backgroundColor: colors.destructive }]}>
        <Ionicons name="trash-outline" size={18} color={colors.cream} />
        <Text style={[styles.deleteLabel, { color: colors.cream }]}>{t('coffeeDelete')}</Text>
      </Pressable>
      <Animated.View {...panResponder.panHandlers} style={[styles.archiveRow, { backgroundColor: colors.card, transform: [{ translateX }] }]}>
        <View style={styles.archiveCopy}>
          <Text style={[styles.archiveName, { color: colors.foreground }]}>{coffee.name}</Text>
          <Text style={[styles.archiveMeta, { color: colors.mutedForeground }]}>{coffee.variety === 'Not specified' ? t('coffeeUnspecified') : coffee.variety} · {coffee.zone}</Text>
        </View>
        <Pressable onPress={onRestore}><Text style={[styles.restore, { color: colors.blue }]}>{t('coffeeRestore')}</Text></Pressable>
      </Animated.View>
    </View>
  );
}

export default function NewCoffeeScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { id, onboarding } = useLocalSearchParams<{ id?: string; onboarding?: string }>();
  const isOnboarding = onboarding === '1';
  
  const imageOptions: { key: ImageKey; label: string; description: string }[] = [
    { key: 'still', label: t('coffeeImageStill'), description: t('coffeeImageStillDesc') },
    { key: 'farm', label: t('coffeeImageFarm'), description: t('coffeeImageFarmDesc') },
    { key: 'harvest', label: t('coffeeImageHarvest'), description: t('coffeeImageHarvestDesc') },
  ];
  const hueOptions: { key: CoffeeHue; label: string }[] = [
    { key: 'coffee', label: t('hueCoffee') },
    { key: 'blue', label: t('hueBlue') },
    { key: 'sage', label: t('hueSage') },
    { key: 'terracotta', label: t('hueTerracotta') },
    { key: 'gold', label: t('hueGold') },
    { key: 'plum', label: t('huePlum') },
  ];
  const { state, addCoffee, updateCoffee, restoreCoffee, deleteArchivedCoffee } = useCoffee();
  const existing = id ? [...state.coffees, ...state.archivedCoffees].find((coffee) => coffee.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [farm, setFarm] = useState(existing?.farm ?? '');
  const [zone, setZone] = useState(existing?.zone ?? '');
  const [altitude, setAltitude] = useState(existing?.altitude.replace(/\D/g, '') ?? '');
  const [variety, setVariety] = useState(existing?.variety ?? '');
  const [process, setProcess] = useState(existing?.process ?? 'Washed');
  const [roast, setRoast] = useState(existing?.roast ?? 'Light');
  const [flavors, setFlavors] = useState(existing?.flavors.join(', ') ?? '');
  const [image, setImage] = useState<ImageKey>(existing?.image ?? state.defaultCoffeeImage);
  const [hue, setHue] = useState<CoffeeHue>(existing?.hue ?? 'coffee');

  const save = () => {
    if (!name.trim()) return;
    const coffee = {
      name: name.trim(),
      farm: farm.trim() || t('coffeeUnknownFarm'),
      zone: zone.trim() || t('coffeeCR'),
      country: t('coffeeCR'),
      altitude: altitude.trim() || '—',
      variety: variety.trim() || 'Not specified',
      process,
      roast,
      flavors: flavors.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 5),
      image,
      hue,
    };
    if (existing) updateCoffee(existing.id, coffee);
    else addCoffee(coffee);
    if (isOnboarding) router.replace('/(tabs)');
    else router.back();
  };

  const close = () => {
    if (isOnboarding) router.replace('/(tabs)');
    else router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: insets.bottom + 36, paddingHorizontal: 22 }} showsVerticalScrollIndicator={false} bottomOffset={24}>
        <ScreenTitle eyebrow={existing ? t('coffeeEditEyebrow') : t('coffeeNewEyebrow')} title={existing ? t('coffeeEditTitle') : t('coffeeNewTitle')} subtitle={isOnboarding ? t('coffeeFirstSubtitle') : t('coffeeSubtitle')} action={<IconButton icon="x" label={t('close')} onPress={close} />} />
        {!existing && state.archivedCoffees.length > 0 ? (
          <View style={[styles.archive, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <SectionLabel>{t('coffeeFromArchive')}</SectionLabel>
            <Text style={[styles.archiveHint, { color: colors.mutedForeground }]}>{t('coffeeSwipeDelete')}</Text>
            {state.archivedCoffees.map((coffee) => (
              <ArchivedCoffeeRow key={coffee.id} coffee={coffee} onRestore={() => restoreCoffee(coffee.id)} onDelete={() => deleteArchivedCoffee(coffee.id)} />
            ))}
          </View>
        ) : null}
        <View style={styles.form}>
          <Field label={t('coffeeNameLabel')} placeholder={t('coffeeNamePh')} value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label={t('coffeeFarmLabel')} placeholder={t('coffeeFarmPh')} value={farm} onChangeText={setFarm} autoCapitalize="words" />
          <Field label={t('coffeeZoneLabel')} placeholder={t('coffeeZonePh')} value={zone} onChangeText={setZone} autoCapitalize="words" />
          <Field
            label={t('coffeeAltLabel')}
            placeholder={t('coffeeAltPh')}
            value={altitude}
            onChangeText={(value) => setAltitude(value.replace(/\D/g, ''))}
            keyboardType="number-pad"
          />
          <Field label={t('coffeeVarLabel')} placeholder={t('coffeeVarPh')} value={variety} onChangeText={setVariety} autoCapitalize="words" />
          <View style={styles.choiceSection}>
            <SectionLabel>{t('coffeeProcessLabel')}</SectionLabel>
            <View style={styles.wrap}>{processes.map((item) => <ChoicePill key={item} label={translateProcess(item, t)} selected={process === item} onPress={() => setProcess(item)} />)}</View>
          </View>
          <View style={styles.choiceSection}>
            <SectionLabel>{t('coffeeRoastLabel')}</SectionLabel>
            <View style={styles.wrap}>{roasts.map((item) => <ChoicePill key={item} label={translateRoast(item, t)} selected={roast === item} onPress={() => setRoast(item)} />)}</View>
          </View>
          <Field label={t('coffeeFlavorLabel')} placeholder={t('coffeeFlavorPh')} value={flavors} onChangeText={setFlavors} autoCapitalize="none" />
          <View style={styles.choiceSection}>
            <SectionLabel>{t('coffeeImageLabel')}</SectionLabel>
            <View style={styles.imageChoices}>
              {imageOptions.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => setImage(option.key)}
                  style={({ pressed }) => [
                    styles.imageChoice,
                    { backgroundColor: image === option.key ? colors.blueSoft : colors.card, borderColor: image === option.key ? colors.blue : colors.border },
                    pressed && { opacity: 0.78 },
                  ]}
                >
                  <Image source={coffeeImages[option.key]} style={styles.imageThumb} />
                  <View style={styles.imageChoiceCopy}>
                    <Text style={[styles.imageChoiceLabel, { color: colors.foreground }]}>{option.label}</Text>
                    <Text style={[styles.imageChoiceDescription, { color: colors.mutedForeground }]}>{option.description}</Text>
                  </View>
                  {image === option.key ? <Ionicons name="checkmark-circle" size={21} color={colors.blue} /> : null}
                </Pressable>
              ))}
            </View>
            <SectionLabel>{t('coffeeHueLabel')}</SectionLabel>
            <View style={styles.wrap}>
              {hueOptions.map((option) => {
                const swatch =
                  option.key === 'blue' ? '#285D78'
                    : option.key === 'sage' ? '#536B52'
                      : option.key === 'terracotta' ? '#B8614B'
                        : option.key === 'gold' ? '#C28A35'
                          : option.key === 'plum' ? '#76506E'
                            : colors.coffeeDeep;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setHue(option.key)}
                    style={({ pressed }) => [
                      styles.hueChoice,
                      { backgroundColor: hue === option.key ? colors.blueSoft : colors.card, borderColor: hue === option.key ? colors.blue : colors.border },
                      pressed && { opacity: 0.78 },
                    ]}
                  >
                    <View style={[styles.hueSwatch, { backgroundColor: swatch }]} />
                    <Text style={[styles.hueLabel, { color: colors.foreground }]}>{option.label}</Text>
                    {hue === option.key ? <Ionicons name="checkmark" size={16} color={colors.blue} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
        <PrimaryButton label={existing ? t('coffeeSave') : t('coffeeAddShelf')} onPress={save} disabled={!name.trim()} icon={existing ? 'check' : 'plus'} />
        <Text style={[styles.note, { color: colors.mutedForeground }]}>{t('coffeeNote')}</Text>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  archive: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 28 },
  archiveHint: { fontSize: 11, lineHeight: 16, marginTop: -5, marginBottom: 8 },
  archiveSwipe: { minHeight: 57, borderTopWidth: 1, overflow: 'hidden' },
  archiveRow: { minHeight: 57, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  archiveCopy: { flex: 1 },
  archiveName: { fontSize: 14, fontWeight: '700' },
  archiveMeta: { fontSize: 12, marginTop: 4 },
  restore: { fontSize: 12, fontWeight: '700' },
  deleteAction: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 92, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  deleteLabel: { fontSize: 12, fontWeight: '700' },
  form: { marginTop: 33 },
  choiceSection: { marginBottom: 24 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageChoices: { gap: 10, marginBottom: 20 },
  imageChoice: { minHeight: 76, width: '100%', borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageThumb: { width: 58, height: 56, borderRadius: 12 },
  imageChoiceCopy: { flex: 1 },
  imageChoiceLabel: { fontSize: 14, fontWeight: '700' },
  imageChoiceDescription: { fontSize: 12, marginTop: 4 },
  hueChoice: { minHeight: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  hueSwatch: { width: 14, height: 14, borderRadius: 7 },
  hueLabel: { fontSize: 13, fontWeight: '700' },
  note: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 14, paddingHorizontal: 30 },
});
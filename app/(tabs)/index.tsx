import React, { useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoffeeHero, Divider, IconButton, PrimaryButton, SectionLabel } from '@/components/CoffeeUI';
import { adaptRecipeToProfile, BrewRecipe, translateGrinder, translateMethod, useCoffee, translateRecipe } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';
import { useLocale } from '@/context/LocaleContext';

function SwipeRecipeRow({ recipe, onBrew, onRename, onDelete, brewDisabled = false }: { recipe: BrewRecipe; onBrew: () => void; onRename: () => void; onDelete: () => void; brewDisabled?: boolean }) {
  const colors = useColors();
  const { t } = useLocale();
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => translateX.setValue(Math.max(-156, Math.min(0, gesture.dx))),
    onPanResponderRelease: (_, gesture) => Animated.spring(translateX, { toValue: gesture.dx < -45 || gesture.vx < -0.45 ? -156 : 0, useNativeDriver: false, bounciness: 0 }).start(),
    onPanResponderTerminate: () => Animated.spring(translateX, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start(),
  })).current;
  const close = (action: () => void) => Animated.spring(translateX, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start(action);

  return (
    <View style={[styles.recipeSwipe, { borderBottomColor: colors.border }]}>
      <View style={styles.recipeBehind}>
        <Pressable accessibilityLabel={t('recipeRenameAcc', { name: recipe.title })} onPress={() => close(onRename)} style={[styles.recipeSwipeAction, { backgroundColor: colors.blue }]}>
          <Ionicons name="pencil-outline" size={18} color={colors.cream} />
          <Text style={[styles.recipeActionLabel, { color: colors.cream }]}>{t('recipeRename')}</Text>
        </Pressable>
        <Pressable accessibilityLabel={t('recipeDeleteAcc', { name: recipe.title })} onPress={() => close(onDelete)} style={[styles.recipeSwipeAction, { backgroundColor: colors.destructive }]}>
          <Ionicons name="trash-outline" size={18} color={colors.cream} />
          <Text style={[styles.recipeActionLabel, { color: colors.cream }]}>{t('recipeDelete')}</Text>
        </Pressable>
      </View>
      <Animated.View {...panResponder.panHandlers} style={[styles.recipeRow, { backgroundColor: colors.background, transform: [{ translateX }] }]}>
        <View style={[styles.recipeDot, { backgroundColor: colors.blueSoft }]}><Text style={[styles.recipeDotText, { color: colors.blue }]}>{recipe.method.slice(0, 1)}</Text></View>
        <View style={styles.recipeCopy}><Text style={[styles.recipeName, { color: colors.foreground }]}>{recipe.title}</Text><Text style={[styles.recipeMeta, { color: colors.mutedForeground }]}>{recipe.coffeeName} · {translateMethod(recipe.method, t)}</Text><Text style={[styles.recipeSetting, { color: colors.mutedForeground }]}>{translateGrinder(recipe.grinder, t)} · {t('settingLabel', { setting: recipe.grindSetting })}</Text></View>
        <Text onPress={brewDisabled ? undefined : onBrew} style={[styles.arrow, { color: brewDisabled ? colors.mutedForeground : colors.blue }, brewDisabled && styles.arrowDisabled]}>→</Text>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { state, setActiveBrew, archiveCoffee, renameRecipe, deleteRecipe } = useCoffee();
  const [editingRecipe, setEditingRecipe] = useState<BrewRecipe | null>(null);
  const [recipeName, setRecipeName] = useState('');
  
  const date = new Date();
  const days = [t('daySun'), t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat')];
  const dayName = days[date.getDay()].toUpperCase();

  const featured = state.coffees[0];
  const latestRaw = state.brewLogs[0];
  const latest = latestRaw ? { ...latestRaw, recipe: translateRecipe(latestRaw.recipe, t) } : undefined;
  const savedRecipes = [...state.favoriteRecipes, ...state.customRecipes].map(r => translateRecipe(r, t));
  const renderCoffeeCard = (coffee: typeof featured, index: number) => coffee ? (
    <View key={coffee.id} style={index === 0 ? styles.featuredCard : styles.smallCoffee}>
      <CoffeeHero
        image={coffee.image}
        name={coffee.name}
        zone={coffee.zone}
        variety={coffee.variety === 'Not specified' ? t('coffeeUnspecified') : coffee.variety}
        hue={coffee.hue}
        onPress={() => router.push({ pathname: '/brew/setup', params: { coffeeId: coffee.id } })}
      />
      <View style={[styles.cardActions, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable onPress={() => router.push({ pathname: '/coffee/new', params: { id: coffee.id } })}><Text style={[styles.cardAction, { color: colors.blue }]}>{t('homeEdit')}</Text></Pressable>
        <Pressable onPress={() => archiveCoffee(coffee.id)}><Text style={[styles.cardAction, { color: colors.destructive }]}>{t('homeRemoveShelf')}</Text></Pressable>
      </View>
    </View>
  ) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.coffee }]}>{dayName} · COSTA RICA</Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>{state.profile.username ? t('homeGreeting', { name: state.profile.username }) : t('homeTitle')}</Text>
          </View>
          <IconButton icon="sliders" label={t('homeSetupLabel')} onPress={() => router.push('/gear')} />
        </View>

        <View style={styles.content}>
          <PrimaryButton label={t('homeStartBrew')} icon="play" onPress={() => router.push('/brew/setup')} disabled={state.coffees.length === 0} />

          <View style={styles.section}>
            <SectionLabel action={<Text onPress={() => router.push('/coffee/new')} style={[styles.link, { color: colors.blue }]}>{t('homeAddCoffee')}</Text>}>{t('homeYourShelf')}</SectionLabel>
            {featured ? renderCoffeeCard(featured, 0) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('homeAddFirstCoffee')}
                onPress={() => router.push('/coffee/new')}
                style={({ pressed }) => [styles.coffeePlaceholder, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.78 }]}
              >
                <View style={[styles.placeholderImage, { backgroundColor: colors.blueSoft }]}>
                  <Ionicons name="cafe-outline" size={46} color={colors.blue} />
                  <View style={[styles.placeholderPlus, { backgroundColor: colors.blue }]}>
                    <Ionicons name="add" size={18} color={colors.cream} />
                  </View>
                </View>
                <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>{t('homeAddFirstCoffee')}</Text>
                <Text style={[styles.placeholderCopy, { color: colors.mutedForeground }]}>{t('homeEmptyShelfCopy')}</Text>
              </Pressable>
            )}
            {state.coffees.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coffeeRail}>
                {state.coffees.slice(1).map((coffee, index) => renderCoffeeCard(coffee, index + 1))}
              </ScrollView>
            ) : null}
          </View>

          <View style={styles.section}>
            <SectionLabel action={<View style={styles.recipeActions}><Text onPress={() => router.push('/recipe/share' as never)} style={[styles.link, { color: colors.blue }]}>{t('homeShareRecipes')}</Text><Text onPress={() => router.push('/recipe/new')} style={[styles.link, { color: colors.blue }]}>{t('homeNewRecipe')}</Text></View>}>{t('homeSavedLater')}</SectionLabel>
            {savedRecipes.length === 0 ? (
              <View style={[styles.empty, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('homeEmptyRecipesTitle')}</Text>
                <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>{t('homeEmptyRecipesCopy')}</Text>
              </View>
            ) : (
              savedRecipes.map((recipe) => (
                <SwipeRecipeRow
                  key={recipe.id}
                  recipe={recipe}
                  onBrew={() => { setActiveBrew(adaptRecipeToProfile(recipe, state.profile, t)); router.push('/brew/timer'); }}
                  brewDisabled={state.coffees.length === 0}
                  onRename={() => { setEditingRecipe(recipe); setRecipeName(recipe.title); }}
                  onDelete={() => deleteRecipe(recipe.id)}
                />
              ))
            )}
          </View>

          {latest ? (
            <View style={styles.section}>
              <SectionLabel>{t('homeLastCup')}</SectionLabel>
              <View style={[styles.lastCup, { backgroundColor: colors.card }]}>
                <View style={styles.lastCupTop}><Text style={[styles.lastCupName, { color: colors.foreground }]}>{latest.recipe.coffeeName}</Text><Text style={[styles.rating, { color: colors.coffee }]}>{'★'.repeat(latest.rating)}</Text></View>
                <Text style={[styles.lastCupMeta, { color: colors.mutedForeground }]}>{translateMethod(latest.recipe.method, t)} · {latest.recipe.waterMl}ml · {latest.recipe.title} · {Math.floor(latest.durationSeconds / 60).toString().padStart(2, '0')}:{(latest.durationSeconds % 60).toString().padStart(2, '0')}</Text>
                <Text style={[styles.recipeSetting, { color: colors.mutedForeground }]}>{translateGrinder(latest.recipe.grinder, t)} · {t('settingLabel', { setting: latest.recipe.grindSetting })}</Text>
                {latest.note ? <Text style={[styles.lastCupNote, { color: colors.foreground }]}>{latest.note}</Text> : null}
              </View>
            </View>
          ) : null}

          <Divider />
          <Text style={[styles.footnote, { color: colors.mutedForeground }]}>{t('homeFootnote')}</Text>
        </View>
      </ScrollView>
      <Modal visible={!!editingRecipe} transparent animationType="fade" onRequestClose={() => setEditingRecipe(null)}>
        <View style={styles.modalScrim}>
          <View style={[styles.renameCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.renameTitle, { color: colors.foreground }]}>{t('recipeRenameTitle')}</Text>
            <TextInput value={recipeName} onChangeText={setRecipeName} autoFocus maxLength={60} selectTextOnFocus style={[styles.renameInput, { color: colors.foreground, borderColor: colors.input }]} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditingRecipe(null)}><Text style={[styles.modalLink, { color: colors.mutedForeground }]}>{t('recipeCancel')}</Text></Pressable>
              <Pressable onPress={() => { if (editingRecipe && recipeName.trim()) renameRecipe(editingRecipe.id, recipeName.trim()); setEditingRecipe(null); }}><Text style={[styles.modalLink, { color: colors.blue }]}>{t('recipeSaveName')}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 22, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: 8 },
  heading: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, maxWidth: 270, lineHeight: 33 },
  content: { paddingHorizontal: 22, marginTop: 27 },
  section: { marginTop: 34 },
  link: { fontSize: 13, fontWeight: '700' },
  recipeActions: { flexDirection: 'row', gap: 14 },
  coffeeRail: { gap: 12, paddingTop: 12 },
  smallCoffee: { width: 270 },
  featuredCard: { width: '100%' },
  cardActions: { minHeight: 42, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardAction: { fontSize: 12, fontWeight: '700' },
  coffeePlaceholder: { minHeight: 238, borderWidth: 1, borderRadius: 20, padding: 22, alignItems: 'center', justifyContent: 'center' },
  placeholderImage: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  placeholderPlus: { position: 'absolute', right: 4, bottom: 5, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  placeholderTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center' },
  placeholderCopy: { fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 270, textAlign: 'center' },
  empty: { paddingVertical: 22, borderTopWidth: 1, borderBottomWidth: 1 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyCopy: { fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 310 },
  recipeSwipe: { minHeight: 70, borderBottomWidth: 1, overflow: 'hidden' },
  recipeBehind: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row', justifyContent: 'flex-end' },
  recipeSwipeAction: { width: 78, alignItems: 'center', justifyContent: 'center', gap: 3 },
  recipeActionLabel: { fontSize: 10, fontWeight: '700' },
  recipeRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recipeDot: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  recipeDotText: { fontSize: 17, fontWeight: '700' },
  recipeCopy: { flex: 1 },
  recipeName: { fontSize: 15, fontWeight: '700' },
  recipeMeta: { fontSize: 12, marginTop: 4 },
  recipeSetting: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  arrow: { fontSize: 22, paddingLeft: 8 },
  arrowDisabled: { opacity: 0.35 },
  lastCup: { padding: 17, borderRadius: 17 },
  lastCupTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lastCupName: { fontSize: 16, fontWeight: '700', flex: 1 },
  rating: { fontSize: 14, letterSpacing: 1 },
  lastCupMeta: { fontSize: 13, marginTop: 7 },
  lastCupNote: { fontSize: 14, lineHeight: 20, marginTop: 12 },
  footnote: { textAlign: 'center', fontSize: 12, marginTop: 22 },
  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  renameCard: { width: '100%', borderRadius: 20, padding: 20 },
  renameTitle: { fontSize: 20, fontWeight: '700' },
  renameInput: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 16, marginTop: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 20 },
  modalLink: { fontSize: 14, fontWeight: '700', paddingVertical: 6 },
});

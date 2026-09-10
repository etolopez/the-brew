import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { CoffeeHue } from '@/context/CoffeeContext';
import { useColors } from '@/hooks/useColors';

import { useLocale } from '@/context/LocaleContext';

export const coffeeImages: Record<string, ImageSourcePropType> = {
  still: require('@/assets/images/coffee-still-life.jpg'),
  farm: require('@/assets/images/costa-rica-farm.jpg'),
  harvest: require('@/assets/images/coffee-harvest.jpg'),
};

export function ScreenTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleCopy}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.coffee }]}>{eyebrow}</Text> : null}
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  label: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityLabel={label}
      testID={`icon-${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.card }, pressed && { opacity: 0.65 }]}
    >
      <Feather name={icon} size={20} color={colors.foreground} />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon = 'arrow-up-right',
  style,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      testID={`button-${label}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: disabled ? colors.muted : colors.coffeeDeep },
        style,
        pressed && !disabled && { opacity: 0.78, transform: [{ scale: 0.985 }] },
      ]}
    >
      <Text style={[styles.primaryLabel, { color: disabled ? colors.mutedForeground : colors.cream }]}>{label}</Text>
      <Feather name={icon} size={18} color={disabled ? colors.mutedForeground : colors.cream} />
    </Pressable>
  );
}

export function ChoicePill({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choicePill,
        { borderColor: selected ? colors.blue : colors.border, backgroundColor: selected ? colors.blueSoft : 'transparent' },
        style,
        pressed && { opacity: 0.72 },
      ]}
    >
      {icon ? <Feather name={icon} size={16} color={selected ? colors.blue : colors.mutedForeground} /> : null}
      <Text style={[styles.choiceText, { color: selected ? colors.accentForeground : colors.foreground }]}>{label}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={16} color={colors.blue} /> : null}
    </Pressable>
  );
}

export function SectionLabel({ children, action }: { children: string; action?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{children}</Text>
      {action}
    </View>
  );
}

export function CoffeeImage({
  image,
  height = 160,
  radius = 18,
  width = '100%',
}: {
  image: 'still' | 'farm' | 'harvest';
  height?: number;
  radius?: number;
  width?: number | `${number}%`;
}) {
  return <Image source={coffeeImages[image]} style={{ height, width, borderRadius: radius }} />;
}

export function CoffeeHero({
  image,
  name,
  zone,
  variety,
  hue,
  tone = 'brown',
  onPress,
}: {
  image: 'still' | 'farm' | 'harvest';
  name: string;
  zone: string;
  variety?: string;
  hue?: CoffeeHue;
  tone?: 'brown' | 'blue' | 'sage';
  onPress: () => void;
}) {
  const colors = useColors();
  const { t } = useLocale();
  const selectedHue = hue ?? tone;
  const gradientColor =
    selectedHue === 'blue' ? '#285D78e6'
      : selectedHue === 'sage' ? '#536B52e6'
        : selectedHue === 'terracotta' ? '#9A4F3De6'
          : selectedHue === 'gold' ? '#9A6B20e6'
            : selectedHue === 'plum' ? '#65445Fe6'
              : `${colors.coffeeDeep}e6`;
  const kicker = t('heroKicker');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.hero, pressed && { opacity: 0.88 }]}>
      <Image source={coffeeImages[image]} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', gradientColor]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.heroCopy}>
        <Text style={[styles.heroKicker, { color: colors.cream }]}>{kicker}</Text>
        <Text style={[styles.heroName, { color: colors.cream }]}>{name}</Text>
        <Text style={[styles.heroMeta, { color: colors.cream }]}>{zone} · {variety ?? 'Costa Rica'}</Text>
      </View>
    </Pressable>
  );
}

export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label: string; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={[styles.fieldWrap, style]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.field, { color: colors.foreground, borderBottomColor: colors.input }]}
      />
    </View>
  );
}

export function Divider() {
  const colors = useColors();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

export const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  titleCopy: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.7, marginBottom: 8 },
  screenTitle: { fontSize: 32, lineHeight: 37, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  iconButton: { height: 42, width: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { minHeight: 56, paddingHorizontal: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  primaryLabel: { fontSize: 16, fontWeight: '700', letterSpacing: -0.1 },
  choicePill: { minHeight: 46, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  choiceText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  hero: { height: 235, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  heroCopy: { padding: 20 },
  heroKicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.7, marginBottom: 7 },
  heroName: { fontSize: 27, fontWeight: '700', letterSpacing: -0.5 },
  heroMeta: { fontSize: 13, marginTop: 6, opacity: 0.9 },
  fieldWrap: { marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 7 },
  field: { minHeight: 42, borderBottomWidth: 1, fontSize: 16, paddingVertical: 7 },
  divider: { height: 1, width: '100%' },
});
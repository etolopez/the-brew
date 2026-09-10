import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { TranslationFunction, Dictionary } from './LocaleContext';

export type ImageKey = 'still' | 'farm' | 'harvest';
export type CoffeeHue = 'coffee' | 'blue' | 'sage' | 'terracotta' | 'gold' | 'plum';
export type BrewGoal = 'bright' | 'sweet' | 'body';
export type AeroPressStyle = 'standard' | 'inverted';

export type Coffee = {
  id: string;
  name: string;
  farm: string;
  zone: string;
  country: string;
  altitude: string;
  process: string;
  roast: string;
  variety: string;
  flavors: string[];
  image: ImageKey;
  hue: CoffeeHue;
};

export type BrewStage = {
  atSeconds: number;
  label: string;
  detail: string;
  waterMl: number;
};

export type BrewRecipe = {
  id: string;
  coffeeId: string;
  coffeeName: string;
  method: string;
  filter: string;
  grinder: string;
  grindSetting: string;
  temperature: number;
  coffeeGrams: number;
  waterMl: number;
  ratio: string;
  title: string;
  description: string;
  grindRationale?: string;
  filterRationale?: string;
  goal: BrewGoal;
  brewTimeSeconds: number;
  aeroPressStyle?: AeroPressStyle;
  isCustom?: boolean;
  customTitle?: boolean;
  stages: BrewStage[];
};

export type BrewLog = {
  id: string;
  recipe: BrewRecipe;
  rating: number;
  foundFlavors: string[];
  note: string;
  saved: boolean;
  durationSeconds: number;
  createdAt: string;
};

export type RecipeLearning = {
  attempts: number;
  averageDurationSeconds: number;
  bestRating: number;
};

export type BrewProfile = {
  username: string;
  grinder: string;
  methods: string[];
  filters: Record<string, string>;
};

export type BrewState = {
  setupComplete: boolean;
  profile: BrewProfile;
  coffees: Coffee[];
  archivedCoffees: Coffee[];
  defaultCoffeeImage: ImageKey;
  favoriteRecipes: BrewRecipe[];
  customRecipes: BrewRecipe[];
  brewLogs: BrewLog[];
  learning: Record<string, RecipeLearning>;
  activeBrew: BrewRecipe | null;
  activeElapsedSeconds: number;
};

export const GRINDERS = [
  '1Zpresso Q2',
  '1Zpresso K-Ultra',
  'Comandante C40',
  'Timemore C3',
  'Fellow Ode',
  'Baratza Encore',
  'Hario Skerton',
  'Porlex Mini',
  'Electric grinder',
  'Hand grinder',
  'Other',
];

export const METHODS = [
  'V60',
  'Kalita Wave',
  'Chemex',
  'AeroPress',
  'French Press',
  'Clever Dripper',
  'Origami',
  'Moka Pot',
  'Siphon',
  'Hario Switch',
];

export const FILTERS = ['Paper', 'Cloth', 'Metal'];

const FILTERS_BY_METHOD: Record<string, string[]> = {
  V60: ['Paper', 'Cloth', 'Metal'],
  'Kalita Wave': ['Paper', 'Metal'],
  Chemex: ['Paper', 'Metal'],
  AeroPress: ['Paper', 'Metal'],
  'French Press': ['Metal'],
  'Clever Dripper': ['Paper', 'Cloth', 'Metal'],
  Origami: ['Paper', 'Cloth', 'Metal'],
  'Moka Pot': ['Metal'],
  Siphon: ['Cloth', 'Paper', 'Metal'],
  'Hario Switch': ['Paper', 'Cloth', 'Metal'],
};

export function makeI18nMarker(key: keyof Dictionary, params?: Record<string, string | number>) {
  return `__i18n__${JSON.stringify({ key, params })}`;
}

export function parseI18nMarker(text: string, t: TranslationFunction): string {
  if (!text) return text;
  if (text.startsWith('__i18n__')) {
    try {
      const parsed = JSON.parse(text.replace('__i18n__', ''));
      return t(parsed.key, parsed.params);
    } catch {
      return text;
    }
  }
  // known fallbacks
  const exactMatches: Record<string, keyof Dictionary> = {
    'New step': 'customNewStep',
    'Nuevo paso': 'customNewStep',
    'Add your instructions.': 'customNewDetail',
    'Añade tus instrucciones.': 'customNewDetail',
    'Untitled step': 'customUntitled',
    'Paso sin título': 'customUntitled',
    'Follow this step.': 'customFollowStep',
    'Sigue este paso.': 'customFollowStep',
    'A personal recipe': 'customPersonal',
    'Una receta personal': 'customPersonal',
    'Bloom': 'stagePourBloomLabel',
    'Pre-infusión': 'stagePourBloomLabel',
    'First pour': 'stagePour1Label',
    'Primer vertido': 'stagePour1Label',
    'Second pour': 'stagePour2Label',
    'Segundo vertido': 'stagePour2Label',
    'Final pour': 'stagePourFinalLabel',
    'Último vertido': 'stagePourFinalLabel',
    'Add coffee & water': 'stageAeroStdAddLabel',
    'Añade café y agua': 'stageAeroStdAddLabel',
    'Stir & steep': 'stageAeroStdStirLabel',
    'Mezcla y remoja': 'stageAeroStdStirLabel',
    'Press slowly': 'stageAeroStdPressLabel',
    'Presiona lento': 'stageAeroStdPressLabel',
    'Build inverted': 'stageAeroInvBuildLabel',
    'Arma invertido': 'stageAeroInvBuildLabel',
    'Cap & invert': 'stageAeroInvCapLabel',
    'Pon la tapa': 'stageAeroInvCapLabel',
    'Pour all water': 'stageFpPourLabel',
    'Verte toda el agua': 'stageFpPourLabel',
    'Break the crust': 'stageFpBreakLabel',
    'Rompe la costra': 'stageFpBreakLabel',
    'Press & serve': 'stageFpPressLabel',
    'Presiona y sirve': 'stageFpPressLabel'
  };
  if (exactMatches[text]) return t(exactMatches[text]);

  const dynamicMatches: Array<[RegExp, keyof Dictionary, (match: RegExpMatchArray) => Record<string, string | number>]> = [
    [/^Keep AeroPress inverted\. Add ([\d.]+)g coffee and ([\d.]+)ml water\.$/, 'stageAeroInvBuildDetail', (m) => ({ grams: m[1], water: m[2] })],
    [/^Mantén el AeroPress invertido\. Añade ([\d.]+)g de café y ([\d.]+)ml de agua\.$/, 'stageAeroInvBuildDetail', (m) => ({ grams: m[1], water: m[2] })],
    [/^Add ([\d.]+)g coffee, then pour ([\d.]+)ml water\.$/, 'stageAeroStdAddDetail', (m) => ({ grams: m[1], water: m[2] })],
    [/^Añade ([\d.]+)g de café, luego verte ([\d.]+)ml de agua\.$/, 'stageAeroStdAddDetail', (m) => ({ grams: m[1], water: m[2] })],
    [/^Begin with ([\d.]+)ml and let the coffee open\.$/, 'stagePourBloomDetailDyn', (m) => ({ bloom: m[1] })],
    [/^Inicia con ([\d.]+)ml y deja que el café se abra\.$/, 'stagePourBloomDetailDyn', (m) => ({ bloom: m[1] })],
    [/^Slowly pour to ([\d.]+)ml\.$/, 'stagePour1DetailKalita', (m) => ({ first: m[1] })],
    [/^Verte despacio hasta los ([\d.]+)ml\.$/, 'stagePour1DetailKalita', (m) => ({ first: m[1] })],
    [/^Finish at ([\d.]+)ml and let it draw down\.$/, 'stagePourFinalDetailV60', (m) => ({ water: m[1] })],
    [/^Termina en ([\d.]+)ml y deja que drene\.$/, 'stagePourFinalDetailV60', (m) => ({ water: m[1] })],
  ];
  for (const [pattern, key, params] of dynamicMatches) {
    const match = text.match(pattern);
    if (match) return t(key, params(match));
  }

  const staticDetails: Record<string, keyof Dictionary> = {
    'Put the cap on, push out the air, then invert and wait.': 'stageAeroInvCapDetail',
    'Pon la tapa, expulsa el aire, inviértelo y espera.': 'stageAeroInvCapDetail',
    'Invert onto your cup and press gently.': 'stageAeroInvPressDetailDyn',
    'Inviértelo en tu taza y presiona suavemente.': 'stageAeroInvPressDetailDyn',
    'Stir gently, then place the cap on top.': 'stageAeroStdStirDetailDyn',
    'Mezcla suavemente, luego coloca la tapa encima.': 'stageAeroStdStirDetailDyn',
    'Press gently and stop when you hear the hiss.': 'stageAeroStdPressDetail',
    'Presiona suavemente y detente cuando escuches el silbido.': 'stageAeroStdPressDetail',
  };
  if (staticDetails[text]) return t(staticDetails[text]);
  
  return text;
}

export function translateProcess(process: string, t: TranslationFunction) {
  const map: Record<string, keyof Dictionary> = {
    'Washed': 'processWashed',
    'Lavado': 'processWashed',
    'Honey': 'processHoney',
    'Miel': 'processHoney',
    'Yellow Honey': 'processYellowHoney',
    'Miel Amarilla': 'processYellowHoney',
    'White Honey': 'processWhiteHoney',
    'Miel Blanca': 'processWhiteHoney',
    'Natural': 'processNatural',
    'Anaerobic': 'processAnaerobic',
    'Anaeróbico': 'processAnaerobic',
    'Red Honey': 'processRedHoney',
    'Miel Roja': 'processRedHoney',
    'Black Honey': 'processBlackHoney',
    'Miel Negra': 'processBlackHoney',
    'Lactic Fermentation': 'processLactic',
    'Fermentación Láctica': 'processLactic',
    'Carbonic Maceration': 'processCarbonic',
    'Maceración Carbónica': 'processCarbonic',
    'Thermal Shock': 'processThermalShock',
    'Choque Térmico': 'processThermalShock',
    'Double Fermentation': 'processDoubleFermentation',
    'Doble Fermentación': 'processDoubleFermentation',
    'Co-fermented': 'processCoFermented',
    'Cofermentado': 'processCoFermented',
  };
  return map[process] ? t(map[process]) : process;
}

export function translateRoast(roast: string, t: TranslationFunction) {
  const map: Record<string, keyof Dictionary> = {
    'Light': 'roastLight',
    'Claro': 'roastLight',
    'Light-medium': 'roastLightMedium',
    'Medio-claro': 'roastLightMedium',
    'Medium': 'roastMedium',
    'Medio': 'roastMedium'
  };
  return map[roast] ? t(map[roast]) : roast;
}

export function translateGrinder(grinder: string, t: TranslationFunction) {
  const map: Record<string, keyof Dictionary> = {
    'Electric grinder': 'grinderElectric',
    'Molino eléctrico': 'grinderElectric',
    'Hand grinder': 'grinderHand',
    'Molino manual': 'grinderHand',
    'Other': 'grinderOther',
    'Otro': 'grinderOther'
  };
  return map[grinder] ? t(map[grinder]) : grinder;
}

export function translateMethod(method: string, t: TranslationFunction) {
  const map: Record<string, keyof Dictionary> = {
    'French Press': 'brewerFrenchPress',
    'Prensa Francesa': 'brewerFrenchPress',
    'Clever Dripper': 'brewerCleverDripper',
    'Moka Pot': 'brewerMokaPot',
    'Cafetera Moka': 'brewerMokaPot',
    'Siphon': 'brewerSiphon',
    'Sifón': 'brewerSiphon'
  };
  return map[method] ? t(map[method]) : method;
}

export function translateFilterName(filter: string, t: TranslationFunction) {
  const map: Record<string, keyof Dictionary> = {
    'Paper': 'filterPaper',
    'papel': 'filterPaper',
    'Cloth': 'filterCloth',
    'tela': 'filterCloth',
    'Metal': 'filterMetal',
    'metal': 'filterMetal',
    'No filter': 'filterNone',
    'Sin filtro': 'filterNone'
  };
  return map[filter] ? t(map[filter]) : filter;
}

export function translateUnit(unit: string, t: TranslationFunction) {
  const map: Record<string, keyof Dictionary> = {
    'clicks': 'unitClicks',
    'steps': 'unitSteps',
    'dial': 'unitDial'
  };
  return map[unit] ? t(map[unit]) : unit;
}

export function getCompatibleFilters(method: string) {
  return FILTERS_BY_METHOD[method] ?? ['Paper'];
}

export function getDefaultFilter(method: string) {
  if (method === 'French Press' || method === 'Moka Pot') return 'Metal';
  if (method === 'Siphon') return 'Cloth';
  return 'Paper';
}

export function resolveFilterForMethod(method: string, filter?: string) {
  const compatible = getCompatibleFilters(method);
  return filter && compatible.includes(filter) ? filter : getDefaultFilter(method);
}

type GrindBand = 'fine' | 'medium-fine' | 'medium' | 'medium-coarse' | 'coarse';
type GrinderScale = {
  unit: string;
  ranges: Record<GrindBand, [number, number]>;
  methodRanges?: Record<string, [number, number]>;
  filterStep?: number;
};

const GRIND_BANDS: GrindBand[] = ['fine', 'medium-fine', 'medium', 'medium-coarse', 'coarse'];
const GRINDER_SCALES: Record<string, GrinderScale> = {
  '1Zpresso Q2': { unit: 'clicks', ranges: { fine: [12, 14], 'medium-fine': [16, 18], medium: [19, 21], 'medium-coarse': [21, 23], coarse: [23, 25] } },
  '1Zpresso K-Ultra': {
    unit: 'dial',
    ranges: { fine: [3, 5], 'medium-fine': [5, 7], medium: [6, 8], 'medium-coarse': [8, 9], coarse: [9, 10] },
    methodRanges: {
      V60: [6, 8],
      'Kalita Wave': [6.5, 8],
      Chemex: [8, 9],
      AeroPress: [4, 6],
      'French Press': [8.5, 10],
      'Clever Dripper': [6, 8],
      Origami: [6, 8],
      'Moka Pot': [3, 5],
      Siphon: [5, 7],
      'Hario Switch': [6, 8],
    },
    filterStep: 0.5,
  },
  'Comandante C40': { unit: 'clicks', ranges: { fine: [10, 15], 'medium-fine': [18, 24], medium: [22, 26], 'medium-coarse': [25, 30], coarse: [30, 35] } },
  'Timemore C3': { unit: 'clicks', ranges: { fine: [10, 13], 'medium-fine': [16, 20], medium: [18, 22], 'medium-coarse': [20, 24], coarse: [24, 28] } },
  'Fellow Ode': { unit: 'dial', ranges: { fine: [1, 2], 'medium-fine': [3, 5], medium: [5, 6], 'medium-coarse': [7, 8], coarse: [9, 10] } },
  'Baratza Encore': { unit: 'steps', ranges: { fine: [8, 12], 'medium-fine': [18, 22], medium: [20, 24], 'medium-coarse': [24, 27], coarse: [27, 31] } },
  'Hario Skerton': { unit: 'steps', ranges: { fine: [1, 2], 'medium-fine': [2, 3], medium: [3, 4], 'medium-coarse': [4, 6], coarse: [6, 8] } },
  'Porlex Mini': { unit: 'clicks', ranges: { fine: [5, 7], 'medium-fine': [7, 9], medium: [8, 10], 'medium-coarse': [10, 12], coarse: [12, 14] } },
};

function getBaseGrindBand(method: string): GrindBand {
  if (method === 'Moka Pot') return 'fine';
  if (method === 'AeroPress' || method === 'V60' || method === 'Origami' || method === 'Siphon') return 'medium-fine';
  if (method === 'Chemex') return 'medium-coarse';
  if (method === 'French Press') return 'coarse';
  return 'medium';
}

export function getFilterGuidance(method: string, filter: string, t: TranslationFunction) {
  if (filter === 'Metal') {
    return {
      bandOffset: method === 'Moka Pot' || method === 'French Press' ? 0 : -1,
      timeScale: ['V60', 'Kalita Wave', 'Chemex', 'Origami', 'Hario Switch'].includes(method) ? 0.94 : 1,
      rationale: t('filterGuidanceMetal'),
    };
  }
  if (filter === 'Cloth') {
    return {
      bandOffset: 1,
      timeScale: ['V60', 'Clever Dripper', 'Origami', 'Hario Switch'].includes(method) ? 1.06 : 1,
      rationale: t('filterGuidanceCloth'),
    };
  }
  if (filter === 'No filter') {
    return {
      bandOffset: 1,
      timeScale: 1,
      rationale: t('filterGuidanceNo'),
    };
  }
  return {
    bandOffset: 0,
    timeScale: 1,
    rationale: t('filterGuidancePaper'),
  };
}

export function getGrindRecommendation(grinder: string, method: string, filter: string, goal: BrewGoal = 'sweet', t: TranslationFunction) {
  const baseBand = getBaseGrindBand(method);
  const filterGuidance = getFilterGuidance(method, filter, t);
  const adjustedIndex = Math.min(GRIND_BANDS.length - 1, Math.max(0, GRIND_BANDS.indexOf(baseBand) + filterGuidance.bandOffset));
  const band = GRIND_BANDS[adjustedIndex];
  const scale = GRINDER_SCALES[grinder];
  
  const goalDirection = goal === 'bright' ? t('grindRecCoarserEnd') : goal === 'body' ? t('grindRecFinerEnd') : t('grindRecMiddle');
  
  const grindBandKeys: Record<GrindBand, keyof Dictionary> = {
    fine: 'grindBandFine',
    'medium-fine': 'grindBandMedFine',
    medium: 'grindBandMed',
    'medium-coarse': 'grindBandMedCoarse',
    coarse: 'grindBandCoarse',
  };
  const baseBandTranslated = t(grindBandKeys[baseBand]);
  const bandTranslated = t(grindBandKeys[band]);
  const filterTranslated = translateFilterName(filter, t).toLowerCase();
  const methodTranslated = translateMethod(method, t);

  if (!scale) {
    return {
      setting: t('grindRecSettingFallback', { band: bandTranslated, direction: goalDirection }),
      rationale: t('grindRecRationaleFallback', { method: methodTranslated, baseBand: baseBandTranslated, filter: filterTranslated, band: bandTranslated, direction: goalDirection }),
    };
  }
  const methodRange = scale.methodRanges?.[method];
  const filterShift = methodRange ? filterGuidance.bandOffset * (scale.filterStep ?? 1) : 0;
  const [minimum, maximum] = methodRange
    ? [Math.max(0, methodRange[0] + filterShift), Math.min(10, methodRange[1] + filterShift)]
    : scale.ranges[band];
  const start = goal === 'bright' ? maximum : goal === 'body' ? minimum : Math.round((minimum + maximum) / 2);
  const unitTranslated = translateUnit(scale.unit, t);
  return {
    setting: t('grindRecSetting', { min: minimum, max: maximum, unit: unitTranslated, start }),
    rationale: t('grindRecRationale', { method: methodTranslated, baseBand: baseBandTranslated, filter: filterTranslated, band: bandTranslated, goal: t(`goal${goal.charAt(0).toUpperCase() + goal.slice(1)}` as any).toLowerCase() }),
  };
}

export function adaptRecipeToProfile(recipe: BrewRecipe, profile: BrewProfile, t: TranslationFunction): BrewRecipe {
  const filter = resolveFilterForMethod(recipe.method, profile.filters[recipe.method]);
  const previousFilter = resolveFilterForMethod(recipe.method, recipe.filter);
  const previousFilterGuidance = getFilterGuidance(recipe.method, previousFilter, t);
  const nextFilterGuidance = getFilterGuidance(recipe.method, filter, t);
  const grindRecommendation = getGrindRecommendation(profile.grinder, recipe.method, filter, recipe.goal, t);
  const timingScale = nextFilterGuidance.timeScale / previousFilterGuidance.timeScale;
  const sameEquipment = recipe.grinder === profile.grinder && previousFilter === filter;
  return {
    ...recipe,
    id: `${recipe.id}|gear:${profile.grinder}|filter:${filter}`,
    grinder: profile.grinder,
    filter,
    grindSetting: sameEquipment ? recipe.grindSetting : grindRecommendation.setting,
    grindRationale: sameEquipment ? recipe.grindRationale : grindRecommendation.rationale,
    filterRationale: nextFilterGuidance.rationale,
    brewTimeSeconds: scaleBrewSeconds(recipe.brewTimeSeconds, timingScale),
    stages: recipe.stages.map((stage) => ({ ...stage, atSeconds: scaleBrewSeconds(stage.atSeconds, timingScale) })),
  };
}

export function getDoseTimeScale(method: string, fromDose: number, toDose: number) {
  if (fromDose <= 0 || toDose <= 0) return 1;
  const pourOverMethods = ['V60', 'Kalita Wave', 'Chemex', 'Origami', 'Hario Switch'];
  const exponent = pourOverMethods.includes(method) ? 0.55 : method === 'Moka Pot' ? 0.4 : 0.22;
  return Math.min(1.8, Math.max(0.65, Math.pow(toDose / fromDose, exponent)));
}

function scaleBrewSeconds(seconds: number, scale: number) {
  if (seconds === 0) return 0;
  return Math.max(5, Math.round((seconds * scale) / 5) * 5);
}

export function resizeRecipeDose(recipe: BrewRecipe, coffeeGrams: number): BrewRecipe {
  if (!Number.isFinite(coffeeGrams) || coffeeGrams <= 0 || recipe.coffeeGrams <= 0 || recipe.waterMl <= 0) return recipe;
  const roundedGrams = Math.round(coffeeGrams * 10) / 10;
  if (roundedGrams === recipe.coffeeGrams) return recipe;
  const waterMl = Math.round((recipe.waterMl / recipe.coffeeGrams) * roundedGrams);
  const timeScale = getDoseTimeScale(recipe.method, recipe.coffeeGrams, roundedGrams);
  const oldDosePattern = String(recipe.coffeeGrams).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const replaceMeasurements = (detail: string, oldWater: number, nextWater: number) =>
    detail
      .replace(new RegExp(`${oldDosePattern}(?=g\\b)`, 'g'), String(roundedGrams))
      .replace(new RegExp(`${oldWater}(?=ml\\b)`, 'g'), String(nextWater));
  return {
    ...recipe,
    id: `${recipe.id}|dose:${roundedGrams}`,
    coffeeGrams: roundedGrams,
    waterMl,
    brewTimeSeconds: scaleBrewSeconds(recipe.brewTimeSeconds, timeScale),
    stages: recipe.stages.map((stage) => {
      const nextWater = Math.round((stage.waterMl / recipe.waterMl) * waterMl);
      return {
        ...stage,
        atSeconds: scaleBrewSeconds(stage.atSeconds, timeScale),
        waterMl: nextWater,
        detail: replaceMeasurements(stage.detail, stage.waterMl, nextWater),
      };
    }),
  };
}

export function applyLearnedDuration(recipe: BrewRecipe, durationSeconds: number): BrewRecipe {
  if (durationSeconds <= 0 || recipe.brewTimeSeconds <= 0) return recipe;
  const scale = durationSeconds / recipe.brewTimeSeconds;
  return {
    ...recipe,
    brewTimeSeconds: durationSeconds,
    stages: recipe.stages.map((stage) => ({ ...stage, atSeconds: scaleBrewSeconds(stage.atSeconds, scale) })),
  };
}

const initialState: BrewState = {
  setupComplete: false,
  profile: {
    username: '',
    grinder: GRINDERS[0],
    methods: ['V60', 'Kalita Wave'],
    filters: { V60: 'Paper', 'Kalita Wave': 'Paper' },
  },
  coffees: [],
  archivedCoffees: [],
  defaultCoffeeImage: 'still',
  favoriteRecipes: [],
  customRecipes: [],
  brewLogs: [],
  learning: {},
  activeBrew: null,
  activeElapsedSeconds: 0,
};

export function buildRecipe(
  coffee: Coffee,
  method: string,
  filter: string,
  grinder: string,
  goal: BrewGoal,
  coffeeGramsOverride?: number,
  aeroPressStyle: AeroPressStyle = 'standard',
  t?: TranslationFunction,
): BrewRecipe {
  const fallbackT: TranslationFunction = (key, params) => key as string; // Will only happen if caller forgets, shouldn't in our app
  const translator = t ?? fallbackT;

  const methodDefaults: Record<string, { temp: number; water: number; time: number }> = {
    V60: { temp: 92, water: 240, time: 165 },
    'Kalita Wave': { temp: 91, water: 240, time: 180 },
    Chemex: { temp: 93, water: 300, time: 240 },
    AeroPress: { temp: 90, water: 220, time: 120 },
    'French Press': { temp: 94, water: 300, time: 270 },
    'Clever Dripper': { temp: 92, water: 280, time: 210 },
    Origami: { temp: 92, water: 240, time: 165 },
    'Moka Pot': { temp: 90, water: 180, time: 210 },
    Siphon: { temp: 93, water: 300, time: 240 },
    'Hario Switch': { temp: 92, water: 250, time: 210 },
  };
  const base = methodDefaults[method] ?? methodDefaults.V60;
  const recipeFilter = resolveFilterForMethod(method, filter);
  const filterGuidance = getFilterGuidance(method, recipeFilter, translator);
  const grindRecommendation = getGrindRecommendation(grinder, method, recipeFilter, goal, translator);
  const goalCopy: Record<BrewGoal, { title: string; description: string; adjustment: number }> = {
    bright: {
      title: translator('recipeGoalBrightTitle'),
      description: translator('recipeGoalBrightDesc'),
      adjustment: 0,
    },
    sweet: {
      title: translator('recipeGoalSweetTitle'),
      description: translator('recipeGoalSweetDesc'),
      adjustment: 1,
    },
    body: {
      title: translator('recipeGoalBodyTitle'),
      description: translator('recipeGoalBodyDesc'),
      adjustment: 2,
    },
  };
  const copy = goalCopy[goal];
  const defaultCoffeeGrams = method === 'Chemex' || method === 'French Press' ? 20 : 15;
  const defaultWaterMl = base.water + copy.adjustment * 20;
  const ratio = Math.round(defaultWaterMl / defaultCoffeeGrams);
  const coffeeGrams = coffeeGramsOverride && coffeeGramsOverride > 0 ? coffeeGramsOverride : defaultCoffeeGrams;
  const waterMl = Math.round(coffeeGrams * ratio);
  const bloom = method === 'French Press' ? 0 : goal === 'body' ? 45 : goal === 'bright' ? 35 : 30;
  const firstPour = Math.round(waterMl * 0.45);
  const secondPour = Math.round(waterMl * 0.72);
  let stages: BrewStage[];
  let brewTimeSeconds = base.time;

  if (method === 'French Press') {
    stages = [
      { atSeconds: 0, label: translator('stageFpPourLabel'), detail: translator('stageFpPourDetail', { water: waterMl }), waterMl },
      { atSeconds: 240, label: translator('stageFpBreakLabel'), detail: translator('stageFpBreakDetail'), waterMl },
      { atSeconds: 255, label: translator('stageFpPressLabel'), detail: translator('stageFpPressDetail'), waterMl },
    ];
    brewTimeSeconds = 270;
  } else if (method === 'AeroPress') {
    if (aeroPressStyle === 'inverted') {
      stages = [
        { atSeconds: 0, label: translator('stageAeroInvBuildLabel'), detail: translator('stageAeroInvBuildDetail', { grams: coffeeGrams, water: waterMl }), waterMl },
        { atSeconds: 20, label: translator('stageAeroInvCapLabel'), detail: translator('stageAeroInvCapDetail'), waterMl },
        { atSeconds: 90, label: translator('stageAeroInvPressLabel'), detail: translator('stageAeroInvPressDetail'), waterMl },
      ];
    } else {
      stages = [
        { atSeconds: 0, label: translator('stageAeroStdAddLabel'), detail: translator('stageAeroStdAddDetail', { grams: coffeeGrams, water: waterMl }), waterMl },
        { atSeconds: 30, label: translator('stageAeroStdStirLabel'), detail: translator('stageAeroStdStirDetail'), waterMl },
        { atSeconds: 90, label: translator('stageAeroStdPressLabel'), detail: translator('stageAeroStdPressDetail'), waterMl },
      ];
    }
    brewTimeSeconds = 120;
  } else if (method === 'V60' && goal !== 'sweet') {
    stages = [
      { atSeconds: 0, label: translator('stagePourBloomLabel'), detail: translator('stagePourBloomDetailBody', { bloom }), waterMl: bloom },
      { atSeconds: 30, label: translator('stagePour1Label'), detail: translator('stagePour1DetailV60', { first: firstPour }), waterMl: firstPour },
      { atSeconds: goal === 'bright' ? 75 : 90, label: translator('stagePour2Label'), detail: translator('stagePour2DetailV60', { second: secondPour }), waterMl: secondPour },
      { atSeconds: goal === 'bright' ? 120 : 135, label: translator('stagePourFinalLabel'), detail: translator('stagePourFinalDetailV60', { water: waterMl }), waterMl },
    ];
    brewTimeSeconds = goal === 'bright' ? 195 : 225;
  } else if (method === 'Kalita Wave') {
    stages = [
      { atSeconds: 0, label: translator('stagePourBloomLabel'), detail: translator('stagePourBloomDetailOpen', { bloom }), waterMl: bloom },
      { atSeconds: 35, label: translator('stagePour1Label'), detail: translator('stagePour1DetailKalita', { first: firstPour }), waterMl: firstPour },
      { atSeconds: 80, label: translator('stagePour2Label'), detail: translator('stagePour2DetailKalita', { second: secondPour }), waterMl: secondPour },
      { atSeconds: 120, label: translator('stagePourFinalLabel'), detail: translator('stagePourFinalDetailV60', { water: waterMl }), waterMl },
    ];
    brewTimeSeconds = 195;
  } else {
    stages = [
      { atSeconds: 0, label: translator('stagePourBloomLabel'), detail: translator('stagePourBloomDetailSlow', { bloom }), waterMl: bloom },
      { atSeconds: 30, label: translator('stagePour1Label'), detail: translator('stagePour1DetailOther', { first: firstPour }), waterMl: firstPour },
      { atSeconds: 75, label: translator('stagePourFinalLabel'), detail: translator('stagePourFinalDetailOther', { water: waterMl }), waterMl },
    ];
  }
  const timeScale = getDoseTimeScale(method, defaultCoffeeGrams, coffeeGrams) * filterGuidance.timeScale;
  stages = stages.map((stage) => ({ ...stage, atSeconds: scaleBrewSeconds(stage.atSeconds, timeScale) }));
  brewTimeSeconds = scaleBrewSeconds(brewTimeSeconds, timeScale);
  return {
    id: `${coffee.id}-${method}-${goal}-${coffeeGrams}-${aeroPressStyle}-${grinder}-${recipeFilter}`,
    coffeeId: coffee.id,
    coffeeName: coffee.name,
    method,
    filter: recipeFilter,
    grinder,
    grindSetting: grindRecommendation.setting,
    grindRationale: grindRecommendation.rationale,
    filterRationale: filterGuidance.rationale,
    temperature: base.temp,
    coffeeGrams,
    waterMl,
    ratio: `1:${ratio}`,
    title: copy.title,
    description: copy.description,
    goal,
    brewTimeSeconds,
    aeroPressStyle: method === 'AeroPress' ? aeroPressStyle : undefined,
    stages,
  };
}

export function translateRecipe(recipe: BrewRecipe, t: TranslationFunction): BrewRecipe {
  if (recipe.isCustom) {
    return {
      ...recipe,
      title: parseI18nMarker(recipe.title, t),
      description: parseI18nMarker(recipe.description, t),
      stages: recipe.stages.map(stage => ({
        ...stage,
        label: parseI18nMarker(stage.label, t),
        detail: parseI18nMarker(stage.detail, t)
      }))
    };
  }
  
  const mockCoffee = { id: recipe.coffeeId, name: recipe.coffeeName } as Coffee;
  const built = buildRecipe(mockCoffee, recipe.method, recipe.filter, recipe.grinder, recipe.goal, recipe.coffeeGrams, recipe.aeroPressStyle, t);
  
  return {
    ...recipe,
    title: recipe.customTitle ? recipe.title : built.title,
    description: built.description,
    grindRationale: built.grindRationale,
    filterRationale: built.filterRationale,
    stages: recipe.stages.map((stage, index) => ({
      ...stage,
      label: built.stages[index]?.label ?? stage.label,
      detail: built.stages[index]?.detail ?? stage.detail,
    }))
  };
}

type CoffeeContextValue = {
  state: BrewState;
  hydrated: boolean;
  completeSetup: (profile: BrewProfile) => void;
  updateProfile: (profile: BrewProfile) => void;
  addCoffee: (coffee: Omit<Coffee, 'id'>) => void;
  updateCoffee: (id: string, coffee: Omit<Coffee, 'id'>) => void;
  archiveCoffee: (id: string) => void;
  restoreCoffee: (id: string) => void;
  deleteArchivedCoffee: (id: string) => void;
  setDefaultCoffeeImage: (image: ImageKey) => void;
  addCustomRecipe: (recipe: BrewRecipe) => void;
  importRecipes: (recipes: BrewRecipe[], coffees?: Coffee[]) => void;
  renameRecipe: (id: string, title: string) => void;
  deleteRecipe: (id: string) => void;
  setActiveBrew: (recipe: BrewRecipe | null) => void;
  setActiveElapsed: (seconds: number) => void;
  saveBrew: (log: Omit<BrewLog, 'id' | 'createdAt'>) => void;
};

const CoffeeContext = createContext<CoffeeContextValue | null>(null);
const STORAGE_KEY = 'brew-profile-state-v1';

export function CoffeeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BrewState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) {
          try {
            const stored = JSON.parse(value) as Partial<BrewState>;
            const storedMethods = stored.profile?.methods?.length ? stored.profile.methods : initialState.profile.methods;
            const normalizedProfile: BrewProfile = {
              username: stored.profile?.username ?? '',
              grinder: stored.profile?.grinder ?? initialState.profile.grinder,
              methods: storedMethods,
              filters: Object.fromEntries(storedMethods.map((method) => [method, resolveFilterForMethod(method, stored.profile?.filters?.[method])])),
            };
            setState({
              ...initialState,
              ...stored,
              setupComplete: normalizedProfile.username.trim().length > 0,
              profile: normalizedProfile,
              coffees: (stored.coffees ?? initialState.coffees)
                .filter((coffee) => !['hacienda-sonora', 'la-pastora', 'santa-maria'].includes(coffee.id))
                .map((coffee, index) => ({ ...coffee, variety: coffee.variety ?? 'Not specified', hue: coffee.hue ?? ['coffee', 'blue', 'sage'][index % 3] as CoffeeHue })),
              archivedCoffees: (stored.archivedCoffees ?? [])
                .filter((coffee) => !['hacienda-sonora', 'la-pastora', 'santa-maria'].includes(coffee.id))
                .map((coffee) => ({ ...coffee, variety: coffee.variety ?? 'Not specified', hue: coffee.hue ?? 'coffee' })),
              defaultCoffeeImage: stored.defaultCoffeeImage ?? 'still',
              customRecipes: stored.customRecipes ?? [],
              learning: stored.learning ?? {},
              activeElapsedSeconds: stored.activeElapsedSeconds ?? 0,
            });
          } catch {
            setState(initialState);
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const value = useMemo<CoffeeContextValue>(
    () => ({
      state,
      hydrated,
      completeSetup: (profile) => setState((current) => ({ ...current, setupComplete: profile.username.trim().length > 0, profile })),
      updateProfile: (profile) => setState((current) => ({ ...current, profile })),
      addCoffee: (coffee) =>
        setState((current) => ({
          ...current,
          coffees: [
            ...current.coffees,
            { ...coffee, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
          ],
        })),
      updateCoffee: (id, coffee) =>
        setState((current) => ({
          ...current,
          coffees: current.coffees.map((item) => item.id === id ? { ...coffee, id } : item),
          archivedCoffees: current.archivedCoffees.map((item) => item.id === id ? { ...coffee, id } : item),
        })),
      archiveCoffee: (id) =>
        setState((current) => {
          const coffee = current.coffees.find((item) => item.id === id);
          if (!coffee) return current;
          return {
            ...current,
            coffees: current.coffees.filter((item) => item.id !== id),
            archivedCoffees: [coffee, ...current.archivedCoffees.filter((item) => item.id !== id)],
          };
        }),
      restoreCoffee: (id) =>
        setState((current) => {
          const coffee = current.archivedCoffees.find((item) => item.id === id);
          if (!coffee) return current;
          return {
            ...current,
            coffees: [...current.coffees, coffee],
            archivedCoffees: current.archivedCoffees.filter((item) => item.id !== id),
          };
        }),
      deleteArchivedCoffee: (id) =>
        setState((current) => ({
          ...current,
          archivedCoffees: current.archivedCoffees.filter((item) => item.id !== id),
        })),
      setDefaultCoffeeImage: (defaultCoffeeImage) => setState((current) => ({ ...current, defaultCoffeeImage })),
      addCustomRecipe: (recipe) =>
        setState((current) => ({
          ...current,
          customRecipes: [recipe, ...current.customRecipes.filter((item) => item.id !== recipe.id)],
        })),
      importRecipes: (recipes, coffees = []) =>
        setState((current) => {
          const coffeeIds = new Map<string, string>();
          const importedCoffees = coffees.map((coffee, index) => {
            const id = `shared-coffee-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
            coffeeIds.set(coffee.id, id);
            return { ...coffee, id };
          });
          const imported = recipes.map((recipe, index) => ({
            ...recipe,
            id: `imported-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
            coffeeId: coffeeIds.get(recipe.coffeeId) ?? recipe.coffeeId,
          }));
          return {
            ...current,
            coffees: [...importedCoffees, ...current.coffees],
            customRecipes: [...imported, ...current.customRecipes],
          };
        }),
      renameRecipe: (id, title) =>
        setState((current) => ({
          ...current,
          favoriteRecipes: current.favoriteRecipes.map((recipe) => recipe.id === id ? { ...recipe, title, customTitle: true } : recipe),
          customRecipes: current.customRecipes.map((recipe) => recipe.id === id ? { ...recipe, title, customTitle: true } : recipe),
        })),
      deleteRecipe: (id) =>
        setState((current) => ({
          ...current,
          favoriteRecipes: current.favoriteRecipes.filter((recipe) => recipe.id !== id),
          customRecipes: current.customRecipes.filter((recipe) => recipe.id !== id),
        })),
      setActiveBrew: (activeBrew) => setState((current) => ({ ...current, activeBrew, activeElapsedSeconds: 0 })),
      setActiveElapsed: (seconds) => setState((current) => ({ ...current, activeElapsedSeconds: seconds })),
      saveBrew: (log) =>
        setState((current) => ({
          ...current,
          brewLogs: [
            { ...log, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString() },
            ...current.brewLogs,
          ],
          learning: {
            ...current.learning,
            [log.recipe.id]: {
              attempts: (current.learning[log.recipe.id]?.attempts ?? 0) + 1,
              averageDurationSeconds: Math.round(
                (((current.learning[log.recipe.id]?.averageDurationSeconds ?? log.durationSeconds) *
                  (current.learning[log.recipe.id]?.attempts ?? 0)) +
                  log.durationSeconds) /
                  ((current.learning[log.recipe.id]?.attempts ?? 0) + 1),
              ),
              bestRating: Math.max(current.learning[log.recipe.id]?.bestRating ?? 0, log.rating),
            },
          },
          favoriteRecipes: log.saved
            ? [log.recipe, ...current.favoriteRecipes.filter((recipe) => recipe.id !== log.recipe.id)]
            : current.favoriteRecipes,
          activeBrew: null,
        })),
    }),
    [hydrated, state],
  );

  return <CoffeeContext.Provider value={value}>{children}</CoffeeContext.Provider>;
}

export function useCoffee() {
  const context = useContext(CoffeeContext);
  if (!context) throw new Error('useCoffee must be used within CoffeeProvider');
  return context;
}
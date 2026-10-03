import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.resolve(__dirname, '../backend/src/data/indian-dishes.json');

const raw = fs.readFileSync(jsonPath, 'utf-8');
const dishes = JSON.parse(raw);

// Dish defaults and macro calculation rules
const enriched = dishes.map((dish) => {
  const kcal = dish.kcalPerStandardUnit || 150;

  // Determine family
  let family = dish.family || null;
  const nameLower = dish.name.toLowerCase();

  if (nameLower.includes('dosa')) family = 'dosa';
  else if (nameLower.includes('roti') || nameLower.includes('chapati') || nameLower.includes('phulka')) family = 'roti';
  else if (nameLower.includes('paratha')) family = 'paratha';
  else if (nameLower.includes('naan')) family = 'naan';
  else if (nameLower.includes('rice') || nameLower.includes('chawal') || nameLower.includes('pulao')) family = 'rice';
  else if (nameLower.includes('biryani')) family = 'rice';
  else if (nameLower.includes('dal') || nameLower.includes('sambar') || nameLower.includes('kadhi')) family = 'dal';
  else if (nameLower.includes('paneer')) family = 'paneer';
  else if (nameLower.includes('lassi')) family = 'lassi';
  else if (nameLower.includes('chutney')) family = 'chutney';

  // Determine boolean flags
  const isFried = dish.isFried !== undefined ? dish.isFried : (
    nameLower.includes('vada') || nameLower.includes('samosa') || nameLower.includes('bhature') ||
    nameLower.includes('kachori') || nameLower.includes('puri') || nameLower.includes('poori') ||
    nameLower.includes('jamun') || nameLower.includes('jalebi') || nameLower.includes('pakora') ||
    nameLower.includes('tikki')
  );

  const highOil = dish.highOil !== undefined ? dish.highOil : (
    isFried || nameLower.includes('butter') || nameLower.includes('makhani') ||
    nameLower.includes('biryani') || nameLower.includes('pav bhaji') || nameLower.includes('tikka masala') ||
    nameLower.includes('ghee')
  );

  const highSugar = dish.highSugar !== undefined ? dish.highSugar : (
    nameLower.includes('jamun') || nameLower.includes('rasgulla') || nameLower.includes('jalebi') ||
    nameLower.includes('kheer') || nameLower.includes('halwa') || nameLower.includes('sweet lassi') ||
    nameLower.includes('mango lassi')
  );

  // Estimate macros based on category & kcal
  let protein = dish.proteinGPerUnit || Math.round(kcal * 0.05);
  let carbs = dish.carbsGPerUnit || Math.round(kcal * 0.12);
  let fat = dish.fatGPerUnit || Math.round(kcal * 0.04);
  let fiber = dish.fiberGPerUnit || Math.round(kcal * 0.015);

  if (dish.dietType === 'non_veg' || dish.dietType === 'egg' || nameLower.includes('paneer') || nameLower.includes('dal')) {
    protein = Math.max(protein, Math.round(kcal * 0.08));
  }

  const dishId = dish.dishId || nameLower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return {
    dishId,
    name: dish.name,
    family,
    aliases: dish.aliases || [],
    category: dish.category || 'general',
    defaultUnit: dish.defaultUnit || 'piece',
    kcalPerStandardUnit: kcal,
    proteinGPerUnit: protein,
    carbsGPerUnit: carbs,
    fatGPerUnit: fat,
    fiberGPerUnit: fiber,
    isFried,
    highOil,
    highSugar,
    oneLineDescription: dish.oneLineDescription || '',
    dietType: dish.dietType || 'veg',
  };
});

// Ensure required family variant additions exist
const extraVariants = [
  { dishId: 'dosa-onion', name: 'Onion Dosa', family: 'dosa', aliases: ['onion dosa', 'onion dosai'], category: 'south_indian', defaultUnit: 'piece', kcalPerStandardUnit: 210, proteinGPerUnit: 5, carbsGPerUnit: 34, fatGPerUnit: 6, fiberGPerUnit: 3, isFried: false, highOil: false, highSugar: false, oneLineDescription: 'Crispy rice crepe topped with finely chopped spiced onions', dietType: 'veg' },
  { dishId: 'dosa-set', name: 'Set Dosa', family: 'dosa', aliases: ['sponge dosa'], category: 'south_indian', defaultUnit: 'piece', kcalPerStandardUnit: 180, proteinGPerUnit: 4, carbsGPerUnit: 32, fatGPerUnit: 4, fiberGPerUnit: 2, isFried: false, highOil: false, highSugar: false, oneLineDescription: 'Soft spongey small dosas served in a set of three', dietType: 'veg' },
  { dishId: 'roti-butter', name: 'Butter Roti', family: 'roti', aliases: ['butter chapati'], category: 'north_indian', defaultUnit: 'piece', kcalPerStandardUnit: 110, proteinGPerUnit: 3, carbsGPerUnit: 15, fatGPerUnit: 5, fiberGPerUnit: 2, isFried: false, highOil: true, highSugar: false, oneLineDescription: 'Whole wheat roti brushed with fresh butter or ghee', dietType: 'veg' },
  { dishId: 'roti-tandoori', name: 'Tandoori Roti', family: 'roti', aliases: ['tandoor roti'], category: 'north_indian', defaultUnit: 'piece', kcalPerStandardUnit: 120, proteinGPerUnit: 4, carbsGPerUnit: 22, fatGPerUnit: 2, fiberGPerUnit: 3, isFried: false, highOil: false, highSugar: false, oneLineDescription: 'Clay oven baked whole wheat flatbread', dietType: 'veg' },
  { dishId: 'paratha-plain', name: 'Plain Paratha', family: 'paratha', aliases: ['paratha', 'tawa paratha'], category: 'north_indian', defaultUnit: 'piece', kcalPerStandardUnit: 220, proteinGPerUnit: 4, carbsGPerUnit: 28, fatGPerUnit: 10, fiberGPerUnit: 3, isFried: false, highOil: true, highSugar: false, oneLineDescription: 'Layered shallow-fried wheat flatbread', dietType: 'veg' },
  { dishId: 'rice-pulao', name: 'Veg Pulao', family: 'rice', aliases: ['pulao', 'vegetable pulao'], category: 'main_course', defaultUnit: 'plate', kcalPerStandardUnit: 290, proteinGPerUnit: 6, carbsGPerUnit: 48, fatGPerUnit: 8, fiberGPerUnit: 4, isFried: false, highOil: false, highSugar: false, oneLineDescription: 'Basmati rice cooked with mixed vegetables and whole aromatic spices', dietType: 'veg' },
];

extraVariants.forEach((v) => {
  if (!enriched.some((d) => d.dishId === v.dishId || d.name.toLowerCase() === v.name.toLowerCase())) {
    enriched.push(v);
  }
});

fs.writeFileSync(jsonPath, JSON.stringify(enriched, null, 2), 'utf-8');
console.log(`[ENRICHMENT] Successfully updated ${enriched.length} dishes in indian-dishes.json!`);

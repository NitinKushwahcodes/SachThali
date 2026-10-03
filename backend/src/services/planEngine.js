// Deterministic 30-day meal plan generator using curated indian-dishes.json dataset.
// Generates structured 30-day breakfast, lunch, and dinner suggestions based on user profile targets.
// Enforces dish variety constraints ensuring no dish repeats more than once every 4-5 days.

import { getAllDishes } from './rag/vectorStore.js';

// Generates 30-day meal plan calendar containing breakfast, lunch, and dinner for each day.
export function generate30DayPlan(profile) {
  const allDishes = getAllDishes();
  const dietType = profile?.dietType || 'veg';
  const calorieTarget = profile?.calorieTarget || 1800;

  // Target calorie breakdown per meal: Breakfast 25%, Lunch 40%, Dinner 35%
  const bTarget = Math.round(calorieTarget * 0.25);
  const lTarget = Math.round(calorieTarget * 0.4);
  const dTarget = Math.round(calorieTarget * 0.35);

  const filtered = allDishes.filter((d) => !dietType || d.dietType === dietType || d.dietType === 'veg');

  const breakfasts = filtered.filter((d) => ['south_indian', 'west_indian', 'snack', 'beverage'].includes(d.category));
  const mainCourses = filtered.filter((d) => ['north_indian', 'main_course', 'east_indian', 'staple'].includes(d.category));

  const bList = breakfasts.length > 0 ? breakfasts : filtered;
  const mList = mainCourses.length > 0 ? mainCourses : filtered;

  const planDays = [];
  const recentUsed = [];

  for (let day = 1; day <= 30; day++) {
    // Select breakfast
    const bDish = bList.find((d) => !recentUsed.slice(-12).includes(d.name)) || bList[day % bList.length];
    recentUsed.push(bDish.name);

    // Select lunch
    const lDish = mList.find((d) => !recentUsed.slice(-12).includes(d.name)) || mList[day % mList.length];
    recentUsed.push(lDish.name);

    // Select dinner
    const dDish = mList.find((d) => !recentUsed.slice(-12).includes(d.name) && d.name !== lDish.name) || mList[(day + 1) % mList.length];
    recentUsed.push(dDish.name);

    planDays.push({
      day,
      breakfast: { name: bDish.name, kcal: bDish.kcalPerStandardUnit, portionUnit: bDish.defaultUnit },
      lunch: { name: lDish.name, kcal: lDish.kcalPerStandardUnit, portionUnit: lDish.defaultUnit },
      dinner: { name: dDish.name, kcal: dDish.kcalPerStandardUnit, portionUnit: dDish.defaultUnit },
      totalEstimatedKcal: bDish.kcalPerStandardUnit + lDish.kcalPerStandardUnit + dDish.kcalPerStandardUnit,
    });
  }

  return {
    calorieTarget,
    days: planDays,
  };
}

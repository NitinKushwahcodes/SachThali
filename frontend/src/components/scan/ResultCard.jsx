// Rich scan result card component matching Phase 5 specification.
// Displays uploaded photo preview (object-fit: contain), AI meal description, family variant chips (clamped with View more toggle), estimated totals block, and quantity stepper table.
// Supports + / - quantity steppers, variant recomputation, Part H tier labels ("Eat Freely" 🥗, "Eat in Moderation" ⚖️, "Avoid Eating This" ⚠️) & buildTierReason captions.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../lib/apiClient';
import { Plus, Minus, Check, RotateCcw, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';

const tierBadges = {
  0: { label: 'Not Included', bg: 'bg-gray-100', text: 'text-gray-400', border: 'border-gray-200', dot: '⚪' },
  1: { label: 'Avoid Eating This ⚠️', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: '⚠️' },
  2: { label: 'Avoid Eating This ⚠️', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: '⚠️' },
  3: { label: 'Eat in Moderation ⚖️', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: '⚖️' },
  4: { label: 'Eat Freely 🥗', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', dot: '🥗' },
  5: { label: 'Eat Freely 🥗', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', dot: '🥗' },
  6: { label: 'No Food Detected 🚫', bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-300', dot: '🚫' },
};

function buildTierReason(item, totals) {
  if (item?.tierReason) return item.tierReason;
  const isHighKcal = (item?.kcal || 0) > 400;
  const isHighOil = item?.oilLevel === 'high';
  const isLowOil = item?.oilLevel === 'low';
  const tier = item?.tier || 3;

  if (tier >= 4) {
    return isLowOil ? 'Low oil & high nutrient density.' : 'Well balanced portion for your goal.';
  } else if (tier === 3) {
    return isHighKcal ? 'Moderate portion size, fits within budget if eaten in moderation.' : 'Watch oil and portion size.';
  } else {
    return isHighOil ? 'High oil content and heavy calorie density.' : 'High calorie load for a single item.';
  }
}

export function ResultCard({ scanResult, photoUrl, user, onConfirm, onRescan }) {
  const [items, setItems] = useState(scanResult?.items || []);
  const [totals, setTotals] = useState(scanResult?.totals || {
    kcal: scanResult?.totalKcal || 0,
    kcalMarginPercent: 25,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    tier: 3,
    tierLabel: 'Eat in Moderation ⚖️',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [expandedVariantsMap, setExpandedVariantsMap] = useState({});

  const mealDescription = scanResult?.mealDescription || 'Identified food plate';

  // Toggle expanded variant chips for a given item index
  const toggleExpandVariants = (index) => {
    setExpandedVariantsMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Recalculates aggregate meal totals after item quantity adjustments or variant swaps
  const refreshMealTotals = async (updatedItems) => {
    setIsUpdating(true);
    try {
      const activeItems = updatedItems.filter((i) => i.portionQty > 0);
      const res = await apiFetch('/scan/recompute-meal', {
        method: 'POST',
        body: JSON.stringify({ items: activeItems }),
      });
      setTotals(res);
    } catch (e) {
      const activeItems = updatedItems.filter((i) => i.portionQty > 0);
      const kcal = activeItems.reduce((s, i) => s + (i.kcal || 0), 0);
      const proteinG = activeItems.reduce((s, i) => s + (i.proteinG || 0), 0);
      const carbsG = activeItems.reduce((s, i) => s + (i.carbsG || 0), 0);
      const fatG = activeItems.reduce((s, i) => s + (i.fatG || 0), 0);
      const fiberG = activeItems.reduce((s, i) => s + (i.fiberG || 0), 0);
      setTotals((prev) => ({ ...prev, kcal, proteinG, carbsG, fatG, fiberG }));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handles quantity stepper (+ / -) adjustments
  const handleQuantityChange = async (index, delta) => {
    const currentItem = items[index];
    const newQty = Math.max(0, Math.min(20, (currentItem.portionQty || 1) + delta));

    if (newQty === 0) {
      const updated = [...items];
      updated[index] = {
        ...currentItem,
        portionQty: 0,
        portionText: `0 ${currentItem.portionUnit}`,
        kcal: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        tier: 0,
        tierLabel: 'Not Included',
      };
      setItems(updated);
      await refreshMealTotals(updated);
      return;
    }

    setIsUpdating(true);
    try {
      const newItem = await apiFetch('/scan/recompute-item', {
        method: 'POST',
        body: JSON.stringify({
          dishId: currentItem.dishId || currentItem.name,
          portionQty: newQty,
          portionUnit: currentItem.portionUnit,
          oilLevel: currentItem.oilLevel || 'normal',
        }),
      });

      const updated = [...items];
      updated[index] = {
        ...newItem,
        familyVariants: currentItem.familyVariants,
      };
      setItems(updated);
      await refreshMealTotals(updated);
    } catch (e) {
      console.warn('Quantity recomputation failed', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handles variant switching chip selection
  const handleVariantSwitch = async (index, variant) => {
    setIsUpdating(true);
    try {
      const currentItem = items[index];
      const targetQty = currentItem.portionQty === 0 ? 1 : currentItem.portionQty;

      const newItem = await apiFetch('/scan/recompute-item', {
        method: 'POST',
        body: JSON.stringify({
          dishId: variant.dishId,
          portionQty: targetQty,
          portionUnit: currentItem.portionUnit,
          oilLevel: currentItem.oilLevel || 'normal',
        }),
      });

      const updated = [...items];
      updated[index] = {
        ...newItem,
        familyVariants: currentItem.familyVariants,
      };
      setItems(updated);
      await refreshMealTotals(updated);
    } catch (e) {
      console.warn('Variant switch failed', e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirms and submits active items with single-click prevention
  const handleConfirmClick = async () => {
    if (isLogging) return;
    setIsLogging(true);
    const activeItems = items
      .filter((i) => i.portionQty > 0)
      .map((i) => ({
        ...i,
        dishName: i.dishName || i.name || 'Identified Dish',
      }));
    try {
      await onConfirm(activeItems, photoUrl);
    } finally {
      setIsLogging(false);
    }
  };

  const isNonFood = Boolean(scanResult?.isNonFood || totals?.isNonFood || totals?.tier === 6 || items.length === 0);
  const marginKcal = Math.round(totals.kcal * ((totals.kcalMarginPercent || 25) / 100));
  const mealBadge = isNonFood ? tierBadges[6] : (tierBadges[totals.tier] || tierBadges[3]);
  const hasActiveItems = items.some((i) => i.portionQty > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md max-w-md w-full space-y-6">
      {/* Photo Preview */}
      {photoUrl && (
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm max-h-56 bg-gray-900 flex items-center justify-center">
          <img src={photoUrl} alt="Uploaded meal scan" className="w-full h-56 object-contain" />
        </div>
      )}

      {/* 1. Meal Description */}
      <div className={`border rounded-2xl p-4 ${isNonFood ? 'bg-slate-100/90 border-slate-200' : 'bg-emerald-50/60 border-emerald-100'}`}>
        <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${isNonFood ? 'text-slate-600' : 'text-[#3F8F5F]'}`}>
          {isNonFood ? 'Scan Verdict 🚫' : 'Identified Meal'}
        </span>
        <p className="text-sm text-gray-800 font-medium leading-relaxed">
          "{mealDescription}"
        </p>
      </div>

      {/* Non-food explicit guidance alert */}
      {isNonFood && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1 font-semibold">
          <span className="font-bold block text-sm">💡 No food items recognized</span>
          <span>Iss photo mein koi khane ya pine ki chiz identify nahi hui. Kripya apne khane ke plate ki clear photo snap karein!</span>
        </div>
      )}

      {/* 2. Estimated Totals Block */}
      <div className={`bg-white border-2 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden ${isNonFood ? 'border-slate-300' : 'border-emerald-500/30'}`}>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Estimated Totals</span>
            <div className="text-3xl font-extrabold text-gray-900 mt-0.5 flex items-baseline gap-2">
              <span>{totals.kcal}</span>
              <span className="text-sm font-semibold text-gray-500">±{marginKcal} kcal</span>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full border ${mealBadge.bg} ${mealBadge.text} ${mealBadge.border} text-xs font-bold flex items-center gap-1.5 shadow-xs`}>
            <span>{mealBadge.dot}</span>
            <span>{mealBadge.label}</span>
          </div>
        </div>

        {/* Macro breakdown chips */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-center">
          <div className="bg-gray-50 rounded-xl p-2">
            <span className="text-[10px] text-gray-400 font-semibold block">Protein</span>
            <span className="text-sm font-extrabold text-gray-900">{totals.proteinG}g</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-2">
            <span className="text-[10px] text-gray-400 font-semibold block">Carbs</span>
            <span className="text-sm font-extrabold text-gray-900">{totals.carbsG}g</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-2">
            <span className="text-[10px] text-gray-400 font-semibold block">Fat</span>
            <span className="text-sm font-extrabold text-gray-900">{totals.fatG}g</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-2">
            <span className="text-[10px] text-gray-400 font-semibold block">Fiber</span>
            <span className="text-sm font-extrabold text-gray-900">{totals.fiberG}g</span>
          </div>
        </div>
      </div>

      {/* 3. Identified Foods Table with Quantity Steppers & Clamped Variant Chips */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-gray-900">Identified Foods</h3>
          <span className="text-[10px] text-gray-400 font-medium">Adjust quantity with + / −</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-2xl">
            No items in this meal scan.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const itemBadge = tierBadges[item.tier] || tierBadges[item.portionQty === 0 ? 0 : 3];
              const isExcluded = item.portionQty === 0;
              const variants = item.familyVariants || [];
              const isExpanded = !!expandedVariantsMap[idx];
              const visibleVariants = isExpanded ? variants : variants.slice(0, 4);

              return (
                <div
                  key={item.id || idx}
                  className={`border rounded-2xl p-4 space-y-3 transition-all ${
                    isExcluded ? 'bg-gray-100/60 border-gray-200 opacity-60' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Top row: Name & Confidence (left), Tier badge (right) */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-sm break-words ${isExcluded ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {item.name}
                        </span>
                        {!isExcluded && item.confidencePercent && (
                          <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold shrink-0">
                            {item.confidencePercent}% {item.confidenceLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border shrink-0 whitespace-nowrap ${itemBadge.bg} ${itemBadge.text} ${itemBadge.border}`}>
                      {itemBadge.label}
                    </span>
                  </div>

                  {/* Second row: Portion text (left) and Interactive Quantity Stepper (+ / -) (right) */}
                  <div className="flex justify-between items-center gap-2 pt-0.5">
                    <span className="text-xs text-gray-500 font-medium min-w-0 truncate">
                      {item.portionText || `${item.portionQty} ${item.portionUnit}`}
                    </span>

                    {/* Quantity Stepper Controls (+ / -) */}
                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl p-1 shadow-2xs shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, -1)}
                        disabled={item.portionQty <= 0 || isUpdating || isLogging}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-gray-100"
                        title="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-xs font-extrabold text-gray-900 select-none">
                        {item.portionQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, 1)}
                        disabled={item.portionQty >= 20 || isUpdating || isLogging}
                        className="w-7 h-7 rounded-lg bg-[#3F8F5F] hover:bg-[#34774E] active:scale-95 text-white font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-[#3F8F5F]"
                        title="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Tier Reason Caption */}
                  {!isExcluded && (
                    <p className="text-[11px] text-gray-500 italic bg-white/70 px-2.5 py-1 rounded-lg border border-gray-100">
                      💡 {buildTierReason(item, totals)}
                    </p>
                  )}

                  {/* Variant correction chips with clean toggle */}
                  {variants.length > 1 && !isExcluded && (
                    <div className="pt-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-gray-500 font-semibold block">
                          Which variant is this?
                        </span>
                        {variants.length > 4 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandVariants(idx)}
                            className="text-[11px] text-[#3F8F5F] font-bold flex items-center gap-0.5 hover:underline"
                          >
                            {isExpanded ? (
                              <>Show less <ChevronUp size={12} /></>
                            ) : (
                              <>View more (+{variants.length - 4}) <ChevronDown size={12} /></>
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 transition-all">
                        {visibleVariants.map((v) => (
                          <button
                            key={v.dishId}
                            type="button"
                            onClick={() => handleVariantSwitch(idx, v)}
                            className={`px-2.5 py-1 text-xs rounded-xl font-semibold transition-all ${
                              v.name.toLowerCase() === item.name.toLowerCase()
                                ? 'bg-[#3F8F5F] text-white shadow-xs'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {v.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Item Macro metrics */}
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200/60 text-gray-600 font-medium">
                    <span>{item.kcal} kcal</span>
                    <span>P: {item.proteinG}g | C: {item.carbsG}g | F: {item.fatG}g</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Nudge Card */}
      {!user?.hasProfile && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs font-semibold text-emerald-950 shadow-xs">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-[#3F8F5F]" />
            <span>Want tips made just for you? →</span>
          </div>
          <Link
            to="/profile"
            className="px-3 py-1.5 bg-[#3F8F5F] text-white rounded-xl font-bold hover:bg-[#34774E] transition-colors shadow-2xs text-[11px]"
          >
            Create Profile
          </Link>
        </div>
      )}

      {/* "Will you gonna eat it? 🤔" Actions */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-semibold text-gray-600 block text-center">Will you gonna eat it? 🤔</span>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isLogging}
            onClick={onRescan}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-2xl hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw size={16} />
            <span>No, skip</span>
          </button>

          <button
            type="button"
            disabled={!hasActiveItems || isUpdating || isLogging || isNonFood}
            onClick={handleConfirmClick}
            className="flex-1 py-3 px-4 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] transition-colors text-sm shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isLogging ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Yes, log it</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Legal / Safety Disclaimer */}
      <div className="text-[11px] text-gray-500 bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100/80 leading-relaxed text-center font-medium">
        We never suggest anything intoxicating or harmful. You always make the final call on what you eat — we're just here to help you see it clearly. 💚
      </div>
    </div>
  );
}

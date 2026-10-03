// Portion and oil level editor component allowing fine-tuning of scan dish items.
// Renders inputs for portion unit, quantity counter, and oil level selection chips.
// Recalculates item calories dynamically when portion settings are modified by user.

import React from 'react';

// Renders inline controls for adjusting portion quantity, unit, and oil level.
export function PortionEditor({ item, onChange }) {
  const units = ['piece', 'katori', 'plate', 'cup', 'g'];
  const oilLevels = [
    { label: 'Low Oil', value: 'low' },
    { label: 'Normal', value: 'normal' },
    { label: 'High Oil', value: 'high' },
  ];

  // Updates portion quantity on numeric step change.
  const handleQtyChange = (delta) => {
    const newQty = Math.max(0.5, item.portionQty + delta);
    onChange({ ...item, portionQty: newQty });
  };

  const confKey = item.confidence || 'high';
  const confLabels = {
    high: 'Pretty sure',
    medium: 'Not sure, please check',
    low: 'Take a guess, please check',
  };
  const confStyles = {
    high: 'bg-emerald-100 text-[#3F8F5F]',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-3 space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-900">{item.name}</span>
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${confStyles[confKey] || confStyles.high}`}>
          {confLabels[confKey] || confLabels.high}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => handleQtyChange(-0.5)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
          >
            -
          </button>
          <span className="px-3 py-1 font-semibold text-sm">{item.portionQty}</span>
          <button
            type="button"
            onClick={() => handleQtyChange(0.5)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700"
          >
            +
          </button>
        </div>

        <select
          value={item.portionUnit}
          onChange={(e) => onChange({ ...item, portionUnit: e.target.value })}
          className="border border-gray-300 bg-white rounded-xl px-3 py-1.5 text-sm font-medium text-gray-800"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <div className="ml-auto text-right">
          <span className="font-bold text-gray-900 text-base">{item.kcal} kcal</span>
          <span className="block text-[11px] text-gray-500">
            ({item.kcalMin} - {item.kcalMax} kcal)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-gray-500 font-medium">Oil level:</span>
        <div className="flex gap-1.5">
          {oilLevels.map((lvl) => (
            <button
              key={lvl.value}
              type="button"
              onClick={() => onChange({ ...item, oilLevel: lvl.value })}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                (item.oilLevel || 'normal') === lvl.value
                  ? 'bg-[#3F8F5F] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

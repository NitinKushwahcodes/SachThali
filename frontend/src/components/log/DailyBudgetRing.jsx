// Daily budget progress ring visualization component using SVG strokeDashoffset.
// Computes ratio of consumed calories to daily target calorie allowance.
// Colors ring stroke based on verdict state (under=green, on_track=blue-gray, over=amber).

import React from 'react';

// Renders circular SVG progress bar displaying calorie consumption versus target.
export function DailyBudgetRing({ totalKcal = 0, targetKcal = 1800, isEstimate = false }) {
  const percentage = Math.min(100, Math.round((totalKcal / targetKcal) * 100));
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = '#3F8F5F'; // under (green)
  if (totalKcal > targetKcal) {
    strokeColor = '#E08A3E'; // over (amber)
  } else if (percentage >= 85 && percentage <= 100) {
    strokeColor = '#4A6572'; // on_track (blue-gray)
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-3xl shadow-sm mb-6">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke={strokeColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-gray-900">{totalKcal}</span>
          <span className="text-xs text-gray-500 font-medium">/ {targetKcal} kcal</span>
          {isEstimate && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 font-medium">
              Estimated
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-sm font-semibold text-gray-700">
          {targetKcal - totalKcal > 0
            ? `${targetKcal - totalKcal} kcal remaining today`
            : `${totalKcal - targetKcal} kcal over budget`}
        </span>
      </div>
    </div>
  );
}

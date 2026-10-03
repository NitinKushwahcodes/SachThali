// Clarification chips component rendering candidate dish options for medium RAG confidence matches.
// Allows users to tap alternative dish suggestions to refine item classification accuracy.
// Emits selected dish replacement event to update Scan result state.

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

// Renders interactive candidate chip buttons for dish clarification selection.
export function ClarificationChips({ options = [], onSelect }) {
  if (!options || options.length === 0) return null;

  const handleChipClick = (opt) => {
    // Log resolution choice asynchronously for RAG self-enrichment
    apiFetch('/scan/resolve', {
      method: 'POST',
      body: JSON.stringify({ queryText: opt.name, resolvedDishName: opt.name }),
    }).catch(() => {});

    if (onSelect) onSelect(opt);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2 text-amber-800 font-semibold text-sm">
        <HelpCircle size={16} />
        <span>Not sure — pick one to confirm:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt, idx) => (
          <button
            key={`${opt.name}-${idx}`}
            type="button"
            onClick={() => handleChipClick(opt)}
            className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-sm"
          >
            {opt.name} ({opt.kcalPerStandardUnit} kcal/{opt.defaultUnit})
          </button>
        ))}
      </div>
    </div>
  );
}


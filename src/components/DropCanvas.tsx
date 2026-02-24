import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { RecipeItem } from '../lib/types';
import { TOPICS, CATEGORY_COLORS } from '../lib/mappings';

export const CANVAS_ID = 'recipe-canvas';

interface DropCanvasProps {
  selections: RecipeItem[];
  onRemove: (id: string) => void;
}

// Map category → display label (preserving TOPICS order)
const CATEGORY_ORDER = TOPICS.map((t) => t.id);
const CATEGORY_LABELS: Record<string, string> = {
  traffic:     'Traffic & Scale',
  appStyle:    'App Style',
  data:        'Data',
  security:    'Security',
  reliability: 'Reliability',
  ops:         'Ops',
};

export default function DropCanvas({ selections, onRemove }: DropCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({ id: CANVAS_ID });

  // Group selections by category, preserving TOPICS order
  const grouped = CATEGORY_ORDER.reduce<Record<string, RecipeItem[]>>((acc, cat) => {
    const items = selections.filter((s) => s.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  const groupedEntries = Object.entries(grouped);

  return (
    <div
      ref={setNodeRef}
      className={`
        relative flex flex-col min-h-[400px] lg:min-h-0 lg:h-full rounded-2xl border-2 border-dashed
        transition-all duration-300 overflow-hidden
        ${isOver
          ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_40px_rgba(6,182,212,0.12)]'
          : selections.length > 0
            ? 'border-slate-700 bg-slate-900/50'
            : 'border-slate-800 bg-slate-900/30'
        }
      `}
      aria-label="Recipe canvas — drop items here"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white">Your recipe</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selections.length === 0
              ? 'Drag cards here — or click to add'
              : `${selections.length} item${selections.length !== 1 ? 's' : ''} selected`}
          </p>
        </div>
        {selections.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {selections.length}
            </span>
          </div>
        )}
      </div>

      {/* Drop hint bar */}
      <div
        className={`mx-5 mb-3 flex-shrink-0 flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed text-xs transition-all duration-200 ${
          isOver
            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
            : 'border-slate-700/60 text-slate-600'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 9l-7 7-7-7" />
        </svg>
        {isOver ? 'Release to add' : 'Drop here or click cards on the right'}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {selections.length === 0 ? (
          <EmptyState isOver={isOver} />
        ) : (
          <div className="space-y-4">
            {groupedEntries.map(([category, items]) => {
              const colorClasses = CATEGORY_COLORS[category] ?? 'text-slate-400 border-slate-700';
              const textColor = colorClasses.split(' ').find((c) => c.startsWith('text-')) ?? 'text-slate-400';
              const borderColor = colorClasses.split(' ').find((c) => c.startsWith('border-')) ?? 'border-slate-700';
              const bgColor = colorClasses.split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-slate-800/30';

              return (
                <div key={category}>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${textColor}`}>
                    {CATEGORY_LABELS[category] ?? category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onRemove(item.id)}
                        title={`Remove ${item.label}`}
                        className={`
                          group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium
                          transition-all duration-150 animate-fade-in
                          ${bgColor} ${borderColor} ${textColor}
                          hover:opacity-80 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5
                          focus:outline-none focus:ring-2 focus:ring-red-500/30
                        `}
                      >
                        <span className="text-white group-hover:text-red-400 transition-colors">{item.label}</span>
                        <svg
                          className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ isOver }: { isOver: boolean }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div
        className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isOver ? 'bg-cyan-500/20 scale-110' : 'bg-slate-800/60'
        }`}
      >
        <svg
          className={`w-10 h-10 transition-colors duration-300 ${isOver ? 'text-cyan-400' : 'text-slate-600'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
            d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v4m0 0H5m4 0h6m6-4v4m0 0h-6m6 0v10a2 2 0 01-2 2h-4m-6 0H5a2 2 0 01-2-2V7"
          />
        </svg>
      </div>
      <div>
        <p className={`text-sm font-medium transition-colors ${isOver ? 'text-cyan-400' : 'text-slate-400'}`}>
          {isOver ? 'Drop to add to your recipe' : 'Start building your recipe'}
        </p>
        <p className="text-xs text-slate-600 mt-1 max-w-[200px] mx-auto leading-relaxed">
          Pick items from the panel on the right. Each item maps to AWS services.
        </p>
      </div>
      <div className="flex flex-col gap-1.5 text-xs text-slate-700">
        {[
          'Traffic & Scale — required',
          'App Style — required',
          'Data, Security, Ops — optional',
        ].map((hint) => (
          <div key={hint} className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            {hint}
          </div>
        ))}
      </div>
    </div>
  );
}

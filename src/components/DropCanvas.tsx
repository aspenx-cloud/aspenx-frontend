import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { RecipeItem } from '../lib/types';
import { CATEGORY_COLORS } from '../lib/mappings';

export const CANVAS_ID = 'recipe-canvas';

interface DropCanvasProps {
  selections: RecipeItem[];
  onRemove: (id: string) => void;
}

export default function DropCanvas({ selections, onRemove }: DropCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({ id: CANVAS_ID });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative flex flex-col min-h-[400px] lg:min-h-0 lg:h-full rounded-2xl border-2 border-dashed
        transition-all duration-200 p-4
        ${isOver
          ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.15)]'
          : selections.length > 0
            ? 'border-slate-700 bg-slate-900/50'
            : 'border-slate-800 bg-slate-900/30'
        }
      `}
      aria-label="Recipe canvas — drop items here"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Describe your app</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag cards here — or tap/click to add
          </p>
        </div>
        {selections.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {selections.length} item{selections.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Empty state */}
      {selections.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isOver ? 'bg-cyan-500/20' : 'bg-slate-800/60'
            }`}
          >
            <svg
              className={`w-8 h-8 transition-colors ${isOver ? 'text-cyan-400' : 'text-slate-600'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-medium transition-colors ${isOver ? 'text-cyan-400' : 'text-slate-500'}`}>
              {isOver ? 'Drop to add' : 'Start building your recipe'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Pick items from the panel on the right
            </p>
          </div>
        </div>
      )}

      {/* Selected items grid */}
      {selections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 auto-rows-min">
          {selections.map((item) => (
            <CanvasItem key={item.id} item={item} onRemove={onRemove} />
          ))}
          {/* Drop target hint at end */}
          {isOver && (
            <div className="rounded-xl border-2 border-dashed border-cyan-500/60 bg-cyan-500/5 p-3 flex items-center justify-center">
              <span className="text-xs text-cyan-400">Drop here</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CanvasItem({ item, onRemove }: { item: RecipeItem; onRemove: (id: string) => void }) {
  const colorClasses = CATEGORY_COLORS[item.category] ?? 'text-slate-400 border-slate-700';

  return (
    <div
      className={`
        group flex items-start justify-between gap-2 rounded-xl border p-3
        bg-slate-800/60 transition-all duration-150 animate-fade-in
        ${colorClasses}
      `}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.label}</p>
        {item.description && (
          <p className="text-xs mt-0.5 opacity-60 truncate">{item.description}</p>
        )}
        {item.awsHints.length > 0 && (
          <p className="text-xs mt-1 opacity-50 truncate">
            ↳ {item.awsHints[0]}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.label}`}
        className="flex-shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-500"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

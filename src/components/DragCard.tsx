import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { RecipeItem } from '../lib/types';
import { CATEGORY_COLORS } from '../lib/mappings';

interface DragCardProps {
  item: RecipeItem;
  isSelected: boolean;
  onAdd: (item: RecipeItem) => void;
  /** Render without drag wiring — used inside DragOverlay */
  overlay?: boolean;
}

export default function DragCard({ item, isSelected, onAdd, overlay = false }: DragCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled: overlay,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const colorClasses = CATEGORY_COLORS[item.category] ?? 'text-slate-400 border-slate-600 bg-slate-800/30';

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      className={`
        group relative rounded-xl border p-3 cursor-grab active:cursor-grabbing
        transition-all duration-200 select-none
        ${colorClasses}
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${overlay ? 'shadow-2xl shadow-black/60 scale-105 cursor-grabbing' : ''}
        ${isSelected
          ? 'opacity-60 ring-1 ring-inset ring-current'
          : 'hover:scale-[1.02] hover:shadow-md hover:shadow-black/30'
        }
      `}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      role="button"
      tabIndex={overlay ? -1 : 0}
      aria-label={`Add ${item.label}${isSelected ? ' (already added)' : ''}`}
      aria-pressed={isSelected}
      onClick={() => !overlay && onAdd(item)}
      onKeyDown={(e) => {
        if (!overlay && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAdd(item);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight">{item.label}</p>
          {item.description && (
            <p className="text-xs mt-0.5 opacity-70">{item.description}</p>
          )}
        </div>
        {isSelected ? (
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </div>

      {/* AWS hints tooltip on hover */}
      {!overlay && item.awsHints.length > 0 && (
        <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-10 w-56 p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-xl">
          <p className="text-xs font-medium text-slate-400 mb-1.5">Usually maps to:</p>
          <ul className="space-y-1">
            {item.awsHints.map((hint, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                <span className="text-cyan-500 mt-0.5">›</span>
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

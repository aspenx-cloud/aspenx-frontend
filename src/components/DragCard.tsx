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
        group relative rounded-xl border px-3 py-2.5 select-none
        transition-all duration-150
        ${colorClasses}
        ${isDragging ? 'opacity-30 scale-95' : ''}
        ${overlay ? 'shadow-2xl shadow-black/60 scale-105 cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}
        ${isSelected
          ? 'bg-opacity-20 ring-1 ring-inset ring-current/40'
          : 'hover:brightness-110 hover:shadow-sm hover:shadow-black/20'
        }
      `}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      role="button"
      tabIndex={overlay ? -1 : 0}
      aria-label={`Add ${item.label}${isSelected ? ' (already added)' : ''}`}
      aria-pressed={isSelected}
      onClick={() => !overlay && !isSelected && onAdd(item)}
      onKeyDown={(e) => {
        if (!overlay && !isSelected && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAdd(item);
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium leading-snug transition-colors ${isSelected ? 'text-white/70' : 'text-white'}`}>
            {item.label}
          </p>
          {item.description && (
            <p className="text-[10px] mt-0.5 opacity-50 leading-snug">{item.description}</p>
          )}
        </div>

        {isSelected ? (
          <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] font-semibold opacity-70">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        ) : (
          <svg
            className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </div>

      {/* AWS hints — rendered below the card label on hover, stays within panel bounds */}
      {!overlay && !isSelected && item.awsHints.length > 0 && (
        <div className="hidden group-hover:block mt-2 pt-2 border-t border-current/10">
          <ul className="space-y-0.5">
            {item.awsHints.map((hint, i) => (
              <li key={i} className="text-[10px] opacity-60 flex items-start gap-1 leading-snug">
                <span className="opacity-60 mt-px">›</span>
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

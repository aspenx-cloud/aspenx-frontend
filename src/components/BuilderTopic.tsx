import React, { useState } from 'react';
import type { Topic, RecipeItem } from '../lib/types';
import DragCard from './DragCard';
import { CATEGORY_COLORS } from '../lib/mappings';

interface BuilderTopicProps {
  topic: Topic;
  selectedIds: Set<string>;
  onAdd: (item: RecipeItem) => void;
}

export default function BuilderTopic({ topic, selectedIds, onAdd }: BuilderTopicProps) {
  const [collapsed, setCollapsed] = useState(false);
  const colorClasses = CATEGORY_COLORS[topic.id] ?? 'text-slate-400';
  // Extract only the text-* class for the heading accent
  const headingColor = colorClasses.split(' ').find((c) => c.startsWith('text-')) ?? 'text-slate-400';

  return (
    <div className="mb-3">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/40 group"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-widest ${headingColor}`}>
            {topic.label}
          </span>
          {topic.exclusive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
              pick one
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-all duration-200 ${collapsed ? '-rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="mt-1.5 flex flex-col gap-1.5 pl-1 animate-fade-in">
          {topic.items.map((item) => (
            <DragCard
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

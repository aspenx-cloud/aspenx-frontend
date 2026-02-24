import React, { useState } from 'react';
import type { Topic, RecipeItem } from '../lib/types';
import DragCard from './DragCard';
import { CATEGORY_COLORS } from '../lib/mappings';

// Category icons (inline SVG paths)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  traffic: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  ),
  appStyle: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  ),
  data: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
  ),
  security: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  ),
  reliability: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  ),
  ops: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  ),
};

interface BuilderTopicProps {
  topic: Topic;
  selectedIds: Set<string>;
  onAdd: (item: RecipeItem) => void;
}

export default function BuilderTopic({ topic, selectedIds, onAdd }: BuilderTopicProps) {
  const [collapsed, setCollapsed] = useState(false);
  const colorClasses = CATEGORY_COLORS[topic.id] ?? 'text-slate-400 border-slate-700 bg-slate-800/30';
  const textColor = colorClasses.split(' ').find((c) => c.startsWith('text-')) ?? 'text-slate-400';
  const bgColor = colorClasses.split(' ').find((c) => c.startsWith('bg-')) ?? 'bg-slate-800/30';

  const selectedCount = topic.items.filter((i) => selectedIds.has(i.id)).length;

  return (
    <div className="mb-1">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-800/40 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500/40 group"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${bgColor}`}>
            <svg className={`w-3 h-3 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {CATEGORY_ICONS[topic.id]}
            </svg>
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider ${textColor}`}>
            {topic.label}
          </span>
          {topic.exclusive && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-600 border border-slate-700/60">
              1 only
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {selectedCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${bgColor} ${textColor}`}>
              {selectedCount}
            </span>
          )}
          <svg
            className={`w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-all duration-200 ${collapsed ? '-rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="mt-1 flex flex-col gap-1 pl-1 pr-0.5 animate-fade-in">
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

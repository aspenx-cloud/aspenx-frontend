import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import type { Tier, RecipeItem, Addon, Region } from '../lib/types';
import { buildDiagram } from '../lib/diagram';

// ─────────────────────────────────────────────────────────────────────────────
// Accent colour tokens
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT: Record<string, { border: string; glow: string; hdr: string; icon: string; text: string }> = {
  cyan:    { border: '#06b6d4', glow: 'rgba(6,182,212,0.18)',   hdr: 'rgba(6,182,212,0.08)',    icon: '⬡', text: '#67e8f9' },
  blue:    { border: '#3b82f6', glow: 'rgba(59,130,246,0.18)',  hdr: 'rgba(59,130,246,0.08)',   icon: '◈', text: '#93c5fd' },
  purple:  { border: '#a855f7', glow: 'rgba(168,85,247,0.18)',  hdr: 'rgba(168,85,247,0.08)',   icon: '◆', text: '#d8b4fe' },
  amber:   { border: '#f59e0b', glow: 'rgba(245,158,11,0.18)',  hdr: 'rgba(245,158,11,0.08)',   icon: '⬟', text: '#fcd34d' },
  emerald: { border: '#10b981', glow: 'rgba(16,185,129,0.18)',  hdr: 'rgba(16,185,129,0.08)',   icon: '●', text: '#6ee7b7' },
  rose:    { border: '#f43f5e', glow: 'rgba(244,63,94,0.18)',   hdr: 'rgba(244,63,94,0.08)',    icon: '◉', text: '#fda4af' },
  slate:   { border: '#475569', glow: 'rgba(71,85,105,0.12)',   hdr: 'rgba(71,85,105,0.10)',    icon: '○', text: '#94a3b8' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom node: service card
// ─────────────────────────────────────────────────────────────────────────────

function ServiceNode({ data }: NodeProps) {
  const a = ACCENT[data.accent as string] ?? ACCENT.slate;
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: `1px solid ${a.border}`,
        boxShadow: `0 0 10px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        borderRadius: 9,
        padding: '9px 11px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        boxSizing: 'border-box',
        cursor: 'default',
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1, color: a.border, flexShrink: 0, marginTop: 1 }}>
        {a.icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          color: '#f1f5f9',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {data.label}
        </p>
        <p style={{
          margin: '2px 0 0',
          fontSize: 9,
          color: '#64748b',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {data.sub}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom node: group container (VPC / subnet)
// Header band occupies the top 34px — service nodes must start below this
// ─────────────────────────────────────────────────────────────────────────────

function GroupNode({ data }: NodeProps) {
  const a = ACCENT[data.accent as string] ?? ACCENT.slate;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `1.5px dashed ${a.border}`,
        borderRadius: 12,
        background: 'rgba(15,23,42,0.4)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        overflow: 'hidden', // clips header to border-radius
      }}
    >
      {/* ── Header band — label lives here; no nodes may overlap this area ── */}
      <div
        style={{
          height: 34,
          background: `linear-gradient(90deg, ${a.hdr} 0%, transparent 80%)`,
          borderBottom: `1px solid ${a.border}22`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          paddingRight: 12,
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: a.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.label}
        </span>
      </div>
    </div>
  );
}

const NODE_TYPES = { serviceNode: ServiceNode, groupNode: GroupNode };

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface ArchitectureDiagramProps {
  tier: Tier;
  region: Region;
  selections: RecipeItem[];
  addons: Addon;
}

export default function ArchitectureDiagram({
  tier,
  region,
  selections,
  addons,
}: ArchitectureDiagramProps) {
  // Compute once — no state needed for a static diagram
  const { nodes, edges } = buildDiagram(tier, selections, addons, region);

  const containerRef = useRef<HTMLDivElement>(null);
  const dateStr = new Date().toISOString().slice(0, 10);

  // ── Export helpers ────────────────────────────────────────────────────────

  const capture = useCallback(async (): Promise<string> => {
    const el = containerRef.current;
    if (!el) throw new Error('Canvas not ready');
    return toPng(el, {
      pixelRatio: 2,
      backgroundColor: '#020817',
    });
  }, []);

  const downloadPNG = useCallback(async () => {
    try {
      const url = await capture();
      const a = document.createElement('a');
      a.href = url;
      a.download = `aspenx-architecture-${dateStr}.png`;
      a.click();
    } catch { /* silent */ }
  }, [capture, dateStr]);

  const downloadPDF = useCallback(async () => {
    try {
      const url = await capture();
      const img = new Image();
      img.src = url;
      await new Promise<void>((res) => { img.onload = () => res(); });
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width / 2, img.height / 2],
      });
      pdf.addImage(url, 'PNG', 0, 0, img.width / 2, img.height / 2);
      pdf.save(`aspenx-architecture-${dateStr}.pdf`);
    } catch { /* silent */ }
  }, [capture, dateStr]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">
          Reference architecture · based on your selections
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PNG
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Canvas — fully static: no drag, no pan, no zoom interactions */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-slate-800"
        style={{ height: 440, background: '#020817' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          // ── Static interaction locks ──────────────────────────────────────
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}   // page scroll still works normally
          // ── View ─────────────────────────────────────────────────────────
          fitView
          fitViewOptions={{ padding: 0.18, minZoom: 0.2, maxZoom: 1 }}
          minZoom={0.1}
          maxZoom={1.5}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1}
            color="#1e293b"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

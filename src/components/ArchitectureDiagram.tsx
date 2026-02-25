import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import type { Tier, RecipeItem, Addon, Region } from '../lib/types';
import { buildDiagram } from '../lib/diagram';

// ─────────────────────────────────────────────────────────────────────────────
// Accent colour map
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT: Record<string, { border: string; glow: string; icon: string; text: string }> = {
  cyan:    { border: '#06b6d4', glow: 'rgba(6,182,212,0.2)',   icon: '⬡', text: '#67e8f9' },
  blue:    { border: '#3b82f6', glow: 'rgba(59,130,246,0.2)',  icon: '◈', text: '#93c5fd' },
  purple:  { border: '#a855f7', glow: 'rgba(168,85,247,0.2)',  icon: '◆', text: '#d8b4fe' },
  amber:   { border: '#f59e0b', glow: 'rgba(245,158,11,0.2)',  icon: '⬟', text: '#fcd34d' },
  emerald: { border: '#10b981', glow: 'rgba(16,185,129,0.2)',  icon: '●', text: '#6ee7b7' },
  rose:    { border: '#f43f5e', glow: 'rgba(244,63,94,0.2)',   icon: '◉', text: '#fda4af' },
  slate:   { border: '#475569', glow: 'rgba(71,85,105,0.15)',  icon: '○', text: '#94a3b8' },
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
        boxShadow: `0 0 12px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        borderRadius: 10,
        padding: '10px 12px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, color: a.border, flexShrink: 0, marginTop: 1 }}>
        {a.icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.label}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 9, color: '#64748b', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.sub}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom node: group / VPC background box
// ─────────────────────────────────────────────────────────────────────────────

function GroupNode({ data }: NodeProps) {
  const a = ACCENT[data.accent as string] ?? ACCENT.slate;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `1px dashed ${a.border}`,
        borderRadius: 14,
        background: `linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(30,41,59,0.3) 100%)`,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 8,
        left: 12,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: a.text,
        opacity: 0.8,
      }}>
        {data.label}
      </span>
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
  const { nodes: initNodes, edges: initEdges } = buildDiagram(tier, selections, addons, region);
  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Export helpers ────────────────────────────────────────────────────────

  const dateStr = new Date().toISOString().slice(0, 10);

  const captureNode = useCallback(async (): Promise<string> => {
    const el = containerRef.current?.querySelector('.react-flow__renderer') as HTMLElement | null
      ?? containerRef.current as HTMLElement;
    if (!el) throw new Error('Canvas not ready');
    return toPng(el, {
      pixelRatio: 2,
      backgroundColor: '#020817',
      style: { borderRadius: '12px' },
    });
  }, []);

  const downloadPNG = useCallback(async () => {
    try {
      const dataUrl = await captureNode();
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `aspenx-architecture-${dateStr}.png`;
      a.click();
    } catch {
      // silent — canvas may not be ready
    }
  }, [captureNode, dateStr]);

  const downloadPDF = useCallback(async () => {
    try {
      const dataUrl = await captureNode();
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const landscape = img.width > img.height;
      const pdf = new jsPDF({
        orientation: landscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width / 2, img.height / 2],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width / 2, img.height / 2);
      pdf.save(`aspenx-architecture-${dateStr}.pdf`);
    } catch {
      // silent
    }
  }, [captureNode, dateStr]);

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

      {/* Canvas */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-slate-800"
        style={{ height: 420, background: '#020817' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#1e293b"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

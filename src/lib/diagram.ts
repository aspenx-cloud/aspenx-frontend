import type { Node, Edge } from 'reactflow';
import type { Tier, RecipeItem, Addon, Region } from './types';
import { buildDeploymentPlan, type PlanComponent } from './plan';

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────────────

const NODE_W = 152;
const NODE_H = 56;
const GAP     = 16;

// X columns
const X_EXT_L   = 20;    // external-left nodes (Internet, CDN, WAF, DNS)
const X_VPC     = 210;   // VPC box left edge
const X_PUBLIC  = 230;   // public subnet nodes
const X_APP     = 430;   // private-app subnet nodes
const X_DATA    = 630;   // private-data subnet nodes
const X_EXT_R   = 830;   // external-right nodes (monitoring, audit, cicd)

// Y rows
const Y_TOP        = 30;
const Y_VPC_TOP    = 20;
const SUBNET_PAD_V = 12;   // vertical padding inside subnet box
const SUBNET_GAP   = 12;   // gap between subnet rows

// Subnet row heights (enough for nodes + padding)
const ROW_H = NODE_H + SUBNET_PAD_V * 2;

// ─────────────────────────────────────────────────────────────────────────────
// Edge style variants
// ─────────────────────────────────────────────────────────────────────────────

type EdgeVariant = 'solid' | 'dashed' | 'dotted';

function mkEdge(
  id: string,
  source: string,
  target: string,
  opts: { label?: string; variant?: EdgeVariant; animated?: boolean } = {},
): Edge {
  const variant = opts.variant ?? 'solid';
  const strokeDasharray =
    variant === 'dashed' ? '6 3' :
    variant === 'dotted' ? '2 3' : undefined;
  return {
    id,
    source,
    target,
    label: opts.label,
    animated: opts.animated ?? false,
    type: 'smoothstep',
    style: {
      stroke: variant === 'dotted' ? '#374151' : variant === 'dashed' ? '#4c1d95' : '#334155',
      strokeWidth: 1.5,
      strokeDasharray,
    },
    labelStyle: { fill: '#64748b', fontSize: 10 },
    labelBgStyle: { fill: '#020817', fillOpacity: 0.85 },
    labelBgPadding: [3, 4] as [number, number],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Node factories
// ─────────────────────────────────────────────────────────────────────────────

function serviceNode(
  comp: PlanComponent,
  x: number,
  y: number,
): Node {
  return {
    id: comp.id,
    type: 'serviceNode',
    position: { x, y },
    data: { label: comp.name, sub: comp.sub, accent: comp.accent },
    style: { width: NODE_W, height: NODE_H },
  };
}

function groupNode(
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
  zIndex = -1,
): Node {
  return {
    id,
    type: 'groupNode',
    position: { x, y },
    data: { label, accent },
    style: { width: w, height: h, zIndex },
    zIndex,
    draggable: false,
    selectable: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────────────────────────────────────

export interface DiagramResult {
  nodes: Node[];
  edges: Edge[];
  width: number;
  height: number;
}

export function buildDiagram(
  tier: Tier,
  selections: RecipeItem[],
  addons: Addon,
  region: Region,
): DiagramResult {
  const plan = buildDeploymentPlan(tier, selections, addons, region);
  const ids  = new Set(selections.map((s) => s.id));
  const has  = (id: string) => ids.has(id);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // ── Bucket components by diagram group ──────────────────────────────────
  const byGroup = (g: string) =>
    plan.components.filter((c) => c.diagramGroup === g);

  const extLeft  = byGroup('external-left').filter(
    (c) => !['vpc', 'internet', 'dns'].includes(c.id),
  );
  const internet = plan.components.find((c) => c.id === 'internet');
  const cdn      = plan.components.find((c) => c.id === 'cdn');
  const waf      = plan.components.find((c) => c.id === 'waf');
  const publicC  = byGroup('public');
  const appC     = byGroup('app');
  const dataC    = byGroup('data');
  const asyncC   = byGroup('async');
  const extRight = byGroup('external-right');

  // ── Y cursor helpers ─────────────────────────────────────────────────────

  // External left: stack nodes vertically
  let extLY = Y_TOP;
  const placeExtL = (comp: PlanComponent) => {
    nodes.push(serviceNode(comp, X_EXT_L, extLY));
    extLY += NODE_H + GAP;
  };

  // External right: stack nodes vertically
  let extRY = Y_TOP;
  const placeExtR = (comp: PlanComponent) => {
    nodes.push(serviceNode(comp, X_EXT_R, extRY));
    extRY += NODE_H + GAP;
  };

  // ── 1. External-left nodes ───────────────────────────────────────────────
  if (internet) placeExtL(internet);
  if (waf)      placeExtL(waf);
  if (cdn)      placeExtL(cdn);
  // remaining ext-left (ACM, etc) — skip rendering to reduce noise (shown in BOM only)

  // ── 2. VPC subnet rows ───────────────────────────────────────────────────
  // Calculate how many rows we need and total VPC height

  const hasPublic  = publicC.length > 0;
  const hasApp     = appC.length > 0;
  const asyncInApp = asyncC.length > 0; // queue+worker sit in async row between app and data
  const dataCount  = dataC.length;

  // Each subnet row height
  const publicRowH = hasPublic  ? ROW_H : 0;
  const appRowH    = hasApp     ? ROW_H : 0;
  const asyncRowH  = asyncInApp ? ROW_H : 0;
  const dataRowH   = dataCount  > 0 ? Math.ceil(dataCount / 2) * (NODE_H + GAP) + SUBNET_PAD_V * 2 - GAP : 0;

  // Y positions of subnet rows (relative to VPC top)
  const publicSubY = Y_VPC_TOP + SUBNET_GAP;
  const appSubY    = publicSubY + publicRowH + (hasPublic ? SUBNET_GAP : 0);
  const asyncSubY  = appSubY + appRowH + (hasApp ? SUBNET_GAP : 0);
  const dataSubY   = asyncSubY + asyncRowH + (asyncInApp ? SUBNET_GAP : 0);

  const vpcW = plan.vpc.multiAZ ? (X_DATA - X_VPC + NODE_W + 20 + 200) : (X_DATA - X_VPC + NODE_W + 20);
  const vpcH = dataSubY + dataRowH + SUBNET_GAP * 2;

  // Add multi-AZ second column if needed — visual only
  const multiAZ = plan.vpc.multiAZ;
  const vpcRight = X_VPC + vpcW;

  // ── VPC background ───────────────────────────────────────────────────────
  nodes.unshift(groupNode(
    'g-vpc',
    multiAZ ? 'VPC  ·  Multi-AZ HA' : 'VPC',
    X_VPC,
    Y_VPC_TOP,
    vpcW,
    vpcH,
    'slate',
    -3,
  ));

  // ── Public subnet background ─────────────────────────────────────────────
  if (hasPublic) {
    const subW = multiAZ ? vpcW - 10 : X_DATA - X_VPC + NODE_W + 10;
    nodes.push(groupNode(
      'g-public',
      multiAZ ? 'Public Subnet  ·  AZ-a  /  AZ-b' : 'Public Subnet',
      X_VPC + 5,
      publicSubY,
      subW,
      publicRowH,
      'blue',
      -2,
    ));
    publicC.forEach((c, i) => {
      const x = X_PUBLIC + i * (NODE_W + GAP);
      const y = publicSubY + SUBNET_PAD_V;
      nodes.push(serviceNode(c, x, y));
    });
  }

  // ── Private App subnet background ────────────────────────────────────────
  if (hasApp) {
    const subW = multiAZ ? vpcW - 10 : X_APP - X_VPC + NODE_W + 10;
    nodes.push(groupNode(
      'g-app',
      multiAZ ? 'Private App Subnet  ·  AZ-a  /  AZ-b' : 'Private App Subnet',
      X_VPC + 5,
      appSubY,
      subW,
      appRowH,
      'cyan',
      -2,
    ));
    appC.forEach((c, i) => {
      nodes.push(serviceNode(c, X_APP + i * (NODE_W + GAP), appSubY + SUBNET_PAD_V));
    });
  }

  // ── Async row ────────────────────────────────────────────────────────────
  if (asyncInApp) {
    const subW = X_DATA - X_VPC + NODE_W + 10;
    nodes.push(groupNode(
      'g-async',
      'Async Layer',
      X_VPC + 5,
      asyncSubY,
      subW,
      asyncRowH,
      'purple',
      -2,
    ));
    asyncC.forEach((c, i) => {
      nodes.push(serviceNode(c, X_APP + i * (NODE_W + GAP), asyncSubY + SUBNET_PAD_V));
    });
  }

  // ── Private Data subnet background ───────────────────────────────────────
  if (dataCount > 0) {
    const subW = multiAZ ? vpcW - 10 : X_DATA - X_VPC + NODE_W + 10;
    nodes.push(groupNode(
      'g-data',
      multiAZ ? 'Private Data Subnet  ·  AZ-a  /  AZ-b' : 'Private Data Subnet',
      X_VPC + 5,
      dataSubY,
      subW,
      dataRowH,
      'emerald',
      -2,
    ));
    dataC.forEach((c, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      nodes.push(serviceNode(
        c,
        X_DATA + col * (NODE_W + GAP),
        dataSubY + SUBNET_PAD_V + row * (NODE_H + GAP),
      ));
    });
  }

  // ── 3. External-right nodes ──────────────────────────────────────────────
  extRight.forEach((c) => placeExtR(c));

  // ── 4. Multi-AZ replica column (visual ghost) ─────────────────────────────
  if (multiAZ && (hasPublic || hasApp || dataCount > 0)) {
    const colX = X_VPC + (vpcW / 2) + 5;
    if (hasPublic) {
      nodes.push(groupNode('g-pub-b', 'AZ-b replica', colX, publicSubY + 4, vpcW / 2 - 15, publicRowH - 8, 'slate', -1));
    }
    if (hasApp) {
      nodes.push(groupNode('g-app-b', 'AZ-b replica', colX, appSubY + 4, vpcW / 2 - 15, appRowH - 8, 'slate', -1));
    }
    if (dataCount > 0) {
      nodes.push(groupNode('g-data-b', 'AZ-b standby', colX, dataSubY + 4, vpcW / 2 - 15, dataRowH - 8, 'slate', -1));
    }
  }

  // ── 5. Edges ─────────────────────────────────────────────────────────────

  const hasWAF     = !!waf;
  const hasCDN     = !!cdn;
  const hasHTTPS   = has('sec-https');
  const edgeSrc    = hasWAF ? 'waf' : 'internet';
  const tlsLabel   = hasHTTPS ? 'HTTPS/TLS' : undefined;

  // Internet → WAF
  if (hasWAF) {
    edges.push(mkEdge('e-internet-waf', 'internet', 'waf'));
  }

  // Internet/WAF → CDN
  if (hasCDN) {
    edges.push(mkEdge('e-src-cdn', edgeSrc, 'cdn', { label: tlsLabel }));
  }

  // CDN → frontend S3
  if (hasCDN && plan.components.find((c) => c.id === 's3-frontend')) {
    edges.push(mkEdge('e-cdn-s3', 'cdn', 's3-frontend'));
  }

  // Entry (WAF/Internet/CDN) → ALB or WS API
  const alb   = plan.components.find((c) => c.id === 'alb');
  const wsapi = plan.components.find((c) => c.id === 'wsapi');
  if (alb) {
    const src = hasCDN ? edgeSrc : edgeSrc;
    edges.push(mkEdge('e-src-alb', src, 'alb', { label: tlsLabel }));
  }
  if (wsapi) {
    edges.push(mkEdge('e-src-wsapi', edgeSrc, 'wsapi', { label: hasHTTPS ? 'WSS/TLS' : undefined }));
  }

  // Public → Compute
  const computeNode = plan.components.find((c) => c.id === 'compute');
  if (computeNode) {
    const entryId = alb ? 'alb' : wsapi ? 'wsapi' : hasCDN ? 'cdn' : 'internet';
    edges.push(mkEdge('e-entry-compute', entryId, 'compute'));
  }

  // Compute → data nodes (solid)
  const dataIds = dataC.map((c) => c.id);
  dataIds.forEach((did) => {
    if (computeNode || alb) {
      const src = computeNode ? 'compute' : 'alb';
      edges.push(mkEdge(`e-compute-${did}`, src, did));
    }
  });

  // Compute → Queue (dashed/animated)
  if (plan.components.find((c) => c.id === 'queue')) {
    edges.push(mkEdge('e-compute-queue', 'compute', 'queue', { variant: 'dashed', animated: true }));
  }

  // Queue → Worker (dashed/animated)
  if (plan.components.find((c) => c.id === 'worker')) {
    edges.push(mkEdge('e-queue-worker', 'queue', 'worker', { variant: 'dashed', animated: true }));
  }

  // Compute → Monitoring (dotted)
  if (plan.components.find((c) => c.id === 'monitoring')) {
    const src = computeNode ? 'compute' : (alb ? 'alb' : 'internet');
    edges.push(mkEdge('e-compute-mon', src, 'monitoring', { variant: 'dotted' }));
  }

  // CI/CD → Compute (dashed)
  if (plan.components.find((c) => c.id === 'cicd') && computeNode) {
    edges.push(mkEdge('e-cicd-compute', 'cicd', 'compute', { variant: 'dashed', animated: true }));
  }

  // ── Bounding box ─────────────────────────────────────────────────────────
  const allX = nodes.map((n) => (n.position?.x ?? 0) + Number(n.style?.width  ?? NODE_W));
  const allY = nodes.map((n) => (n.position?.y ?? 0) + Number(n.style?.height ?? NODE_H));
  const width  = Math.max(...allX, vpcRight + 60) + 60;
  const height = Math.max(...allY) + 60;

  return { nodes, edges, width, height };
}

import type { Node, Edge } from 'reactflow';
import type { Tier, RecipeItem, Addon, Region } from './types';
import { buildDeploymentPlan, type PlanComponent } from './plan';

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants — all positions derived from these, nothing magic
// ─────────────────────────────────────────────────────────────────────────────

const NODE_W        = 148;   // service node width
const NODE_H        = 52;    // service node height
const NODE_GAP_X    = 20;    // horizontal gap between nodes in same row
const NODE_GAP_Y    = 14;    // vertical gap between node rows
const NODES_PER_ROW = 2;     // max nodes side-by-side inside a subnet
const COL_STRIDE    = NODE_W + NODE_GAP_X;  // 168

// Container (subnet group) internal geometry
const CTR_HDR   = 34;   // header band height — label lives here; nodes start BELOW
const CTR_PAD_H = 16;   // horizontal padding on each side inside container
const CTR_PAD_B = 14;   // bottom padding inside container

// SUBNET_W: fixed width that fits exactly NODES_PER_ROW nodes
const SUBNET_W = NODES_PER_ROW * NODE_W + (NODES_PER_ROW - 1) * NODE_GAP_X + 2 * CTR_PAD_H;
// = 2*148 + 20 + 32 = 348

// VPC geometry
const VPC_PAD  = 12;    // padding between VPC border and subnet edges
const VPC_HDR  = 26;    // VPC label band height
const VPC_GAP  = 12;    // gap between subnet rows inside VPC

// VPC width = subnet width + left/right VPC padding
const VPC_W = SUBNET_W + 2 * VPC_PAD;   // 348 + 24 = 372

// X column positions
const X_EXT_L   = 20;                       // external-left nodes
const X_VPC     = 190;                      // VPC left edge
const X_SUBNET  = X_VPC + VPC_PAD;         // 202 — subnet groups left edge
const X_COL_0   = X_SUBNET + CTR_PAD_H;   // 218 — first node column
const X_COL_1   = X_COL_0 + COL_STRIDE;   // 386 — second node column
const X_VPC_R   = X_VPC + VPC_W;           // 562 — VPC right edge
const X_EXT_R   = X_VPC_R + 30;            // 592 — external-right nodes

// VPC Y start
const Y_VPC = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Height helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Height for a subnet group containing `n` service nodes */
function subnetH(n: number): number {
  if (n === 0) return 0;
  const rows = Math.ceil(n / NODES_PER_ROW);
  return CTR_HDR + rows * NODE_H + (rows - 1) * NODE_GAP_Y + CTR_PAD_B;
}

/** Absolute position for the i-th node inside a subnet group at (sx, sy) */
function nodeInSubnet(sx: number, sy: number, i: number): { x: number; y: number } {
  const col = i % NODES_PER_ROW;
  const row = Math.floor(i / NODES_PER_ROW);
  return {
    x: sx + CTR_PAD_H + col * COL_STRIDE,
    y: sy + CTR_HDR + row * (NODE_H + NODE_GAP_Y),
  };
}

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
    variant === 'dotted' ? '2 4' : undefined;
  const stroke =
    variant === 'dotted' ? '#374151' :
    variant === 'dashed' ? '#5b21b6' : '#334155';
  return {
    id,
    source,
    target,
    label: opts.label,
    animated: opts.animated ?? false,
    type: 'smoothstep',
    style: { stroke, strokeWidth: 1.5, strokeDasharray },
    labelStyle: { fill: '#64748b', fontSize: 10 },
    labelBgStyle: { fill: '#020817', fillOpacity: 0.9 },
    labelBgPadding: [3, 4] as [number, number],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Node factories
// ─────────────────────────────────────────────────────────────────────────────

function serviceNode(comp: PlanComponent, x: number, y: number): Node {
  return {
    id: comp.id,
    type: 'serviceNode',
    position: { x, y },
    data: { label: comp.name, sub: comp.sub, accent: comp.accent },
    style: { width: NODE_W, height: NODE_H },
    draggable: false,
    selectable: false,
    connectable: false,
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
    style: { width: w, height: h },
    zIndex,
    draggable: false,
    selectable: false,
    connectable: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────────────────────────────────────

export interface DiagramResult {
  nodes: Node[];
  edges: Edge[];
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

  // ── Bucket plan components by diagram group ──────────────────────────────
  const g = (grp: string) => plan.components.filter((c) => c.diagramGroup === grp);

  const internet = plan.components.find((c) => c.id === 'internet');
  const waf      = plan.components.find((c) => c.id === 'waf');
  const cdn      = plan.components.find((c) => c.id === 'cdn');
  const publicC  = g('public');    // ALB, WSAPI
  const appC     = g('app');       // Compute
  const asyncC   = g('async');     // Queue, Worker
  const dataC    = g('data');      // RDS, DynamoDB, Cache, Search, S3
  const extRight = g('external-right');  // Monitoring, Audit, CI/CD

  // ── VPC subnet row heights ────────────────────────────────────────────────
  const pubH   = subnetH(publicC.length);
  const appH   = subnetH(appC.length);
  const asnH   = subnetH(asyncC.length);
  const datH   = subnetH(dataC.length);

  const hasPublic = publicC.length > 0;
  const hasApp    = appC.length > 0;
  const hasAsync  = asyncC.length > 0;
  const hasData   = dataC.length > 0;

  // Subnet Y positions (absolute, inside VPC)
  let curY = Y_VPC + VPC_HDR + VPC_GAP;

  const pubSubY = curY;
  if (hasPublic) curY += pubH + VPC_GAP;

  const appSubY = curY;
  if (hasApp) curY += appH + VPC_GAP;

  const asnSubY = curY;
  if (hasAsync) curY += asnH + VPC_GAP;

  const datSubY = curY;
  if (hasData) curY += datH + VPC_GAP;

  const vpcH = curY - Y_VPC;

  // ── VPC background group ─────────────────────────────────────────────────
  nodes.push(groupNode(
    'g-vpc',
    plan.vpc.multiAZ ? 'VPC  ·  Multi-AZ HA' : 'VPC',
    X_VPC, Y_VPC, VPC_W, vpcH,
    'slate', -3,
  ));

  // ── Subnet groups + their nodes ──────────────────────────────────────────
  const subnetLabel = (name: string) =>
    plan.vpc.multiAZ ? `${name}  ·  AZ-a & AZ-b` : name;

  if (hasPublic) {
    nodes.push(groupNode('g-pub', subnetLabel('Public Subnet'), X_SUBNET, pubSubY, SUBNET_W, pubH, 'blue', -2));
    publicC.forEach((c, i) => {
      const { x, y } = nodeInSubnet(X_SUBNET, pubSubY, i);
      nodes.push(serviceNode(c, x, y));
    });
  }

  if (hasApp) {
    nodes.push(groupNode('g-app', subnetLabel('Private App Subnet'), X_SUBNET, appSubY, SUBNET_W, appH, 'cyan', -2));
    appC.forEach((c, i) => {
      const { x, y } = nodeInSubnet(X_SUBNET, appSubY, i);
      nodes.push(serviceNode(c, x, y));
    });
  }

  if (hasAsync) {
    nodes.push(groupNode('g-async', 'Async Layer', X_SUBNET, asnSubY, SUBNET_W, asnH, 'purple', -2));
    asyncC.forEach((c, i) => {
      const { x, y } = nodeInSubnet(X_SUBNET, asnSubY, i);
      nodes.push(serviceNode(c, x, y));
    });
  }

  if (hasData) {
    nodes.push(groupNode('g-data', subnetLabel('Private Data Subnet'), X_SUBNET, datSubY, SUBNET_W, datH, 'emerald', -2));
    dataC.forEach((c, i) => {
      const { x, y } = nodeInSubnet(X_SUBNET, datSubY, i);
      nodes.push(serviceNode(c, x, y));
    });
  }

  // ── External-left nodes — stack, centered on VPC height ──────────────────
  const extLNodes = [internet, waf, cdn].filter(Boolean) as PlanComponent[];
  const extLTotalH = extLNodes.length * NODE_H + (extLNodes.length - 1) * NODE_GAP_Y;
  const extLStartY = Y_VPC + Math.max(0, (vpcH - extLTotalH) / 2);
  extLNodes.forEach((c, i) => {
    nodes.push(serviceNode(c, X_EXT_L, extLStartY + i * (NODE_H + NODE_GAP_Y)));
  });

  // ── External-right nodes — stack, centered on VPC height ─────────────────
  const extRTotalH = extRight.length * NODE_H + (extRight.length - 1) * NODE_GAP_Y;
  const extRStartY = Y_VPC + Math.max(0, (vpcH - extRTotalH) / 2);
  extRight.forEach((c, i) => {
    nodes.push(serviceNode(c, X_EXT_R, extRStartY + i * (NODE_H + NODE_GAP_Y)));
  });

  // ── Edges ─────────────────────────────────────────────────────────────────
  const hasWAF   = !!waf;
  const hasCDN   = !!cdn;
  const hasHTTPS = has('sec-https');
  const edgeSrc  = hasWAF ? 'waf' : 'internet';
  const tlsLabel = hasHTTPS ? 'HTTPS/TLS' : undefined;

  if (hasWAF)   edges.push(mkEdge('e-internet-waf', 'internet', 'waf'));
  if (hasCDN)   edges.push(mkEdge('e-src-cdn', edgeSrc, 'cdn', { label: tlsLabel }));
  if (hasCDN && plan.components.find((c) => c.id === 's3-frontend')) {
    edges.push(mkEdge('e-cdn-s3', 'cdn', 's3-frontend'));
  }

  const alb       = plan.components.find((c) => c.id === 'alb');
  const wsapi     = plan.components.find((c) => c.id === 'wsapi');
  const compute   = plan.components.find((c) => c.id === 'compute');
  const queue     = plan.components.find((c) => c.id === 'queue');
  const worker    = plan.components.find((c) => c.id === 'worker');
  const monitoring = plan.components.find((c) => c.id === 'monitoring');
  const cicd      = plan.components.find((c) => c.id === 'cicd');

  if (alb)   edges.push(mkEdge('e-src-alb',   edgeSrc, 'alb',   { label: tlsLabel }));
  if (wsapi) edges.push(mkEdge('e-src-wsapi', edgeSrc, 'wsapi', { label: hasHTTPS ? 'WSS/TLS' : undefined }));

  if (compute) {
    const entry = alb ? 'alb' : wsapi ? 'wsapi' : hasCDN ? 'cdn' : 'internet';
    edges.push(mkEdge('e-entry-compute', entry, 'compute'));
  }

  // Compute → data stores (solid)
  const dataSrc = compute ? 'compute' : alb ? 'alb' : null;
  if (dataSrc) {
    dataC.forEach((c) => edges.push(mkEdge(`e-ds-${c.id}`, dataSrc, c.id)));
  }

  // Async (dashed + animated)
  if (queue && compute)   edges.push(mkEdge('e-compute-queue', 'compute', 'queue', { variant: 'dashed', animated: true }));
  if (worker && queue)    edges.push(mkEdge('e-queue-worker',  'queue',   'worker', { variant: 'dashed', animated: true }));

  // Telemetry (dotted)
  if (monitoring) {
    const tSrc = compute ? 'compute' : alb ? 'alb' : 'internet';
    edges.push(mkEdge('e-telemetry', tSrc, 'monitoring', { variant: 'dotted' }));
  }

  // CI/CD (dashed)
  if (cicd && compute) edges.push(mkEdge('e-cicd-compute', 'cicd', 'compute', { variant: 'dashed', animated: true }));

  return { nodes, edges };
}

import type { Node, Edge } from 'reactflow';
import type { Tier, RecipeItem, Addon, Region } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout constants
// ─────────────────────────────────────────────────────────────────────────────

const COL_INTERNET = 60;
const COL_EDGE     = 260;
const COL_COMPUTE  = 520;
const COL_DATA     = 760;

const ROW_TOP      = 60;
const ROW_MID      = 200;
const ROW_BOT      = 340;
const ROW_EXTRA    = 480;

const NODE_W = 160;
const NODE_H = 64;

// ─────────────────────────────────────────────────────────────────────────────
// Node/edge style helpers
// ─────────────────────────────────────────────────────────────────────────────

function serviceNode(
  id: string,
  label: string,
  sub: string,
  x: number,
  y: number,
  accent: 'cyan' | 'blue' | 'purple' | 'amber' | 'emerald' | 'slate' | 'rose',
): Node {
  return {
    id,
    type: 'serviceNode',
    position: { x, y },
    data: { label, sub, accent },
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
  accent: 'cyan' | 'blue' | 'purple' | 'amber' | 'emerald' | 'slate',
): Node {
  return {
    id,
    type: 'groupNode',
    position: { x, y },
    data: { label, accent },
    style: { width: w, height: h },
    draggable: false,
    selectable: false,
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  label?: string,
  animated = false,
): Edge {
  return {
    id,
    source,
    target,
    label,
    animated,
    type: 'smoothstep',
    style: { stroke: '#334155', strokeWidth: 1.5 },
    labelStyle: { fill: '#64748b', fontSize: 10 },
    labelBgStyle: { fill: '#0f172a' },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────────────────────────────────────

export interface DiagramResult {
  nodes: Node[];
  edges: Edge[];
  /** Bounding box so the parent can size the canvas */
  width: number;
  height: number;
}

export function buildDiagram(
  tier: Tier,
  selections: RecipeItem[],
  addons: Addon,
  _region: Region,
): DiagramResult {
  const ids = new Set(selections.map((s) => s.id));
  const has = (id: string) => ids.has(id);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // ── Feature flags ───────────────────────────────────────────────────────
  const isStatic     = has('style-static');
  const hasWebAPI    = has('style-website-api');
  const isAPIFirst   = has('style-api-first');
  const isRealtime   = has('style-realtime');
  const hasJobs      = has('style-jobs');

  const hasSQL       = has('data-sql');
  const hasNoSQL     = has('data-nosql');
  const hasFiles     = has('data-files');
  const hasCache     = has('data-cache');
  const hasSearch    = has('data-search');

  const hasWAF       = has('sec-waf');
  const hasCompli    = has('sec-compliance');

  const isMultiAZ    = has('rel-multi-az');
  const hasCICD      = addons.cicd;

  const hasBasicMon  = has('ops-basic');
  const hasAdvMon    = has('ops-advanced');

  const hasCompute   = !isStatic || hasWebAPI || isAPIFirst || isRealtime || hasJobs;

  // ── Track data column Y cursor ───────────────────────────────────────────
  let dataY = ROW_TOP;
  const dataPush = () => { const y = dataY; dataY += NODE_H + 24; return y; };

  // ── Track right-side extras ──────────────────────────────────────────────
  let extrasX = 960;
  let extrasY = 60;
  const extrasPush = () => { const y = extrasY; extrasY += NODE_H + 24; return y; };

  // ── 1. Internet ──────────────────────────────────────────────────────────
  nodes.push(serviceNode('internet', 'Internet', 'Public traffic', COL_INTERNET, ROW_MID, 'slate'));

  // ── 2. WAF (optional) ────────────────────────────────────────────────────
  let edgeSource = 'internet';
  if (hasWAF) {
    nodes.push(serviceNode('waf', 'WAF', 'Rate limiting & rules', COL_EDGE - 10, ROW_TOP, 'amber'));
    edges.push(edge('e-internet-waf', 'internet', 'waf'));
    edgeSource = 'waf';
  }

  // ── 3. CDN / static layer ─────────────────────────────────────────────────
  let frontendTarget = '';
  if (isStatic || hasWebAPI) {
    nodes.push(serviceNode('cdn', 'CDN', 'Static assets', COL_EDGE, ROW_MID, 'cyan'));
    edges.push(edge('e-src-cdn', edgeSource, 'cdn', has('sec-https') ? 'HTTPS/TLS' : undefined));
    frontendTarget = 'cdn';
    if (hasWebAPI || isStatic) {
      nodes.push(serviceNode('s3-frontend', 'Object Store', 'Static files / frontend', COL_DATA, dataY > ROW_TOP ? dataY : ROW_TOP, 'blue'));
      const y = dataY; dataPush();
      nodes[nodes.length - 1].position.y = y;
      edges.push(edge('e-cdn-s3', 'cdn', 's3-frontend'));
    }
  }

  // ── 4. Load balancer / API Gateway ───────────────────────────────────────
  let lbId = '';
  if (!isStatic || hasWebAPI || isAPIFirst || isRealtime || hasJobs) {
    if (isRealtime) {
      lbId = 'wsapi';
      nodes.push(serviceNode('wsapi', 'WebSocket API', 'Real-time connections', COL_EDGE, ROW_BOT, 'blue'));
      edges.push(edge('e-src-wsapi', edgeSource, 'wsapi', has('sec-https') ? 'WSS/TLS' : undefined));
    } else if (hasWebAPI || isAPIFirst || hasJobs) {
      lbId = 'alb';
      nodes.push(serviceNode('alb', 'HTTPS Load Balancer', 'Routes API traffic', COL_EDGE, frontendTarget ? ROW_BOT : ROW_MID, 'blue'));
      const srcLabel = has('sec-https') ? 'HTTPS/TLS' : undefined;
      if (frontendTarget) {
        edges.push(edge('e-src-alb', edgeSource, 'alb', srcLabel));
      } else {
        edges.push(edge('e-internet-alb', 'internet', 'alb', srcLabel));
      }
    }
  }

  // ── 5. Compute ───────────────────────────────────────────────────────────
  let computeY = ROW_MID;
  if (frontendTarget && lbId) computeY = (ROW_MID + ROW_BOT) / 2;
  else if (frontendTarget) computeY = ROW_BOT;

  if (hasCompute) {
    const computeLabel = isRealtime
      ? 'Compute (WS handlers)'
      : isAPIFirst
      ? 'API Compute'
      : 'App Compute';
    const computeSub = tier === 3
      ? 'Containers / Serverless'
      : 'Serverless / Containers (AspenX)';
    nodes.push(serviceNode('compute', computeLabel, computeSub, COL_COMPUTE, computeY, 'cyan'));

    if (lbId) {
      edges.push(edge('e-lb-compute', lbId, 'compute'));
    } else if (frontendTarget === 'cdn') {
      edges.push(edge('e-cdn-compute', 'cdn', 'compute'));
    } else {
      edges.push(edge('e-internet-compute', 'internet', 'compute'));
    }
  }

  // ── 6. Background jobs ────────────────────────────────────────────────────
  if (hasJobs) {
    const queueY = computeY + NODE_H + 32;
    nodes.push(serviceNode('queue', 'Message Queue', 'Async tasks', COL_COMPUTE, queueY, 'purple'));
    nodes.push(serviceNode('worker', 'Worker', 'Background processing', COL_DATA, queueY, 'purple'));
    edges.push(edge('e-compute-queue', 'compute', 'queue', undefined, true));
    edges.push(edge('e-queue-worker', 'queue', 'worker', undefined, true));
  }

  // ── 7. Data layer ─────────────────────────────────────────────────────────
  const dataComputeTarget = hasCompute ? 'compute' : (lbId || 'internet');

  if (hasSQL) {
    nodes.push(serviceNode('rds', 'Relational DB', 'Postgres (managed)', COL_DATA, dataPush(), 'emerald'));
    edges.push(edge('e-compute-rds', dataComputeTarget, 'rds'));
  }
  if (hasNoSQL) {
    nodes.push(serviceNode('nosql', 'Key-Value Store', 'NoSQL (managed)', COL_DATA, dataPush(), 'emerald'));
    edges.push(edge('e-compute-nosql', dataComputeTarget, 'nosql'));
  }
  if (hasCache) {
    nodes.push(serviceNode('cache', 'Cache', 'Redis (in-memory)', COL_DATA, dataPush(), 'cyan'));
    edges.push(edge('e-compute-cache', dataComputeTarget, 'cache'));
  }
  if (hasSearch) {
    nodes.push(serviceNode('search', 'Search Index', 'Full-text search', COL_DATA, dataPush(), 'blue'));
    edges.push(edge('e-compute-search', dataComputeTarget, 'search'));
  }
  if (hasFiles && !has('style-static') && !has('style-website-api')) {
    nodes.push(serviceNode('files', 'Object Storage', 'File uploads', COL_DATA, dataPush(), 'slate'));
    edges.push(edge('e-compute-files', dataComputeTarget, 'files'));
  }

  // ── 8. Observability ─────────────────────────────────────────────────────
  if (hasBasicMon || hasAdvMon) {
    const monLabel = hasAdvMon ? 'Monitoring & Tracing' : 'Monitoring & Logs';
    const monSub   = hasAdvMon ? 'Metrics, traces, SLOs' : 'Metrics + alerts';
    nodes.push(serviceNode('monitoring', monLabel, monSub, extrasX, extrasPush(), 'rose'));
    if (hasCompute) edges.push(edge('e-compute-mon', 'compute', 'monitoring'));
  }

  // ── 9. Compliance ────────────────────────────────────────────────────────
  if (hasCompli) {
    nodes.push(serviceNode('audit', 'Audit & Encryption', 'Logs + KMS encryption', extrasX, extrasPush(), 'amber'));
  }

  // ── 10. CI/CD ────────────────────────────────────────────────────────────
  if (hasCICD) {
    nodes.push(serviceNode('cicd', 'CI/CD Pipeline', 'Automated deployments', extrasX, extrasPush(), 'purple'));
    if (hasCompute) edges.push(edge('e-cicd-compute', 'cicd', 'compute', undefined, true));
  }

  // ── 11. Multi-AZ group label ─────────────────────────────────────────────
  if (isMultiAZ) {
    // Place a background group behind the VPC core (compute + data)
    nodes.unshift(groupNode(
      'vpc',
      isMultiAZ ? 'VPC  ·  Multi-AZ' : 'VPC',
      COL_EDGE - 20,
      ROW_TOP - 40,
      COL_DATA + NODE_W + 40 - (COL_EDGE - 20),
      Math.max(dataY, extrasY, ROW_EXTRA) + NODE_H,
      'slate',
    ));
  }

  // ── Bounding box ─────────────────────────────────────────────────────────
  const allX = nodes.map((n) => (n.position?.x ?? 0) + ((n.style?.width as number) ?? NODE_W));
  const allY = nodes.map((n) => (n.position?.y ?? 0) + ((n.style?.height as number) ?? NODE_H));
  const width  = Math.max(...allX) + 80;
  const height = Math.max(...allY) + 80;

  return { nodes, edges, width, height };
}

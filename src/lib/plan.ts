import type { Tier, RecipeItem, Addon, Region } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ComponentCategory =
  | 'edge'
  | 'network'
  | 'compute'
  | 'data'
  | 'async'
  | 'realtime'
  | 'ops'
  | 'compliance'
  | 'cicd';

export type DiagramGroup =
  | 'external-left'   // Internet, DNS, CDN, WAF — outside VPC, left
  | 'public'          // ALB, WS API — inside VPC, public subnet
  | 'app'             // Compute — inside VPC, private-app subnet
  | 'data'            // DB, Cache, Search — inside VPC, private-data subnet
  | 'async'           // Queue, Worker — inside VPC, app/data layer
  | 'external-right'; // Monitoring, Audit, CICD — outside VPC, right

export interface PlanComponent {
  id: string;
  name: string;
  sub: string;
  category: ComponentCategory;
  awsServices: string[];
  details: string[];
  drivenBy: string[];
  diagramGroup: DiagramGroup;
  accent: 'cyan' | 'blue' | 'purple' | 'amber' | 'emerald' | 'slate' | 'rose';
}

export interface PlanFlow {
  id: string;
  name: string;
  type: 'request' | 'upload' | 'async' | 'telemetry';
  steps: string[];
}

export interface VpcPlan {
  cidr: string;
  multiAZ: boolean;
  azs: string[];
  subnets: { az: string; type: 'public' | 'private-app' | 'private-data'; cidr: string }[];
}

export interface DeploymentPlan {
  tier: Tier;
  region: Region;
  vpc: VpcPlan;
  components: PlanComponent[];
  flows: PlanFlow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Subnet CIDR helper
// ─────────────────────────────────────────────────────────────────────────────

function subnets(azs: string[]): VpcPlan['subnets'] {
  const out: VpcPlan['subnets'] = [];
  azs.forEach((az, ai) => {
    const base = ai * 48;
    out.push({ az, type: 'public',       cidr: `10.0.${base}.0/24`     });
    out.push({ az, type: 'private-app',  cidr: `10.0.${base + 16}.0/24` });
    out.push({ az, type: 'private-data', cidr: `10.0.${base + 32}.0/24` });
  });
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────────────────────────────────────

export function buildDeploymentPlan(
  tier: Tier,
  selections: RecipeItem[],
  addons: Addon,
  region: Region,
): DeploymentPlan {
  const ids = new Set(selections.map((s) => s.id));
  const has = (id: string) => ids.has(id);

  // ── Feature flags ─────────────────────────────────────────────────────────
  const isStatic    = has('style-static');
  const hasWebAPI   = has('style-website-api');
  const isAPIFirst  = has('style-api-first');
  const isRealtime  = has('style-realtime');
  const hasJobs     = has('style-jobs');
  const hasSQL      = has('data-sql');
  const hasNoSQL    = has('data-nosql');
  const hasFiles    = has('data-files');
  const hasCache    = has('data-cache');
  const hasSearch   = has('data-search');
  const hasHTTPS    = has('sec-https');
  const hasWAF      = has('sec-waf');
  const hasPrivDB   = has('sec-private-db');
  const hasCompli   = has('sec-compliance');
  const isMultiAZ   = has('rel-multi-az');
  const hasBackups  = has('rel-backups');
  const hasBlueGreen = has('rel-blue-green');
  const hasBasicMon = has('ops-basic');
  const hasAdvMon   = has('ops-advanced');
  const hasCICD     = addons.cicd;
  const hasSupport  = addons.support && tier === 2;

  const needsCDN     = isStatic || hasWebAPI;
  const needsCompute = !isStatic || hasWebAPI || isAPIFirst || isRealtime || hasJobs;
  const needsALB     = !isRealtime && (hasWebAPI || isAPIFirst || hasJobs);

  // ── VPC ───────────────────────────────────────────────────────────────────
  const azs = isMultiAZ ? [`${region}a`, `${region}b`] : [`${region}a`];
  const vpc: VpcPlan = {
    cidr: '10.0.0.0/16',
    multiAZ: isMultiAZ,
    azs,
    subnets: subnets(isMultiAZ ? ['a', 'b'] : ['a']),
  };

  // ── Components ────────────────────────────────────────────────────────────
  const components: PlanComponent[] = [];

  const add = (c: PlanComponent) => components.push(c);

  // Internet (always)
  add({
    id: 'internet',
    name: 'Internet',
    sub: 'Public traffic entry',
    category: 'edge',
    awsServices: [],
    details: ['Public inbound traffic from end-users and clients'],
    drivenBy: [],
    diagramGroup: 'external-left',
    accent: 'slate',
  });

  // DNS (always — placeholder)
  add({
    id: 'dns',
    name: 'DNS',
    sub: 'Route 53 (optional)',
    category: 'edge',
    awsServices: ['Route 53'],
    details: [
      'Custom domain routing via Route 53 hosted zone',
      'Health-check-based failover if Multi-AZ selected',
      'Can be managed externally — Route 53 is optional',
    ],
    drivenBy: [],
    diagramGroup: 'external-left',
    accent: 'slate',
  });

  // TLS / ACM
  if (hasHTTPS) {
    add({
      id: 'acm',
      name: 'TLS Certificate',
      sub: 'ACM-managed',
      category: 'edge',
      awsServices: ['AWS Certificate Manager'],
      details: [
        'Managed TLS certificate via ACM — free, auto-renews',
        'Attached to CloudFront or ALB for HTTPS termination',
      ],
      drivenBy: ['sec-https'],
      diagramGroup: 'external-left',
      accent: 'amber',
    });
  }

  // WAF
  if (hasWAF) {
    add({
      id: 'waf',
      name: 'WAF',
      sub: 'Rate limiting & rules',
      category: 'edge',
      awsServices: ['AWS WAF'],
      details: [
        'Web Application Firewall in front of CloudFront or ALB',
        'Rate-based rules to block abusive IPs',
        'Managed rule groups (common threats, SQLi, XSS)',
      ],
      drivenBy: ['sec-waf'],
      diagramGroup: 'external-left',
      accent: 'amber',
    });
  }

  // CDN
  if (needsCDN) {
    add({
      id: 'cdn',
      name: 'CDN',
      sub: 'CloudFront global edge',
      category: 'edge',
      awsServices: ['CloudFront', 'ACM'],
      details: [
        'Global CDN with 400+ PoPs via CloudFront',
        'Caches static assets at the edge (HTML, CSS, JS, images)',
        hasHTTPS ? 'HTTPS/TLS enforced via ACM certificate' : 'HTTP (HTTPS recommended)',
        hasWAF ? 'WAF rules evaluated before origin requests' : '',
      ].filter(Boolean),
      drivenBy: ['style-static', 'style-website-api'].filter(has),
      diagramGroup: 'external-left',
      accent: 'cyan',
    });
  }

  // VPC + Network (always if we have compute/data)
  if (needsCompute || hasSQL || hasNoSQL || hasCache || hasSearch) {
    add({
      id: 'vpc',
      name: 'VPC',
      sub: `${vpc.cidr} · ${isMultiAZ ? '2 AZs' : '1 AZ'}`,
      category: 'network',
      awsServices: ['VPC', 'Internet Gateway', 'NAT Gateway'],
      details: [
        `CIDR: ${vpc.cidr}`,
        isMultiAZ
          ? `Spans 2 AZs (${azs.join(', ')}) for high availability`
          : `Single AZ (${azs[0]})`,
        'Internet Gateway for public subnet egress',
        'NAT Gateway for private subnet outbound traffic',
        'Security Groups as per-resource firewall rules',
        'VPC Flow Logs enabled for network auditing',
      ],
      drivenBy: [],
      diagramGroup: 'external-left',
      accent: 'slate',
    });
  }

  // ALB
  if (needsALB) {
    add({
      id: 'alb',
      name: 'HTTPS Load Balancer',
      sub: 'Application Load Balancer',
      category: 'compute',
      awsServices: ['ALB', 'ACM', ...(hasWAF ? ['WAF'] : [])],
      details: [
        'Application Load Balancer in public subnet',
        hasHTTPS ? 'TLS termination via ACM certificate' : 'HTTP listener (HTTPS recommended)',
        isMultiAZ ? 'Multi-AZ targets for high availability' : 'Single-AZ target group',
        'Health checks on /health endpoint',
        hasWAF ? 'WAF rules evaluated on each request' : '',
        hasBlueGreen ? 'Blue/Green deploy via weighted target groups' : '',
      ].filter(Boolean),
      drivenBy: ['style-website-api', 'style-api-first', 'style-jobs'].filter(has),
      diagramGroup: 'public',
      accent: 'blue',
    });
  }

  // WebSocket API
  if (isRealtime) {
    add({
      id: 'wsapi',
      name: 'WebSocket API',
      sub: 'Real-time connections',
      category: 'realtime',
      awsServices: ['API Gateway (WebSocket)', 'ACM'],
      details: [
        'Managed WebSocket API via API Gateway',
        'Persistent connections for real-time push events',
        hasHTTPS ? 'WSS/TLS enforced' : 'WS (WSS recommended)',
        'Connection table stored in DynamoDB (connectionId)',
        'Routes: $connect, $disconnect, $default + custom',
      ],
      drivenBy: ['style-realtime'],
      diagramGroup: 'public',
      accent: 'blue',
    });
  }

  // App Compute
  if (needsCompute) {
    const isTier3 = tier === 3;
    add({
      id: 'compute',
      name: isRealtime ? 'WS Handlers' : isAPIFirst ? 'API Compute' : 'App Compute',
      sub: isTier3 ? 'Containers / Serverless (you deploy)' : 'Lambda / ECS Fargate',
      category: 'compute',
      awsServices: isTier3
        ? ['Lambda or ECS Fargate (Terraform)']
        : ['ECS Fargate', 'Lambda', 'ECR'],
      details: [
        isTier3
          ? 'Terraform module supports both Lambda (serverless) and ECS Fargate (containers)'
          : 'AspenX selects Lambda or ECS Fargate based on workload characteristics',
        'Private-app subnet — no direct public internet access',
        isMultiAZ ? 'Deployed across 2 AZs for high availability' : 'Single-AZ deployment',
        hasBlueGreen ? 'Blue/Green deployment with zero-downtime rollouts' : 'Rolling deploy strategy',
        hasCICD ? 'Deployed via GitHub Actions OIDC pipeline' : '',
        hasAdvMon ? 'X-Ray tracing instrumented' : hasBasicMon ? 'CloudWatch metrics + alarms' : '',
      ].filter(Boolean),
      drivenBy: ['style-website-api', 'style-api-first', 'style-realtime', 'style-jobs'].filter(has),
      diagramGroup: 'app',
      accent: 'cyan',
    });
  }

  // SQL Database
  if (hasSQL) {
    add({
      id: 'rds',
      name: 'Relational DB',
      sub: 'PostgreSQL · RDS',
      category: 'data',
      awsServices: ['RDS PostgreSQL', ...(isMultiAZ ? ['Multi-AZ Standby'] : [])],
      details: [
        'RDS PostgreSQL in private-data subnet',
        isMultiAZ ? 'Multi-AZ standby replica — automatic failover < 60s' : 'Single-AZ instance',
        hasPrivDB ? 'No public access — VPC-only, strict security group' : '',
        hasBackups ? 'Automated backups with point-in-time restore (7–35 days)' : '',
        hasCompli ? 'Storage encrypted at rest via KMS' : '',
        'Parameter group tuned for production (connection pooling, autovacuum)',
      ].filter(Boolean),
      drivenBy: ['data-sql'],
      diagramGroup: 'data',
      accent: 'emerald',
    });
  }

  // NoSQL
  if (hasNoSQL) {
    add({
      id: 'nosql',
      name: 'Key-Value Store',
      sub: 'DynamoDB',
      category: 'data',
      awsServices: ['DynamoDB', ...(isMultiAZ ? ['Global Tables (optional)'] : [])],
      details: [
        'DynamoDB — single-digit millisecond reads',
        'On-demand capacity mode (auto-scales, pay-per-request)',
        hasBackups ? 'Point-in-time recovery (PITR) enabled' : '',
        hasCompli ? 'Encryption at rest via KMS' : '',
        isRealtime ? 'Stores WebSocket connectionId table' : '',
      ].filter(Boolean),
      drivenBy: ['data-nosql'],
      diagramGroup: 'data',
      accent: 'emerald',
    });
  }

  // Cache
  if (hasCache) {
    add({
      id: 'cache',
      name: 'Cache',
      sub: 'Redis · ElastiCache',
      category: 'data',
      awsServices: ['ElastiCache for Redis'],
      details: [
        'ElastiCache for Redis in private-data subnet',
        isMultiAZ ? 'Multi-AZ with automatic failover' : 'Single-node',
        'Sub-millisecond reads — session store, rate-limiting, hot data',
        hasCompli ? 'Encryption in-transit and at-rest' : '',
      ].filter(Boolean),
      drivenBy: ['data-cache'],
      diagramGroup: 'data',
      accent: 'cyan',
    });
  }

  // Search
  if (hasSearch) {
    add({
      id: 'search',
      name: 'Search Index',
      sub: 'OpenSearch',
      category: 'data',
      awsServices: ['Amazon OpenSearch Service'],
      details: [
        'Amazon OpenSearch (managed Elasticsearch) in private-data subnet',
        'Full-text search + analytics with millisecond latency',
        isMultiAZ ? '2-node cluster across AZs' : '1-node dev cluster',
        hasCompli ? 'Fine-grained access control + at-rest encryption' : '',
      ].filter(Boolean),
      drivenBy: ['data-search'],
      diagramGroup: 'data',
      accent: 'blue',
    });
  }

  // Object storage (files) — outside data subnet
  if (hasFiles) {
    add({
      id: 'files',
      name: 'Object Storage',
      sub: 'S3 · file uploads',
      category: 'data',
      awsServices: ['S3', ...(needsCDN ? ['CloudFront (delivery)'] : [])],
      details: [
        'S3 bucket for user-uploaded files',
        'Pre-signed URLs generated by compute — client uploads directly (bypass server)',
        hasCompli ? 'Server-side encryption (SSE-KMS)' : 'SSE-S3 encryption',
        hasBackups ? 'Versioning enabled for file recovery' : '',
        needsCDN ? 'CloudFront distribution for fast global delivery' : '',
      ].filter(Boolean),
      drivenBy: ['data-files'],
      diagramGroup: 'data',
      accent: 'slate',
    });
  }

  // Frontend S3 bucket (static assets)
  if (needsCDN) {
    add({
      id: 's3-frontend',
      name: 'Frontend Assets',
      sub: 'S3 · static hosting',
      category: 'data',
      awsServices: ['S3', 'CloudFront OAC'],
      details: [
        'S3 bucket for compiled frontend (HTML/CSS/JS)',
        'Private bucket — accessible only via CloudFront OAC (no public-read)',
        'Deployed by CI/CD or AspenX on each build',
      ],
      drivenBy: ['style-static', 'style-website-api'].filter(has),
      diagramGroup: 'data',
      accent: 'blue',
    });
  }

  // Background jobs
  if (hasJobs) {
    add({
      id: 'queue',
      name: 'Message Queue',
      sub: 'SQS · async tasks',
      category: 'async',
      awsServices: ['SQS (Standard or FIFO)'],
      details: [
        'SQS queue for decoupled async task processing',
        'Visibility timeout prevents duplicate processing',
        'Dead-letter queue (DLQ) captures failed messages',
        'Worker scales independently from API compute',
      ],
      drivenBy: ['style-jobs'],
      diagramGroup: 'async',
      accent: 'purple',
    });
    add({
      id: 'worker',
      name: 'Worker',
      sub: 'Background processing',
      category: 'async',
      awsServices: ['Lambda (event source mapping)', 'or ECS Fargate task'],
      details: [
        'Processes messages from SQS queue',
        'Triggered automatically by SQS event source mapping',
        'Retries with exponential backoff on failure',
      ],
      drivenBy: ['style-jobs'],
      diagramGroup: 'async',
      accent: 'purple',
    });
  }

  // Monitoring
  if (hasBasicMon || hasAdvMon) {
    add({
      id: 'monitoring',
      name: hasAdvMon ? 'Monitoring & Tracing' : 'Monitoring & Logs',
      sub: hasAdvMon ? 'CloudWatch + X-Ray + SLOs' : 'CloudWatch metrics + alerts',
      category: 'ops',
      awsServices: [
        'CloudWatch Logs',
        'CloudWatch Metrics',
        'CloudWatch Alarms',
        ...(hasAdvMon ? ['X-Ray', 'CloudWatch ServiceLens'] : []),
      ],
      details: [
        'CloudWatch log groups for all services',
        'Metric alarms on error rate, latency, CPU/memory',
        hasAdvMon ? 'X-Ray distributed tracing with service map' : '',
        hasAdvMon ? 'SLO dashboards with burn-rate alerts' : '',
        'SNS topic for alarm notifications (email/PagerDuty)',
      ].filter(Boolean),
      drivenBy: ['ops-basic', 'ops-advanced'].filter(has),
      diagramGroup: 'external-right',
      accent: 'rose',
    });
  }

  // Compliance
  if (hasCompli) {
    add({
      id: 'audit',
      name: 'Audit & Encryption',
      sub: 'CloudTrail + KMS',
      category: 'compliance',
      awsServices: ['CloudTrail', 'KMS', 'S3 (audit logs)'],
      details: [
        'CloudTrail enabled for all API calls — audit trail',
        'CloudTrail logs stored in dedicated S3 bucket with integrity validation',
        'KMS CMK for encryption at rest on RDS, S3, and ElastiCache',
        'AWS Config rules for compliance drift detection',
      ],
      drivenBy: ['sec-compliance'],
      diagramGroup: 'external-right',
      accent: 'amber',
    });
  }

  // CI/CD
  if (hasCICD) {
    add({
      id: 'cicd',
      name: 'CI/CD Pipeline',
      sub: 'GitHub Actions + OIDC',
      category: 'cicd',
      awsServices: ['GitHub Actions', 'IAM OIDC', 'ECR', 'S3 (artifacts)'],
      details: [
        'GitHub Actions workflow with AWS OIDC (no long-lived credentials)',
        'On push to main: build → test → push image to ECR → deploy to ECS/Lambda',
        tier === 3 ? 'Terraform CI: plan on PR, apply on merge' : 'AspenX-managed deploy pipeline',
        'Rollback trigger on CloudWatch alarm breach',
      ],
      drivenBy: ['cicd-addon'],
      diagramGroup: 'external-right',
      accent: 'purple',
    });
  }

  // Support (Tier 2 add-on — informational)
  if (hasSupport) {
    add({
      id: 'support',
      name: 'Support & Changes',
      sub: 'AspenX managed · Tier 2',
      category: 'ops',
      awsServices: [],
      details: [
        'Monthly infrastructure changes handled by AspenX engineers',
        'Priority support via email/Slack',
        'Security patch management included',
      ],
      drivenBy: ['support-addon'],
      diagramGroup: 'external-right',
      accent: 'rose',
    });
  }

  // ── Flows ─────────────────────────────────────────────────────────────────
  const flows: PlanFlow[] = [];

  // Request flow
  {
    const steps: string[] = [];
    if (hasWAF)    steps.push('WAF evaluates request against rate-limit and managed rule groups');
    if (needsCDN)  steps.push('CloudFront checks edge cache — cache hit returns immediately');
    if (needsALB)  steps.push('ALB terminates TLS and routes to healthy compute target');
    else if (isRealtime) steps.push('API Gateway upgrades HTTP to WebSocket (WSS)');
    if (needsCompute) steps.push('Compute processes request (Lambda / ECS Fargate)');
    if (hasSQL)    steps.push('Relational DB query (RDS PostgreSQL)');
    if (hasCache)  steps.push('Cache lookup on hot paths (Redis)');
    if (hasNoSQL)  steps.push('Key-value read/write (DynamoDB)');
    steps.push('Response returned to client (with CDN caching headers if applicable)');
    flows.push({ id: 'request', name: 'Request path', type: 'request', steps });
  }

  // Upload flow
  if (hasFiles) {
    flows.push({
      id: 'upload',
      name: 'File upload path',
      type: 'upload',
      steps: [
        'Client requests a pre-signed S3 URL from compute',
        'Compute generates and returns a time-limited S3 pre-signed URL',
        'Client uploads file directly to S3 (bypasses compute)',
        'S3 event notification triggers compute (or Lambda) for post-processing',
        hasAdvMon ? 'Upload metrics tracked in CloudWatch' : '',
      ].filter(Boolean),
    });
  }

  // Async flow
  if (hasJobs) {
    flows.push({
      id: 'async',
      name: 'Async job path',
      type: 'async',
      steps: [
        'Compute enqueues a message on SQS queue',
        'SQS delivers message to Worker via event-source mapping',
        'Worker processes task (DB writes, email, file processing, etc.)',
        'On success: message deleted from queue',
        'On failure: message sent to DLQ after max retries',
        hasAdvMon ? 'Queue depth and DLQ depth tracked in CloudWatch' : '',
      ].filter(Boolean),
    });
  }

  // Telemetry flow
  if (hasBasicMon || hasAdvMon) {
    flows.push({
      id: 'telemetry',
      name: 'Telemetry path',
      type: 'telemetry',
      steps: [
        'All services emit structured logs to CloudWatch Logs',
        'CloudWatch Metrics collect service-level metrics (latency, errors, throughput)',
        hasAdvMon ? 'X-Ray traces capture per-request spans across all services' : '',
        'CloudWatch Alarms trigger SNS notifications on threshold breach',
        hasAdvMon ? 'SLO burn-rate alerts fire before error budget is exhausted' : '',
      ].filter(Boolean),
    });
  }

  return { tier, region, vpc, components, flows };
}

// ─────────────────────────────────────────────────────────────────────────────
// Category metadata (for UI rendering)
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<ComponentCategory, { label: string; icon: string; color: string }> = {
  edge:       { label: 'Edge & CDN',      icon: '🌐', color: 'text-cyan-400'   },
  network:    { label: 'Network (VPC)',   icon: '🔒', color: 'text-slate-400'  },
  compute:    { label: 'Compute',         icon: '⚡', color: 'text-blue-400'   },
  data:       { label: 'Data stores',     icon: '🗄️', color: 'text-emerald-400' },
  async:      { label: 'Async / Queue',   icon: '📨', color: 'text-purple-400' },
  realtime:   { label: 'Real-time',       icon: '⚡', color: 'text-blue-400'   },
  ops:        { label: 'Observability',   icon: '📊', color: 'text-rose-400'   },
  compliance: { label: 'Compliance',      icon: '🛡️', color: 'text-amber-400'  },
  cicd:       { label: 'CI/CD',           icon: '🚀', color: 'text-purple-400' },
};

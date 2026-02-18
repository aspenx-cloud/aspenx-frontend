import type { Topic } from './types';

export const TOPICS: Topic[] = [
  {
    id: 'traffic',
    label: 'Traffic & scale',
    exclusive: true,
    items: [
      {
        id: 'traffic-prototype',
        label: 'Prototype',
        category: 'traffic',
        description: '0–100 users',
        awsHints: ['t3.micro EC2 or Lambda', 'Single-AZ RDS if needed', 'No CDN required'],
      },
      {
        id: 'traffic-small',
        label: 'Small',
        category: 'traffic',
        description: '100–1,000 users',
        awsHints: ['t3.small/medium EC2 or Lambda', 'RDS single-AZ', 'CloudFront optional'],
      },
      {
        id: 'traffic-medium',
        label: 'Medium',
        category: 'traffic',
        description: '1k–100k users',
        awsHints: ['ECS Fargate + ALB + Auto Scaling', 'RDS Multi-AZ', 'CloudFront CDN'],
      },
      {
        id: 'traffic-large',
        label: 'Large',
        category: 'traffic',
        description: '100k+ users',
        awsHints: ['ECS/EKS with horizontal scaling', 'Aurora Global or RDS Multi-AZ', 'CloudFront + WAF'],
      },
    ],
  },
  {
    id: 'appStyle',
    label: 'App style',
    items: [
      {
        id: 'style-static',
        label: 'Static website only',
        category: 'appStyle',
        awsHints: ['S3 + CloudFront', 'No server required'],
      },
      {
        id: 'style-website-api',
        label: 'Website + API',
        category: 'appStyle',
        awsHints: ['CloudFront + S3 (frontend)', 'API Gateway or ALB + Lambda/ECS (API)'],
      },
      {
        id: 'style-api-first',
        label: 'API-first backend',
        category: 'appStyle',
        awsHints: ['API Gateway + Lambda', 'or ALB + ECS Fargate'],
      },
      {
        id: 'style-realtime',
        label: 'Realtime (websockets)',
        category: 'appStyle',
        awsHints: ['WebSocket API Gateway', 'or ALB + ECS with sticky sessions'],
      },
      {
        id: 'style-jobs',
        label: 'Background jobs',
        category: 'appStyle',
        awsHints: ['SQS + Lambda', 'or SQS + ECS worker'],
      },
    ],
  },
  {
    id: 'data',
    label: 'Data needs',
    items: [
      {
        id: 'data-sql',
        label: 'SQL database',
        category: 'data',
        awsHints: ['RDS PostgreSQL', 'or Aurora Serverless v2'],
      },
      {
        id: 'data-nosql',
        label: 'NoSQL (key-value)',
        category: 'data',
        awsHints: ['DynamoDB'],
      },
      {
        id: 'data-files',
        label: 'File uploads',
        category: 'data',
        awsHints: ['S3 with pre-signed URLs', 'optionally CloudFront for delivery'],
      },
      {
        id: 'data-cache',
        label: 'Caching',
        category: 'data',
        awsHints: ['ElastiCache Redis', 'or DAX for DynamoDB'],
      },
      {
        id: 'data-search',
        label: 'Full-text search',
        category: 'data',
        awsHints: ['OpenSearch (Elasticsearch)', 'or RDS with pg_trgm extension'],
      },
    ],
  },
  {
    id: 'security',
    label: 'Security needs',
    items: [
      {
        id: 'sec-https',
        label: 'HTTPS',
        category: 'security',
        awsHints: ['ACM certificate', 'ALB or CloudFront TLS termination'],
      },
      {
        id: 'sec-waf',
        label: 'WAF / rate limiting',
        category: 'security',
        awsHints: ['AWS WAF on CloudFront or ALB', 'Rate-based rules included'],
      },
      {
        id: 'sec-private-db',
        label: 'Private DB (no public access)',
        category: 'security',
        awsHints: ['RDS in private subnet', 'VPC + Security Groups'],
      },
      {
        id: 'sec-compliance',
        label: 'Compliance-ish',
        category: 'security',
        description: 'Audit logs, encryption',
        awsHints: ['CloudTrail + S3 audit logs', 'KMS encryption at rest', 'RDS encryption enabled'],
      },
    ],
  },
  {
    id: 'reliability',
    label: 'Reliability',
    items: [
      {
        id: 'rel-single-az',
        label: 'Single AZ ok',
        category: 'reliability',
        awsHints: ['Resources in one AZ', 'Lower cost — some downtime risk'],
      },
      {
        id: 'rel-multi-az',
        label: 'Multi-AZ HA',
        category: 'reliability',
        awsHints: ['ALB + Auto Scaling across AZs', 'RDS Multi-AZ standby'],
      },
      {
        id: 'rel-backups',
        label: 'Backups + PITR',
        category: 'reliability',
        description: 'Point-in-time restore',
        awsHints: ['RDS automated backups (7–35 days)', 'S3 versioning enabled'],
      },
      {
        id: 'rel-blue-green',
        label: 'Blue/green deploy',
        category: 'reliability',
        awsHints: ['CodeDeploy blue/green', 'or ECS rolling + circuit breaker'],
      },
    ],
  },
  {
    id: 'ops',
    label: 'Ops',
    items: [
      {
        id: 'ops-basic',
        label: 'Basic monitoring',
        category: 'ops',
        awsHints: ['CloudWatch metrics + alarms', 'Basic dashboard included'],
      },
      {
        id: 'ops-advanced',
        label: 'Advanced monitoring',
        category: 'ops',
        description: 'Tracing + SLOs',
        awsHints: ['CloudWatch + X-Ray tracing', 'SLO dashboards', 'SNS or PagerDuty alerting'],
      },
    ],
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  traffic: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
  appStyle: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  data: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
  security: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  reliability: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  ops: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
};

export type Tier = 1 | 2 | 3;

export type Region =
  | 'us-east-1'
  | 'us-west-2'
  | 'eu-west-1'
  | 'eu-central-1'
  | 'ap-southeast-1';

export const REGIONS: { value: Region; label: string }[] = [
  { value: 'us-east-1',      label: 'US East (N. Virginia)' },
  { value: 'us-west-2',      label: 'US West (Oregon)' },
  { value: 'eu-west-1',      label: 'EU (Ireland)' },
  { value: 'eu-central-1',   label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
];

export const DEFAULT_REGION: Region = 'us-east-1';

export type TopicCategory =
  | 'traffic'
  | 'appStyle'
  | 'data'
  | 'security'
  | 'reliability'
  | 'ops';

export interface RecipeItem {
  id: string;
  label: string;
  category: TopicCategory;
  description?: string;
  awsHints: string[];
}

export interface Topic {
  id: TopicCategory;
  label: string;
  /** Only one item from this topic may be selected at a time */
  exclusive?: boolean;
  items: RecipeItem[];
}

export interface Addon {
  cicd: boolean;
  /** Tier 2 only */
  support: boolean;
}

export interface BuilderState {
  tier: Tier | null;
  region: Region;
  selections: RecipeItem[];
  addons: Addon;
  awsAccountId: string;
}

export interface PriceLineItem {
  label: string;
  amount: number;
  recurring: boolean;
}

export interface PriceEstimate {
  /** AspenX fee — monthly portion (Tier 2 base + support) */
  aspenxMonthly: number;
  /** AspenX fee — one-time portion */
  aspenxOneTime: number;
  /** Itemised AspenX fee lines */
  aspenxBreakdown: PriceLineItem[];
  /** Estimated AWS monthly usage (region-adjusted, estimate only) */
  awsMonthlyEstimate: number;
  /** Simple complexity score (0–100) derived from number/type of items */
  complexityScore: number;
}

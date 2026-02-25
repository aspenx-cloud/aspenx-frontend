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

/** A single line in the AspenX fee breakdown */
export interface PriceBreakdownLine {
  label: string;
  amount: number;
  /** true = one-time/setup charge; false = recurring monthly charge */
  isSetup: boolean;
}

export interface PriceEstimate {
  /** What the customer pays AspenX */
  aspenx: {
    /** One-time setup/deployment fee (all tiers) */
    setupFee: number;
    /** Monthly management fee — always 0 for Tier 1 and Tier 3 */
    monthlyFee: number;
  };
  /** Estimated AWS monthly spend (region-adjusted). Billed separately by Amazon. */
  awsEstimate: {
    monthly: number;
  };
  /** Raw complexity point total derived from selected items */
  complexityScore: number;
  /** Itemised breakdown of AspenX fees */
  breakdown: PriceBreakdownLine[];
  /** Floor prices shown on tier cards ("Starts from") */
  startsFrom: {
    setupFee: number;
    monthlyFee: number; // 0 for Tier 1 and 3
  };
}

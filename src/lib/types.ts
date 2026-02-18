export type Tier = 1 | 2 | 3;

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
  selections: RecipeItem[];
  addons: Addon;
}

export interface PriceLineItem {
  label: string;
  amount: number;
  recurring: boolean;
}

export interface PriceEstimate {
  monthly: number;
  oneTime: number;
  breakdown: PriceLineItem[];
}

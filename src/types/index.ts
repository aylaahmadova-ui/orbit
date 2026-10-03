export type Category = 'family' | 'partner' | 'close_friend' | 'friend' | 'colleague' | 'acquaintance';

export type ContactFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'rarely';

export interface Person {
  id: string;
  name: string;
  category: Category;
  closeness: 1 | 2 | 3 | 4 | 5;
  contactFrequency?: ContactFrequency;
  lastContact?: string; // ISO date string (YYYY-MM-DD or full ISO)
  icon?: string;
  notes?: string;
  birthday?: string;
  tags?: string[];
  pinned?: { x: number; y: number; z: number } | null;
}

export interface Link {
  id: string;
  a: string;
  b: string;
  strength: 1 | 2 | 3;
}

export interface AppSettings {
  physics: boolean;
  autoRotate: boolean;
  showLabels: boolean;
  bloom: number;
}

export interface AppState {
  me: { name: string };
  people: Person[];
  links: Link[];
  settings: AppSettings;
}

export interface StrengthConfig {
  weights: {
    base: number;
    frequency: number;
    recency: number;
  };
  frequencyScores: Record<ContactFrequency, number>;
  categoryFloors: Record<Category, number>;
  minRadius: number;
  maxRadius: number;
}

export interface StrengthBreakdown {
  base: number;
  frequency: number;
  recency: number;
  categoryFloor: number;
  rawStrength: number;
  finalStrength: number;
  targetRadius: number;
}

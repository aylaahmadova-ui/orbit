export type Circle = 'core' | 'close' | 'regular' | 'distant';

export type RecencyStage = 'this_week' | 'this_month' | 'few_months' | 'over_a_year';

export interface Person {
  id: string;
  name: string;
  circle: Circle;
  drift: number; // 0..1 position within the circle band
  lastContact?: string; // ISO date string
  category?: string; // label only (e.g. 'family', 'partner', 'friend', 'colleague', 'acquaintance')
  icon?: string;
  notes?: string;
  pinned?: { x: number; y: number; z: number } | null;
}

export interface Link {
  id: string;
  a: string;
  b: string;
  strength?: number;
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

export const CIRCLE_DESCRIPTIONS: Record<Circle, string> = {
  core: "The few people you'd call at 3 a.m.",
  close: 'People you make real time for.',
  regular: 'Friends and people you enjoy seeing.',
  distant: 'People you know and keep warm.'
};

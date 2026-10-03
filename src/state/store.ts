import { AppState, Person, Link, AppSettings, Category } from '../types';

const STORAGE_KEY = 'orbit_app_state_v1';
const MAX_UNDO_STACK = 30;

export const INITIAL_SETTINGS: AppSettings = {
  physics: true,
  autoRotate: true,
  showLabels: true,
  bloom: 1.2
};

export const SAMPLE_PEOPLE: Person[] = [
  {
    id: 'p-partner',
    name: 'Elena Vance',
    category: 'partner',
    closeness: 5,
    contactFrequency: 'daily',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    icon: 'heart',
    notes: 'Architect & life partner. Favorite coffee: Flat White.',
    birthday: '1995-04-12',
    tags: ['Life', 'Core', 'Design']
  },
  {
    id: 'p-fam-1',
    name: 'Maya (Sister)',
    category: 'family',
    closeness: 5,
    contactFrequency: 'daily',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    icon: 'user-check',
    notes: 'Younger sister in Seattle. Working on her master’s thesis.',
    birthday: '1998-09-24',
    tags: ['Family', 'Seattle']
  },
  {
    id: 'p-fam-2',
    name: 'Arthur (Dad)',
    category: 'family',
    closeness: 4,
    contactFrequency: 'weekly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    icon: 'home',
    notes: 'Enjoys woodworking and antique watches.',
    tags: ['Family', 'Home']
  },
  {
    id: 'p-fam-3',
    name: 'Grandma Rosa',
    category: 'family',
    closeness: 4,
    contactFrequency: 'weekly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    icon: 'sun',
    notes: 'Bakes the best cinnamon pastries.',
    tags: ['Family']
  },
  {
    id: 'p-close-1',
    name: 'Marcus Chen',
    category: 'close_friend',
    closeness: 5,
    contactFrequency: 'daily',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    icon: 'zap',
    notes: 'Co-founder of old college startup. Tech & gaming buddy.',
    tags: ['Gaming', 'Tech', 'College']
  },
  {
    id: 'p-close-2',
    name: 'Sophia Patel',
    category: 'close_friend',
    closeness: 4,
    contactFrequency: 'weekly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    icon: 'smile',
    notes: 'Hiking trips & photography enthusiast.',
    tags: ['Outdoors', 'Photography']
  },
  {
    id: 'p-close-3',
    name: 'Lucas Dupont',
    category: 'close_friend',
    closeness: 4,
    contactFrequency: 'weekly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    icon: 'music',
    notes: 'Bassist in local jazz band. Vinyl collector.',
    tags: ['Music', 'Art']
  },
  {
    id: 'p-friend-1',
    name: 'Chloe Bennett',
    category: 'friend',
    closeness: 3,
    contactFrequency: 'monthly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    icon: 'compass',
    notes: 'Book club buddy & fellow traveler.',
    tags: ['Books', 'Travel']
  },
  {
    id: 'p-friend-2',
    name: 'David Kim',
    category: 'friend',
    closeness: 3,
    contactFrequency: 'monthly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    icon: 'coffee',
    notes: 'Bouldering gym regular.',
    tags: ['Climbing', 'Fitness']
  },
  {
    id: 'p-friend-3',
    name: 'Aisha Al-Mansoor',
    category: 'friend',
    closeness: 3,
    contactFrequency: 'monthly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    icon: 'globe',
    notes: 'Met during summer exchange in Berlin.',
    tags: ['Travel', 'Languages']
  },
  {
    id: 'p-friend-4',
    name: 'Oliver Wright',
    category: 'friend',
    closeness: 3,
    contactFrequency: 'yearly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    icon: 'film',
    notes: 'Indie cinema fan.',
    tags: ['Film', 'Culture']
  },
  {
    id: 'p-colleague-1',
    name: 'Sarah Jenkins',
    category: 'colleague',
    closeness: 3,
    contactFrequency: 'weekly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    icon: 'briefcase',
    notes: 'Lead Product Manager on project Orbit.',
    tags: ['Work', 'Product']
  },
  {
    id: 'p-colleague-2',
    name: 'Vikram Singh',
    category: 'colleague',
    closeness: 3,
    contactFrequency: 'weekly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    icon: 'code',
    notes: 'Senior Backend Systems Engineer.',
    tags: ['Work', 'Engineering']
  },
  {
    id: 'p-colleague-3',
    name: 'Emily Thorn',
    category: 'colleague',
    closeness: 2,
    contactFrequency: 'monthly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    icon: 'layers',
    notes: 'UX Researcher.',
    tags: ['Work', 'Design']
  },
  {
    id: 'p-colleague-4',
    name: 'Gabriel Rossi',
    category: 'colleague',
    closeness: 2,
    contactFrequency: 'yearly',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    icon: 'pie-chart',
    notes: 'Data Analytics Lead.',
    tags: ['Work', 'Data']
  },
  {
    id: 'p-acq-1',
    name: 'Liam Gallagher',
    category: 'acquaintance',
    closeness: 2,
    contactFrequency: 'rarely',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    icon: 'user',
    notes: 'Neighbor from 4th floor.',
    tags: ['Building']
  },
  {
    id: 'p-acq-2',
    name: 'Hannah Abbott',
    category: 'acquaintance',
    closeness: 1,
    contactFrequency: 'rarely',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    icon: 'hash',
    notes: 'Met at regional tech conference.',
    tags: ['Conference']
  },
  {
    id: 'p-acq-3',
    name: 'Julian Vance',
    category: 'acquaintance',
    closeness: 2,
    contactFrequency: 'rarely',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
    icon: 'user',
    notes: 'Elena’s cousin visiting from Montreal.',
    tags: ['Network']
  },
  {
    id: 'p-acq-4',
    name: 'Nora Fischer',
    category: 'acquaintance',
    closeness: 1,
    contactFrequency: 'rarely',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
    icon: 'coffee',
    notes: 'Local barista & ceramicist.',
    tags: ['Local']
  },
  {
    id: 'p-acq-5',
    name: 'Zack Miller',
    category: 'acquaintance',
    closeness: 1,
    contactFrequency: 'rarely',
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
    icon: 'user',
    notes: 'Dog park acquaintance.',
    tags: ['Pets']
  }
];

export const SAMPLE_LINKS: Link[] = [
  { id: 'l1', a: 'p-fam-1', b: 'p-fam-2', strength: 3 }, // Sister & Dad
  { id: 'l2', a: 'p-fam-1', b: 'p-fam-3', strength: 3 }, // Sister & Grandma
  { id: 'l3', a: 'p-partner', b: 'p-fam-1', strength: 3 }, // Elena & Sister
  { id: 'l4', a: 'p-close-1', b: 'p-close-2', strength: 2 }, // Marcus & Sophia
  { id: 'l5', a: 'p-colleague-1', b: 'p-colleague-2', strength: 3 }, // Sarah & Vikram
  { id: 'l6', a: 'p-colleague-1', b: 'p-colleague-3', strength: 2 }, // Sarah & Emily
  { id: 'l7', a: 'p-partner', b: 'p-acq-3', strength: 3 }, // Elena & Cousin Julian
  { id: 'l8', a: 'p-friend-1', b: 'p-close-2', strength: 2 } // Chloe & Sophia
];

export function getInitialState(): AppState {
  return {
    me: { name: 'YOU' },
    people: JSON.parse(JSON.stringify(SAMPLE_PEOPLE)),
    links: JSON.parse(JSON.stringify(SAMPLE_LINKS)),
    settings: { ...INITIAL_SETTINGS }
  };
}

export type Listener = (state: AppState) => void;

class StateStore {
  private state: AppState;
  private undoStack: AppState[] = [];
  private redoStack: AppState[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadFromStorage() || getInitialState();
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((fn) => fn(this.state));
  }

  private recordState() {
    const serialized = JSON.stringify(this.state);
    this.undoStack.push(JSON.parse(serialized));
    if (this.undoStack.length > MAX_UNDO_STACK) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(): void {
    if (!this.canUndo()) return;
    const current = JSON.stringify(this.state);
    this.redoStack.push(JSON.parse(current));
    this.state = this.undoStack.pop()!;
    this.notify();
  }

  public redo(): void {
    if (!this.canRedo()) return;
    const current = JSON.stringify(this.state);
    this.undoStack.push(JSON.parse(current));
    this.state = this.redoStack.pop()!;
    this.notify();
  }

  public addPerson(personData: Omit<Person, 'id'>): Person {
    this.recordState();
    const newPerson: Person = {
      ...personData,
      id: 'person-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    };
    this.state.people.push(newPerson);
    this.notify();
    return newPerson;
  }

  public updatePerson(id: string, updates: Partial<Person>): void {
    const idx = this.state.people.findIndex((p) => p.id === id);
    if (idx === -1) return;
    this.recordState();
    this.state.people[idx] = {
      ...this.state.people[idx],
      ...updates
    };
    this.notify();
  }

  public deletePerson(id: string): void {
    this.recordState();
    this.state.people = this.state.people.filter((p) => p.id !== id);
    // Remove links connected to this person
    this.state.links = this.state.links.filter((l) => l.a !== id && l.b !== id);
    this.notify();
  }

  public pinPerson(id: string, coords: { x: number; y: number; z: number }): void {
    const person = this.state.people.find((p) => p.id === id);
    if (!person) return;
    this.recordState();
    person.pinned = coords;
    this.notify();
  }

  public unpinPerson(id: string): void {
    const person = this.state.people.find((p) => p.id === id);
    if (!person || !person.pinned) return;
    this.recordState();
    person.pinned = null;
    this.notify();
  }

  public resetPins(): void {
    this.recordState();
    this.state.people.forEach((p) => {
      p.pinned = null;
    });
    this.notify();
  }

  public addLink(a: string, b: string, strength: 1 | 2 | 3 = 2): Link | null {
    if (a === b) return null;
    const exists = this.state.links.some(
      (l) => (l.a === a && l.b === b) || (l.a === b && l.b === a)
    );
    if (exists) return null;

    this.recordState();
    const newLink: Link = {
      id: 'link-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      a,
      b,
      strength
    };
    this.state.links.push(newLink);
    this.notify();
    return newLink;
  }

  public deleteLink(id: string): void {
    this.recordState();
    this.state.links = this.state.links.filter((l) => l.id !== id);
    this.notify();
  }

  public updateSettings(settingsUpdates: Partial<AppSettings>): void {
    this.recordState();
    this.state.settings = {
      ...this.state.settings,
      ...settingsUpdates
    };
    this.notify();
  }

  public updateMe(name: string): void {
    this.recordState();
    this.state.me.name = name;
    this.notify();
  }

  public clearSampleData(): void {
    this.recordState();
    this.state.people = [];
    this.state.links = [];
    this.notify();
  }

  public restoreSampleData(): void {
    this.recordState();
    const init = getInitialState();
    this.state.people = init.people;
    this.state.links = init.links;
    this.notify();
  }

  public exportJSON(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importJSON(jsonStr: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON format' };
      }
      if (!Array.isArray(parsed.people)) {
        return { success: false, error: 'Imported data missing "people" array' };
      }

      this.recordState();
      this.state = {
        me: parsed.me?.name ? { name: String(parsed.me.name) } : { name: 'YOU' },
        people: parsed.people,
        links: Array.isArray(parsed.links) ? parsed.links : [],
        settings: {
          ...INITIAL_SETTINGS,
          ...(parsed.settings || {})
        }
      };
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse JSON' };
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save Orbit state to localStorage:', e);
    }
  }

  private loadFromStorage(): AppState | null {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed && Array.isArray(parsed.people)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load Orbit state from localStorage:', e);
    }
    return null;
  }
}

export const store = new StateStore();

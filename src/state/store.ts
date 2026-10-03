import { AppState, Person, Link, AppSettings, Circle } from '../types';
import { isFading } from '../lib/recency';

const STORAGE_KEY = 'orbit_app_state_v2'; // Upgraded storage key
const LEGACY_STORAGE_KEY = 'orbit_app_state_v1';
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
    circle: 'core',
    drift: 0.4,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    category: 'partner',
    icon: 'heart',
    notes: 'Architect & life partner. Favorite coffee: Flat White.'
  },
  {
    id: 'p-fam-1',
    name: 'Maya (Sister)',
    circle: 'core',
    drift: 0.6,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    category: 'family',
    icon: 'user-check',
    notes: 'Younger sister in Seattle. Working on her thesis.'
  },
  {
    id: 'p-close-1',
    name: 'Marcus Chen',
    circle: 'core',
    drift: 0.5,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    category: 'close_friend',
    icon: 'zap',
    notes: 'Co-founder of old college startup. Tech & gaming buddy.'
  },
  {
    id: 'p-fam-2',
    name: 'Arthur (Dad)',
    circle: 'close',
    drift: 0.3,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    category: 'family',
    icon: 'home',
    notes: 'Enjoys woodworking and antique watches.'
  },
  {
    id: 'p-close-2',
    name: 'Sophia Patel',
    circle: 'close',
    drift: 0.5,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(), // Fading! (>30 days)
    category: 'close_friend',
    icon: 'smile',
    notes: 'Hiking trips & photography enthusiast.'
  },
  {
    id: 'p-close-3',
    name: 'Lucas Dupont',
    circle: 'close',
    drift: 0.7,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    category: 'close_friend',
    icon: 'music',
    notes: 'Bassist in local jazz band. Vinyl collector.'
  },
  {
    id: 'p-fam-3',
    name: 'Grandma Rosa',
    circle: 'close',
    drift: 0.8,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // Fading!
    category: 'family',
    icon: 'sun',
    notes: 'Bakes the best cinnamon pastries.'
  },
  {
    id: 'p-friend-1',
    name: 'Chloe Bennett',
    circle: 'regular',
    drift: 0.3,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    category: 'friend',
    icon: 'compass',
    notes: 'Book club buddy & fellow traveler.'
  },
  {
    id: 'p-friend-2',
    name: 'David Kim',
    circle: 'regular',
    drift: 0.5,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    category: 'friend',
    icon: 'coffee',
    notes: 'Bouldering gym regular.'
  },
  {
    id: 'p-colleague-1',
    name: 'Sarah Jenkins',
    circle: 'regular',
    drift: 0.4,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    category: 'colleague',
    icon: 'briefcase',
    notes: 'Lead Product Manager on project Orbit.'
  },
  {
    id: 'p-colleague-2',
    name: 'Vikram Singh',
    circle: 'regular',
    drift: 0.6,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    category: 'colleague',
    icon: 'code',
    notes: 'Senior Backend Systems Engineer.'
  },
  {
    id: 'p-friend-3',
    name: 'Aisha Al-Mansoor',
    circle: 'regular',
    drift: 0.8,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    category: 'friend',
    icon: 'globe',
    notes: 'Met during summer exchange in Berlin.'
  },
  {
    id: 'p-colleague-3',
    name: 'Emily Thorn',
    circle: 'distant',
    drift: 0.3,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    category: 'colleague',
    icon: 'layers',
    notes: 'UX Researcher.'
  },
  {
    id: 'p-acq-1',
    name: 'Liam Gallagher',
    circle: 'distant',
    drift: 0.4,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    category: 'acquaintance',
    icon: 'user',
    notes: 'Neighbor from 4th floor.'
  },
  {
    id: 'p-acq-2',
    name: 'Hannah Abbott',
    circle: 'distant',
    drift: 0.6,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    category: 'acquaintance',
    icon: 'hash',
    notes: 'Met at regional tech conference.'
  },
  {
    id: 'p-acq-3',
    name: 'Julian Vance',
    circle: 'distant',
    drift: 0.8,
    lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
    category: 'acquaintance',
    icon: 'user',
    notes: 'Elena’s cousin visiting from Montreal.'
  }
];

export const SAMPLE_LINKS: Link[] = [
  { id: 'l1', a: 'p-fam-1', b: 'p-fam-2' },
  { id: 'l2', a: 'p-fam-1', b: 'p-fam-3' },
  { id: 'l3', a: 'p-partner', b: 'p-fam-1' },
  { id: 'l4', a: 'p-close-1', b: 'p-close-2' },
  { id: 'l5', a: 'p-colleague-1', b: 'p-colleague-2' },
  { id: 'l6', a: 'p-colleague-1', b: 'p-colleague-3' },
  { id: 'l7', a: 'p-partner', b: 'p-acq-3' }
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

  public spokeToday(id: string): void {
    const person = this.state.people.find((p) => p.id === id);
    if (!person) return;
    this.recordState();
    person.lastContact = new Date().toISOString();
    this.notify();
  }

  public updateCircle(id: string, circle: Circle, drift: number = 0.5): void {
    const person = this.state.people.find((p) => p.id === id);
    if (!person) return;
    if (person.circle === circle && Math.abs(person.drift - drift) < 0.05) return;
    this.recordState();
    person.circle = circle;
    person.drift = drift;
    this.notify();
  }

  public deletePerson(id: string): void {
    this.recordState();
    this.state.people = this.state.people.filter((p) => p.id !== id);
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

  public addLink(a: string, b: string): Link | null {
    if (a === b) return null;
    const exists = this.state.links.some(
      (l) => (l.a === a && l.b === b) || (l.a === b && l.b === a)
    );
    if (exists) return null;

    this.recordState();
    const newLink: Link = {
      id: 'link-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      a,
      b
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

  public getFadingPeople(limit: number = 5): Person[] {
    return this.state.people.filter((p) => isFading(p)).slice(0, limit);
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
        me: { name: 'YOU' },
        people: parsed.people.map((p: any) => this.migratePersonData(p)),
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

  private migratePersonData(p: any): Person {
    // Legacy migration: closeness 5 -> core, 4 -> close, 3 -> regular, 1-2 -> distant
    let circle: Circle = p.circle || 'regular';
    if (p.closeness !== undefined && !p.circle) {
      if (p.closeness >= 5) circle = 'core';
      else if (p.closeness === 4) circle = 'close';
      else if (p.closeness === 3) circle = 'regular';
      else circle = 'distant';
    }

    return {
      id: p.id || 'person-' + Math.random(),
      name: p.name || 'Unnamed',
      circle,
      drift: typeof p.drift === 'number' ? p.drift : 0.5,
      lastContact: p.lastContact,
      category: p.category,
      icon: p.icon || 'user',
      notes: p.notes,
      pinned: p.pinned
    };
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
      // 1. Check v2 storage
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed && Array.isArray(parsed.people)) {
          parsed.people = parsed.people.map((p: any) => this.migratePersonData(p));
          return parsed;
        }
      }

      // 2. Check legacy v1 storage and migrate
      const legacyItem = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyItem) {
        const legacyParsed = JSON.parse(legacyItem);
        if (legacyParsed && Array.isArray(legacyParsed.people)) {
          const migratedPeople = legacyParsed.people.map((p: any) => this.migratePersonData(p));
          return {
            me: { name: 'YOU' },
            people: migratedPeople,
            links: Array.isArray(legacyParsed.links) ? legacyParsed.links : [],
            settings: { ...INITIAL_SETTINGS, ...(legacyParsed.settings || {}) }
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load Orbit state from localStorage:', e);
    }
    return null;
  }
}

export const store = new StateStore();

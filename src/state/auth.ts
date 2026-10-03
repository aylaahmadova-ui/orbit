export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const ACCOUNTS_STORAGE_KEY = 'orbit_accounts_v1';
const SESSION_STORAGE_KEY = 'orbit_current_session_v1';

export type AuthListener = (user: UserAccount | null) => void;

class MemoryStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string) { return this.store.get(key) || null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

const memoryStorage = new MemoryStorage();

function getStorage() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return memoryStorage;
}

export class AuthManager {
  private accounts: Map<string, UserAccount> = new Map();
  private currentUser: UserAccount | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.loadAccounts();
    this.loadSession();
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveSession();
    this.listeners.forEach((fn) => fn(this.currentUser));
  }

  public signUp(username: string, email: string, password: string): { success: boolean; error?: string; user?: UserAccount } {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters' };
    }

    for (const acc of this.accounts.values()) {
      if (acc.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return { success: false, error: 'Username is already taken' };
      }
      if (acc.email === cleanEmail) {
        return { success: false, error: 'An account with this email already exists' };
      }
    }

    const newUser: UserAccount = {
      id: 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString()
    };

    this.accounts.set(newUser.id, newUser);
    this.saveAccounts();

    this.currentUser = newUser;
    this.notify();

    return { success: true, user: newUser };
  }

  public signIn(identifier: string, password: string): { success: boolean; error?: string; user?: UserAccount } {
    const cleanId = identifier.trim().toLowerCase();
    const hash = this.hashPassword(password);

    let foundUser: UserAccount | null = null;

    for (const acc of this.accounts.values()) {
      if (acc.username.toLowerCase() === cleanId || acc.email.toLowerCase() === cleanId) {
        foundUser = acc;
        break;
      }
    }

    if (!foundUser) {
      return { success: false, error: 'Account not found' };
    }

    if (foundUser.passwordHash !== hash) {
      return { success: false, error: 'Incorrect password' };
    }

    this.currentUser = foundUser;
    this.notify();

    return { success: true, user: foundUser };
  }

  public signOut(): void {
    this.currentUser = null;
    this.notify();
  }

  public resetAllForTesting(): void {
    this.accounts.clear();
    this.currentUser = null;
    getStorage().clear();
  }

  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
  }

  private saveAccounts() {
    try {
      const list = Array.from(this.accounts.values());
      getStorage().setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save accounts:', e);
    }
  }

  private loadAccounts() {
    try {
      const data = getStorage().getItem(ACCOUNTS_STORAGE_KEY);
      if (data) {
        const list: UserAccount[] = JSON.parse(data);
        if (Array.isArray(list)) {
          list.forEach((acc) => this.accounts.set(acc.id, acc));
        }
      }
    } catch (e) {
      console.warn('Failed to load accounts:', e);
    }
  }

  private saveSession() {
    try {
      if (this.currentUser) {
        getStorage().setItem(SESSION_STORAGE_KEY, this.currentUser.id);
      } else {
        getStorage().removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }

  private loadSession() {
    try {
      const userId = getStorage().getItem(SESSION_STORAGE_KEY);
      if (userId && this.accounts.has(userId)) {
        this.currentUser = this.accounts.get(userId)!;
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    }
  }
}

export const auth = new AuthManager();

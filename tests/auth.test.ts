import { describe, it, expect, beforeEach } from 'vitest';
import { auth } from '../src/state/auth';

describe('Orbit User Authentication Engine', () => {
  beforeEach(() => {
    auth.resetAllForTesting();
  });

  it('registers a new user account successfully', () => {
    const res = auth.signUp('Ayla', 'ayla@example.com', 'password123');
    expect(res.success).toBe(true);
    expect(res.user?.username).toBe('Ayla');
    expect(auth.getCurrentUser()?.username).toBe('Ayla');
  });

  it('prevents duplicate username registration', () => {
    auth.signUp('Alex', 'alex1@example.com', 'pass1');
    const duplicate = auth.signUp('alex', 'alex2@example.com', 'pass2');

    expect(duplicate.success).toBe(false);
    expect(duplicate.error).toContain('already taken');
  });

  it('validates credentials during sign in', () => {
    auth.signUp('Jordan', 'jordan@example.com', 'secret123');
    auth.signOut();

    expect(auth.getCurrentUser()).toBeNull();

    const wrongPass = auth.signIn('Jordan', 'wrongpass');
    expect(wrongPass.success).toBe(false);

    const correctUser = auth.signIn('jordan', 'secret123');
    expect(correctUser.success).toBe(true);
    expect(auth.getCurrentUser()?.username).toBe('Jordan');
  });

  it('allows sign in using email address', () => {
    auth.signUp('Sam', 'sam@orbit.app', 'mypassword');
    auth.signOut();

    const emailLogin = auth.signIn('sam@orbit.app', 'mypassword');
    expect(emailLogin.success).toBe(true);
    expect(auth.getCurrentUser()?.username).toBe('Sam');
  });
});

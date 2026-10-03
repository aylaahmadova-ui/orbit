import { Person, RecencyStage } from '../types';

export function getRecencyStage(lastContact?: string, now: Date = new Date()): RecencyStage {
  if (!lastContact) return 'over_a_year';

  const contactDate = new Date(lastContact);
  if (isNaN(contactDate.getTime())) return 'over_a_year';

  const diffMs = Math.max(0, now.getTime() - contactDate.getTime());
  const daysSince = diffMs / (1000 * 60 * 60 * 24);

  if (daysSince < 7) return 'this_week';
  if (daysSince < 30) return 'this_month';
  if (daysSince < 90) return 'few_months';
  return 'over_a_year';
}

export function getRecencyBrightness(lastContact?: string, now: Date = new Date()): number {
  const stage = getRecencyStage(lastContact, now);

  switch (stage) {
    case 'this_week':
      return 1.0;
    case 'this_month':
      return 0.75;
    case 'few_months':
      return 0.45;
    case 'over_a_year':
    default:
      return 0.25; // Dim but never invisible
  }
}

export function isFading(person: Person, now: Date = new Date()): boolean {
  if (person.circle !== 'core' && person.circle !== 'close') {
    return false;
  }

  if (!person.lastContact) return true;

  const contactDate = new Date(person.lastContact);
  if (isNaN(contactDate.getTime())) return true;

  const diffMs = Math.max(0, now.getTime() - contactDate.getTime());
  const daysSince = diffMs / (1000 * 60 * 60 * 24);

  return daysSince >= 30; // Dim line for Core/Close if not contacted in >30 days
}

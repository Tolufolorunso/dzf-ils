export const DEFAULT_COHORT_TYPES = [
  'cohort-1',
  'cohort-2',
  'cohort-3',
  'cohort-4',
  'cohort-5',
  'cohort-6',
  'cohort-7',
];

export const LEGACY_COHORT_ALIASES = {
  cohortone: 'cohort-1',
  cohort1: 'cohort-1',
  'cohort-1': 'cohort-1',
  cohorttwo: 'cohort-2',
  cohort2: 'cohort-2',
  'cohort-2': 'cohort-2',
  cohortthree: 'cohort-3',
  cohort3: 'cohort-3',
  'cohort-3': 'cohort-3',
  cohortfour: 'cohort-4',
  cohort4: 'cohort-4',
  'cohort-4': 'cohort-4',
  cohortfive: 'cohort-5',
  cohort5: 'cohort-5',
  'cohort-5': 'cohort-5',
  cohortsix: 'cohort-6',
  cohort6: 'cohort-6',
  'cohort-6': 'cohort-6',
  cohortseven: 'cohort-7',
  cohort7: 'cohort-7',
  'cohort-7': 'cohort-7',
};

export function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeCohortType(value) {
  const rawValue = cleanText(value).toLowerCase();

  if (!rawValue) {
    return '';
  }

  const normalized = rawValue
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (LEGACY_COHORT_ALIASES[normalized]) {
    return LEGACY_COHORT_ALIASES[normalized];
  }

  const cohortMatch = normalized.match(/^cohort-?([1-7])$/);
  if (cohortMatch) {
    return `cohort-${cohortMatch[1]}`;
  }

  return normalized;
}

export function formatCohortLabel(value) {
  const normalized = normalizeCohortType(value);

  if (!normalized) {
    return '';
  }

  return normalized.replace(/-/g, ' ');
}

export function isDefaultCohortType(value) {
  return DEFAULT_COHORT_TYPES.includes(normalizeCohortType(value));
}

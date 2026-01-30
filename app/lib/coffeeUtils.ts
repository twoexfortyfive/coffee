export const normalizeTitleCase = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed
    .toLowerCase()
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
};

export const toNullableString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const parseOptionalNumber = (value?: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const parseRating = (value: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error('Invalid rating');
  }
  return parsed;
};

export const splitTags = (value?: string | null) => {
  if (!value) return [];
  const rawParts = value
    .split(',')
    .flatMap((segment) => segment.split(' and '))
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(rawParts));
};

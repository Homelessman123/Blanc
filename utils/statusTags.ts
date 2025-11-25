import type { ContentStatus } from '../types';

const STATUS_PREFIX = '__status:';

const isStatusTag = (value: string) =>
  value.toLowerCase().startsWith(STATUS_PREFIX);

const normalizeStatus = (value: string, fallback: ContentStatus): ContentStatus => {
  const upper = value.toUpperCase() as ContentStatus;
  if (upper === 'DRAFT' || upper === 'PUBLISHED' || upper === 'ARCHIVED') {
    return upper;
  }
  return fallback;
};

export const encodeStatusTag = (status: ContentStatus): string =>
  `${STATUS_PREFIX}${status.toLowerCase()}`;

export const extractStatusTag = (
  rawItems: string[] | null | undefined,
  fallback: ContentStatus = 'PUBLISHED'
) => {
  const items = Array.isArray(rawItems)
    ? rawItems.filter(Boolean).map((item) => item.trim()).filter(Boolean)
    : [];

  const statusTag = items.find(isStatusTag);
  const status = statusTag
    ? normalizeStatus(statusTag.replace(STATUS_PREFIX, ''), fallback)
    : fallback;

  const cleaned = items.filter((item) => !isStatusTag(item));

  return { status, cleaned };
};

export const upsertStatusTag = (
  rawItems: string[] | null | undefined,
  status: ContentStatus
) => {
  const items = Array.isArray(rawItems)
    ? rawItems.filter(Boolean).map((item) => item.trim()).filter(Boolean)
    : [];

  const withoutStatus = items.filter((item) => !isStatusTag(item));
  return [...withoutStatus, encodeStatusTag(status)];
};

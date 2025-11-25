import { Contest, ContentStatus, DocumentResource } from '../types';
import { extractStatusTag } from './statusTags';

const DEFAULT_IMAGE = '/images/Competition.jpg';

const parseTags = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const mapContestFromApi = (contest: any): Contest => {
  const rawTags = parseTags(contest.tags);
  const fallbackStatus: ContentStatus =
    contest.isActive === false ? 'DRAFT' : 'PUBLISHED';
  const { status, cleaned } = extractStatusTag(rawTags, fallbackStatus);

  return {
    id: contest.id,
    title: contest.title,
    organization: contest.organizer || contest.organization || '',
    organizer: contest.organizer,
    description: contest.description,
    imageUrl: contest.imageUrl || DEFAULT_IMAGE,
    deadline: contest.registrationDeadline || contest.startDate,
    registrationDeadline: contest.registrationDeadline,
    startDate: contest.startDate,
    tags: cleaned,
    relatedCourseIds: contest.relatedCourseIds || [],
    category: contest.category,
    fee: contest.fee || 0,
    format: contest.format,
    targetGrade: contest.targetGrade,
    registrationUrl: contest.registrationUrl,
    prizeAmount: contest.prize,
    website: contest.website,
    benefits: contest.benefits || [],
    eligibility: contest.eligibility || [],
    schedule: contest.schedule || [],
    judges: contest.judges || [],
    partners: contest.partners || [],
    contactInfo: contest.contactInfo || null,
    suggestedProducts: contest.suggestedProducts as DocumentResource[] | undefined,
    status,
    isActive: contest.isActive,
  };
};

export const mapContestList = (items: any[]): Contest[] =>
  items.map(mapContestFromApi);

import type { Contest, DocumentResource, ContentStatus } from '../types';
import type {
  Block,
  ContestFormValues,
  ProductFormValues,
  ProductType,
} from './types';

const normalizeDateInput = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const guid = () => Math.random().toString(36).slice(2, 10);

export const blocksToDescription = (blocks: Block[], summary?: string) => {
  const lines = blocks
    .map((block) => {
      switch (block.type) {
        case 'h2':
          return `## ${block.content}`;
        case 'h3':
          return `### ${block.content}`;
        case 'quote':
          return `> ${block.content}`;
        case 'list': {
          const items = block.content
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean);
          return items.map((item) => `- ${item}`).join('\n');
        }
        case 'image':
          return block.content ? `![image](${block.content})` : '';
        default:
          return block.content;
      }
    })
    .filter(Boolean);

  const content = lines.join('\n\n').trim();
  if (summary) {
    return `${summary.trim()}\n\n${content}`.trim();
  }
  return content;
};

export const descriptionToBlocks = (description?: string | null): Block[] => {
  if (!description) return [];
  const parts = description
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [];
  }

  return parts.map((content, index) => ({
    id: `blk-${index}-${guid()}`,
    type: 'paragraph',
    content,
  }));
};

const takeSummary = (text?: string | null, fallback = '') => {
  if (!text) return fallback;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177)}...`;
};

const joinLines = (value?: string[] | null) =>
  (value || []).join('\n');

const toStatus = (
  status?: ContentStatus,
  isActive?: boolean
): ContentStatus => {
  if (status) return status;
  return isActive === false ? 'DRAFT' : 'PUBLISHED';
};

export const contestToFormValues = (contest: Contest): ContestFormValues => ({
  id: contest.id,
  title: contest.title,
  organizer: contest.organizer || contest.organization || '',
  summary: takeSummary(contest.description),
  imageUrl: contest.imageUrl || '',
  startDate: normalizeDateInput(contest.startDate),
  endDate: normalizeDateInput(contest.deadline || contest.startDate),
  registrationDeadline: normalizeDateInput(
    contest.registrationDeadline || contest.deadline
  ),
  website: contest.website || '',
  fee: contest.fee !== undefined && contest.fee !== null
    ? String(contest.fee)
    : '',
  format: contest.format || '',
  targetGrade: contest.targetGrade || '',
  tags: (contest.tags || []).join(', '),
  status: toStatus(contest.status, contest.isActive),
  blocks: descriptionToBlocks(contest.description),
  benefits: joinLines(contest.benefits),
  eligibility: joinLines(contest.eligibility),
});

export const productToFormValues = (
  product: DocumentResource
): ProductFormValues => ({
  id: product.id,
  title: product.name,
  summary: takeSummary(product.description),
  imageUrl: product.imageUrl || '',
  price: product.price !== undefined && product.price !== null
    ? String(product.price)
    : '',
  type: (product.type as ProductType) || 'DOCUMENT',
  downloadUrl: product.downloadUrl || '',
  level: product.level || '',
  duration: product.duration || '',
  language: product.language || '',
  categories: (product.categories || []).join(', '),
  status: toStatus(product.status, product.isApproved),
  blocks: descriptionToBlocks(product.description),
});

import { contestAPI, productAPI } from './api';
import { mapContestFromApi } from '../utils/contestUtils';
import { mapProductFromApi } from '../utils/productUtils';
import { upsertStatusTag } from '../utils/statusTags';
import { blocksToDescription } from '../admin/transformers';
import {
  ContentType,
  ContestFormValues,
  ProductFormValues,
  AdminContentItem,
} from '../admin/types';
import type { Contest, DocumentResource, ContentStatus } from '../types';

const parseListInput = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const withStatusTag = (items: string[], status: ContentStatus) =>
  upsertStatusTag(items, status);

const toAdminContestItem = (contest: Contest): AdminContentItem => ({
  id: contest.id,
  title: contest.title,
  summary: contest.description,
  status: contest.status || (contest.isActive === false ? 'DRAFT' : 'PUBLISHED'),
  type: ContentType.COMPETITION,
  thumbnail: contest.imageUrl,
  createdAt: contest.createdAt,
  updatedAt: contest.updatedAt,
  tags: contest.tags,
  author: contest.organizer || contest.organization,
});

const toAdminDocumentItem = (
  document: DocumentResource
): AdminContentItem => ({
  id: document.id,
  title: document.name,
  summary: document.description,
  status: document.status || (document.isApproved === false ? 'DRAFT' : 'PUBLISHED'),
  type: ContentType.DOCUMENT,
  thumbnail: document.imageUrl || undefined,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  tags: document.categories || undefined,
  author: document.sellerName || 'ContestHub',
  rating: document.rating ?? null,
  reviewCount: document.reviewCount ?? null,
});

export const adminContentService = {
  async fetchContests(): Promise<Contest[]> {
    const response = await contestAPI.getAll();
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(mapContestFromApi);
  },

  async fetchDocuments(): Promise<DocumentResource[]> {
    const response = await productAPI.getAll();
    const data = Array.isArray(response.data) ? response.data : [];
    return data.map(mapProductFromApi);
  },

  async saveContest(form: ContestFormValues): Promise<Contest> {
    const tags = withStatusTag(parseListInput(form.tags), form.status);
    const payload = {
      title: form.title,
      description: blocksToDescription(form.blocks, form.summary),
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      registrationDeadline: form.registrationDeadline || form.startDate,
      organizer: form.organizer,
      website: form.website,
      imageUrl: form.imageUrl,
      fee: form.fee ? Number(form.fee) : 0,
      format: form.format || undefined,
      targetGrade: form.targetGrade || undefined,
      tags,
      benefits: form.benefits
        ? form.benefits.split('\n').map((item) => item.trim()).filter(Boolean)
        : undefined,
      eligibility: form.eligibility
        ? form.eligibility.split('\n').map((item) => item.trim()).filter(Boolean)
        : undefined,
      isActive: form.status === 'PUBLISHED',
    };

    if (form.id) {
      const response = await contestAPI.update(form.id, payload);
      return mapContestFromApi(response.data.contest || response.data);
    }

    const response = await contestAPI.create(payload);
    return mapContestFromApi(response.data.contest || response.data);
  },

  async deleteContest(id: string): Promise<void> {
    await contestAPI.delete(id);
  },

  async saveDocument(form: ProductFormValues): Promise<DocumentResource> {
    const categories = withStatusTag(parseListInput(form.categories), form.status);
    const payload = {
      name: form.title,
      description: blocksToDescription(form.blocks, form.summary),
      price: form.price ? Number(form.price) : 0,
      type: form.type,
      imageUrl: form.imageUrl,
      downloadUrl: form.downloadUrl || undefined,
      categories,
      duration: form.duration || undefined,
      level: form.level || undefined,
      language: form.language || undefined,
      isApproved: form.status === 'PUBLISHED',
    };

    if (form.id) {
      const response = await productAPI.update(form.id, payload);
      return mapProductFromApi(response.data);
    }

    const response = await productAPI.create(payload);
    return mapProductFromApi(response.data);
  },

  async deleteDocument(id: string): Promise<void> {
    await productAPI.delete(id);
  },

  async fetchDocumentReviews(id: string) {
    const response = await productAPI.getReviews(id);
    return Array.isArray(response.data) ? response.data : [];
  },

  toAdminContestItem,
  toAdminDocumentItem,
};

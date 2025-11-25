import { ContentStatus, Course, DocumentResource } from '../types';
import { extractStatusTag } from './statusTags';

const DEFAULT_IMAGE = '/images/Competition.jpg';

const parseCategories = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const typeLabelMap: Record<string, string> = {
  COURSE: 'Khóa học trực tuyến',
  DOCUMENT: 'Tài liệu',
  WORKSHOP: 'Workshop',
  CONSULTATION: 'Tư vấn',
};

export const mapProductFromApi = (product: any): DocumentResource => {
  const categories = parseCategories(product.categories);
  const fallbackStatus: ContentStatus =
    product.isApproved === false ? 'DRAFT' : 'PUBLISHED';
  const { status, cleaned } = extractStatusTag(categories, fallbackStatus);

  const reviews = product.reviews || [];

  return {
    id: product.id,
    name: product.name || product.title,
    description: product.description,
    price: product.price,
    type: product.type,
    imageUrl: product.imageUrl || DEFAULT_IMAGE,
    downloadUrl: product.downloadUrl || null,
    categories: cleaned,
    duration: product.duration || null,
    level: product.level || null,
    language: product.language || null,
    isApproved: product.isApproved,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    rating: product.rating ?? null,
    reviewCount: product.reviewCount ?? (reviews.length || null),
    sellerName: product.seller?.name || product.sellerName || null,
    status,
    reviews,
  };
};

export const mapProductToCourse = (product: DocumentResource): Course => {
  return {
    id: product.id,
    title: product.name,
    author: product.sellerName || 'ContestHub',
    price: product.price,
    description: product.description,
    imageUrl: product.imageUrl || DEFAULT_IMAGE,
    type: typeLabelMap[product.type] || product.type,
    duration: product.duration || undefined,
    level: product.level || undefined,
    language: product.language || undefined,
    rating: product.rating ?? undefined,
    reviewCount: product.reviewCount ?? (product.reviews ? product.reviews.length : undefined),
    reviews: product.reviews || [],
    downloadUrl: product.downloadUrl || undefined,
  };
};

export const mapProductListToCourses = (products: any[]): Course[] =>
  products
    .map(mapProductFromApi)
    .filter((item) => !item.status || item.status === 'PUBLISHED')
    .map(mapProductToCourse);

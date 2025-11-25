import type { ContentStatus, Contest, DocumentResource } from '../types';

export type AdminPage = 'dashboard' | 'users' | 'competitions' | 'documents' | 'community' | 'editor';

export enum ContentType {
  COMPETITION = 'COMPETITION',
  DOCUMENT = 'DOCUMENT',
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    displayName?: string | null;
    name?: string | null;
  };
}

export type BlockType = 'h2' | 'h3' | 'paragraph' | 'image' | 'list' | 'quote';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  meta?: any;
}

export interface AdminContentItem {
  id: string;
  title: string;
  summary?: string;
  status: ContentStatus;
  type: ContentType;
  thumbnail?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  views?: number;
  rating?: number | null;
  reviewCount?: number | null;
}

export interface ContestFormValues {
  id?: string;
  title: string;
  organizer: string;
  summary: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  website: string;
  fee: string;
  format: Contest['format'] | '';
  targetGrade: string;
  tags: string;
  status: ContentStatus;
  blocks: Block[];
  benefits: string;
  eligibility: string;
}

export type ProductType = 'COURSE' | 'DOCUMENT' | 'WORKSHOP' | 'CONSULTATION';

export interface ProductFormValues {
  id?: string;
  title: string;
  summary: string;
  imageUrl: string;
  price: string;
  type: ProductType;
  downloadUrl: string;
  level: DocumentResource['level'] | '';
  duration: string;
  language: string;
  categories: string;
  status: ContentStatus;
  blocks: Block[];
}

export interface AdminDashboardStats {
  totalPosts: number;
  totalUsers: number;
  contestCount: number;
  documentCount: number;
}

export const defaultContestForm: ContestFormValues = {
  title: '',
  organizer: '',
  summary: '',
  imageUrl: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  website: '',
  fee: '',
  format: '',
  targetGrade: '',
  tags: '',
  status: 'DRAFT',
  blocks: [],
  benefits: '',
  eligibility: '',
};

export const defaultProductForm: ProductFormValues = {
  title: '',
  summary: '',
  imageUrl: '',
  price: '',
  type: 'DOCUMENT',
  downloadUrl: '',
  level: '',
  duration: '',
  language: '',
  categories: '',
  status: 'DRAFT',
  blocks: [],
};

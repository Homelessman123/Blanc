
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  balance?: number;
  streak?: number;
  walletBalance?: number;
  displayName?: string;
  profileColor?: string;
  profileGif?: string;
  phoneNumber?: string;
  location?: string | null;
  // User preferences for contest matching
  interests?: string[]; // JSON array
  talents?: string[]; // JSON array
  futureMajor?: string;
}

export interface Contest {
  id: string;
  title: string;
  organization: string;
  organizer?: string;
  description: string;
  imageUrl: string;
  deadline: string;
  startDate: string;
  tags: string[];
  relatedCourseIds: string[];
  category?: string; // Category for matching
  fee?: number; // Contest fee (0 or undefined means free)
  format?: 'ONLINE' | 'OFFLINE' | 'HYBRID'; // Contest format
  targetGrade?: string; // Target grade level (e.g., "THCS", "THPT", "6-9", "10-12")
  registrationUrl?: string; // URL for registration
  registrationDeadline?: string; // Registration deadline
  prizeAmount?: number; // Prize amount for contest
  website?: string; // Contest website URL

  // Detailed information fields
  benefits?: string[]; // Array of benefits
  eligibility?: string[]; // Array of eligibility requirements
  schedule?: ContestScheduleItem[]; // Array of schedule items
  judges?: ContestJudge[]; // Array of judge information
  partners?: ContestPartner[]; // Array of partners/sponsors
  contactInfo?: ContestContactInfo; // Contact information
  suggestedProducts?: DocumentResource[]; // Linked learning resources
  status?: ContentStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContestScheduleItem {
  date: string;
  time: string;
  activity: string;
  description: string;
}

export interface ContestJudge {
  name: string;
  title: string;
  avatar: string;
  bio: string;
}

export interface ContestPartner {
  name: string;
  logo: string;
  website: string;
  type: string;
}

export interface ContestContactInfo {
  email: string;
  phone: string;
  address: string;
  facebook?: string;
  website?: string;
}

export interface Course {
  id: string;
  title: string;
  author: string;
  price: number;
  description: string;
  imageUrl: string;
  type: string;
  duration?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  language?: string;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: CourseReview[];
  downloadUrl?: string | null;
}

export interface CourseReview {
  id: string;
  rating: number;
  comment?: string;
  reviewerName?: string;
  reviewerId?: string;
  isVerifiedPurchase?: boolean;
  createdAt: string;
}

export interface DocumentResource {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  imageUrl?: string | null;
  downloadUrl?: string | null;
  categories?: string[] | null;
  duration?: string | null;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  language?: string | null;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
  rating?: number | null;
  reviewCount?: number | null;
  sellerName?: string | null;
  status?: ContentStatus;
  reviews?: CourseReview[];
}

export interface CartItem extends Course {
  quantity: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'contest-deadline' | 'personal-event';
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export type TeamRecruitmentStatus = 'OPEN' | 'FULL' | 'CLOSED';

export interface TeamMemberPreview {
  id: string;
  displayName?: string;
  name?: string;
  avatar?: string | null;
  profileColor?: string | null;
}

export interface TeamOwnerInfo extends TeamMemberPreview {
  email?: string;
}

export interface TeamPostSummary {
  id: string;
  title: string;
  teamName?: string | null;
  summary: string;
  lookingFor?: string | null;
  status: TeamRecruitmentStatus;
  maxMembers: number;
  activeMemberCount: number;
  tags: string[];
  owner: TeamOwnerInfo;
  membersPreview: TeamMemberPreview[];
  channelId?: string | null;
  isMember: boolean;
}

export interface TeamPostMember {
  id: string;
  teamId: string;
  userId: string;
  role?: string | null;
  status: 'ACTIVE' | 'LEFT' | 'REMOVED';
  joinedAt: string;
  user: TeamMemberPreview & { email?: string; phoneNumber?: string | null };
}

export interface TeamPostDetail extends TeamPostSummary {
  description: string;
  requirements?: string | null;
  location?: string | null;
  members: TeamPostMember[];
}

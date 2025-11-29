
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'admin';
  balance: number;
}

export interface Contest {
  id: string;
  title: string;
  organizer: string;
  dateStart: string;
  deadline: string;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  fee: number;
  tags: string[];
  image: string;
  description?: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  price: number;
  rating: number;
  reviewsCount: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  image: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  rolesNeeded: string[];
  members: number;
  avatar: string;
}

// Team Finding Post
export interface TeamPost {
  id: string;
  title: string;
  description: string;
  contestId?: string;
  contestTitle?: string;
  rolesNeeded: string[];
  roleSlots?: RoleSlot[];
  currentMembers: number;
  maxMembers: number;
  requirements?: string;
  skills?: string[];
  contactMethod: 'message' | 'email' | 'both';
  status: 'open' | 'closed' | 'full';
  deadline?: string;
  invitedMembers?: Array<{
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    invitedAt?: string;
  }>;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
    task?: string;
    joinedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface RoleSlot {
  role: string;
  count: number;
  description?: string;
  skills?: string[];
}

export interface TeamPostCreate {
  title: string;
  description: string;
  contestId?: string;
  rolesNeeded: string[];
  roleSlots?: RoleSlot[];
  maxMembers: number;
  requirements?: string;
  skills?: string[];
  contactMethod: 'message' | 'email' | 'both';
  deadline?: string;
  expiresAt?: string;
  invitedMembers?: Array<{
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  }>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time?: string;
  createdAt?: string;
  type: 'system' | 'invite' | 'reward' | 'course' | 'contestReminder' | 'courseUpdate' | 'announcement' | 'welcome' | 'contestRegistration';
  isRead: boolean;
}

// User Registration for Contests
export interface UserRegistration {
  id: string;
  contestId: string;
  userId: string;
  registeredAt: string;
  status: 'active' | 'completed' | 'cancelled';
  contest?: {
    id: string;
    title: string;
    organizer: string;
    dateStart: string;
    deadline: string;
    status: string;
    tags: string[];
    image: string;
  };
}

// Schedule Event for Calendar
export interface ScheduleEvent {
  id: string;
  title: string;
  organizer: string;
  dateStart: string;
  deadline: string;
  status: string;
  tags: string[];
  image: string;
  type: 'contest' | 'course';
}

// Workload Warning Types
export interface WorkloadWarning {
  type: 'critical' | 'warning';
  category: 'contests' | 'courses' | 'schedule' | 'overlap';
  message: string;
  suggestion: string;
  contests?: string[];
}

export interface WorkloadAnalysis {
  workload: {
    activeContests: number;
    activeCourses: number;
    weeklyEvents: number;
    upcomingContests: Array<{
      id: string;
      title: string;
      dateStart: string;
      deadline: string;
    }>;
  };
  limits: {
    MAX_ACTIVE_CONTESTS: number;
    MAX_ACTIVE_COURSES: number;
    MAX_WEEKLY_EVENTS: number;
    WARNING_THRESHOLD_CONTESTS: number;
    WARNING_THRESHOLD_COURSES: number;
  };
  warnings: WorkloadWarning[];
  overallStatus: 'normal' | 'warning' | 'critical';
  healthScore: number;
}

// Course Enrollment
export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  completedLessons: string[];
  lastAccessedAt?: string;
  completedAt?: string;
  course?: {
    id: string;
    title: string;
    instructor: string;
    price: number;
    rating: number;
    reviewsCount: number;
    level: string;
    image: string;
    description?: string;
    lessonsCount: number;
  };
}

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

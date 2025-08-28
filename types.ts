
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
}

export interface Contest {
  id: string;
  title: string;
  organization: string;
  description: string;
  imageUrl: string;
  deadline: string;
  startDate: string;
  tags: string[];
  relatedCourseIds: string[];
}

export interface Course {
  id: string;
  title: string;
  author: string;
  price: number;
  description: string;
  imageUrl: string;
  type: 'Online Course' | 'Offline Workshop' | 'PDF Document';
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

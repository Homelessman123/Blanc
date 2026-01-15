export type AppLocale = 'vi' | 'en';

export const DEFAULT_LOCALE: AppLocale = 'vi';
export const SUPPORTED_LOCALES: readonly AppLocale[] = ['vi', 'en'] as const;

const vi = {
  'nav.home': 'Trang chủ',
  'nav.contests': 'Cuộc thi',
  'nav.mentors': 'Mentor',
  'nav.learning': 'Học tập',
  'nav.courses': 'Khóa học',
  'nav.documents': 'Tài liệu',
  'nav.community': 'Cộng đồng',
  'nav.news': 'Bản tin',

  'settings.tabs.membership': 'Gói đăng ký',
  'settings.tabs.profile': 'Hồ sơ',
  'settings.tabs.security': 'Bảo mật',
  'settings.tabs.notifications': 'Thông báo',
  'settings.tabs.privacy': 'Quyền riêng tư',

  'settings.profile.title': 'Thông tin cá nhân',
  'settings.profile.fullName': 'Họ và tên',
  'settings.profile.fullNamePlaceholder': 'Nhập họ và tên',
  'settings.profile.language': 'Ngôn ngữ giao diện',
  'settings.profile.languageHint': 'Chọn ngôn ngữ hiển thị (Anh/Việt).',
  'settings.profile.languageSaved': 'Đã cập nhật ngôn ngữ.',
  'settings.profile.languageSaveFailed': 'Không thể cập nhật ngôn ngữ.',
  'settings.profile.emailReadonly': 'Email không thể thay đổi',
  'settings.profile.phone': 'Số điện thoại',
  'settings.profile.phonePlaceholder': 'Nhập số điện thoại',
  'settings.profile.bio': 'Giới thiệu bản thân',
  'settings.profile.bioPlaceholder': 'Viết vài dòng giới thiệu về bản thân...',

  'profile.sidebar.tagline': 'Học viên tích cực',
  'profile.sidebar.manageMembership': 'Quản lý gói đăng ký',
  'profile.sidebar.contests': 'Cuộc thi',
  'profile.sidebar.courses': 'Khóa học',
  'profile.sidebar.menu': 'Menu',
  'profile.sidebar.overview': 'Tổng quan',
  'profile.sidebar.schedule': 'Lịch thi đấu',
  'profile.sidebar.myCourses': 'Khóa học của tôi',
  'profile.sidebar.personalBlog': 'Blog cá nhân',
  'profile.sidebar.settings': 'Cài đặt',

  'common.saveChanges': 'Lưu thay đổi',
  'common.saveSettings': 'Lưu cài đặt',
  'common.saving': 'Đang lưu...',
  'common.joinedAt': 'Tham gia từ {{date}}',
  'common.loading': 'Đang tải...',
  'locale.vi': 'Tiếng Việt',
  'locale.en': 'English',
} as const;

const en: typeof vi = {
  'nav.home': 'Home',
  'nav.contests': 'Contests',
  'nav.mentors': 'Mentors',
  'nav.learning': 'Learning',
  'nav.courses': 'Courses',
  'nav.documents': 'Documents',
  'nav.community': 'Community',
  'nav.news': 'News',

  'settings.tabs.membership': 'Membership',
  'settings.tabs.profile': 'Profile',
  'settings.tabs.security': 'Security',
  'settings.tabs.notifications': 'Notifications',
  'settings.tabs.privacy': 'Privacy',

  'settings.profile.title': 'Profile',
  'settings.profile.fullName': 'Full name',
  'settings.profile.fullNamePlaceholder': 'Enter your full name',
  'settings.profile.language': 'Language',
  'settings.profile.languageHint': 'Choose display language (English/Vietnamese).',
  'settings.profile.languageSaved': 'Language updated.',
  'settings.profile.languageSaveFailed': 'Unable to update language.',
  'settings.profile.emailReadonly': 'Email cannot be changed',
  'settings.profile.phone': 'Phone number',
  'settings.profile.phonePlaceholder': 'Enter phone number',
  'settings.profile.bio': 'About you',
  'settings.profile.bioPlaceholder': 'Write a short introduction about yourself...',

  'profile.sidebar.tagline': 'Active learner',
  'profile.sidebar.manageMembership': 'Manage membership',
  'profile.sidebar.contests': 'Contests',
  'profile.sidebar.courses': 'Courses',
  'profile.sidebar.menu': 'Menu',
  'profile.sidebar.overview': 'Overview',
  'profile.sidebar.schedule': 'Schedule',
  'profile.sidebar.myCourses': 'My courses',
  'profile.sidebar.personalBlog': 'Personal blog',
  'profile.sidebar.settings': 'Settings',

  'common.saveChanges': 'Save changes',
  'common.saveSettings': 'Save settings',
  'common.saving': 'Saving...',
  'common.joinedAt': 'Joined on {{date}}',
  'common.loading': 'Loading...',
  'locale.vi': 'Vietnamese',
  'locale.en': 'English',
};

export const translations = { vi, en } as const;

export type TranslationKey = keyof typeof translations.vi;

export function normalizeLocale(value: unknown): AppLocale | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim().toLowerCase();
  if (raw === 'vi' || raw.startsWith('vi-')) return 'vi';
  if (raw === 'en' || raw.startsWith('en-')) return 'en';
  return null;
}

export function t(locale: AppLocale, key: TranslationKey, params?: Record<string, string | number>): string {
  const template = translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? String(key);
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (_, paramName: string) => {
    const v = params[paramName];
    return v === undefined || v === null ? '' : String(v);
  });
}


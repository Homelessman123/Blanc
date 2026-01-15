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
  'settings.profile.language': 'Ngôn ngữ giao diện',
  'settings.profile.languageHint': 'Chọn ngôn ngữ hiển thị (Anh/Việt).',

  'common.saveChanges': 'Lưu thay đổi',
  'common.saveSettings': 'Lưu cài đặt',
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
  'settings.profile.language': 'Language',
  'settings.profile.languageHint': 'Choose display language (English/Vietnamese).',

  'common.saveChanges': 'Save changes',
  'common.saveSettings': 'Save settings',
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


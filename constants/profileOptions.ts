// ============ PROFILE OPTIONS FOR MATCHING & AGENT ============
// Các options được định nghĩa sẵn để dễ dàng matching và AI agent xử lý

// Vai trò trong team
export const ROLES = [
    'Frontend Dev',
    'Backend Dev',
    'Fullstack Dev',
    'Mobile Dev',
    'UI/UX Designer',
    'Graphic Designer',
    'Business Analyst',
    'Product Manager',
    'Data Analyst',
    'Data Scientist',
    'ML Engineer',
    'DevOps',
    'QA/Tester',
    'Pitching',
    'Content Writer',
    'Marketing',
    'Video Editor',
    'Researcher',
    'Team Lead',
    'Other'
] as const;

export const ROLE_COLORS: Record<string, string> = {
    'Frontend Dev': 'bg-blue-50 text-blue-700 border-blue-200',
    'Backend Dev': 'bg-green-50 text-green-700 border-green-200',
    'Fullstack Dev': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Mobile Dev': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'UI/UX Designer': 'bg-purple-50 text-purple-700 border-purple-200',
    'Graphic Designer': 'bg-pink-50 text-pink-700 border-pink-200',
    'Business Analyst': 'bg-amber-50 text-amber-700 border-amber-200',
    'Product Manager': 'bg-orange-50 text-orange-700 border-orange-200',
    'Data Analyst': 'bg-teal-50 text-teal-700 border-teal-200',
    'Data Scientist': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'ML Engineer': 'bg-violet-50 text-violet-700 border-violet-200',
    'DevOps': 'bg-slate-100 text-slate-700 border-slate-200',
    'QA/Tester': 'bg-lime-50 text-lime-700 border-lime-200',
    'Pitching': 'bg-rose-50 text-rose-700 border-rose-200',
    'Content Writer': 'bg-violet-50 text-violet-700 border-violet-200',
    'Marketing': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    'Video Editor': 'bg-red-50 text-red-700 border-red-200',
    'Researcher': 'bg-sky-50 text-sky-700 border-sky-200',
    'Team Lead': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Other': 'bg-gray-50 text-gray-700 border-gray-200'
};

// Cấp độ kinh nghiệm
export const EXPERIENCE_LEVELS = [
    { value: 'beginner', label: 'Beginner - Mới bắt đầu' },
    { value: 'intermediate', label: 'Intermediate - Có kinh nghiệm cơ bản' },
    { value: 'advanced', label: 'Advanced - Thành thạo' },
    { value: 'expert', label: 'Expert - Chuyên gia' },
] as const;

// Số năm kinh nghiệm
export const YEARS_EXPERIENCE = [
    { value: '0', label: 'Chưa có kinh nghiệm' },
    { value: '1', label: '< 1 năm' },
    { value: '2', label: '1-2 năm' },
    { value: '3', label: '2-3 năm' },
    { value: '5', label: '3-5 năm' },
    { value: '10', label: '5+ năm' },
] as const;

// Múi giờ phổ biến
export const TIMEZONES = [
    { value: 'UTC+7', label: 'UTC+7 (Việt Nam, Thái Lan)' },
    { value: 'UTC+8', label: 'UTC+8 (Singapore, Malaysia)' },
    { value: 'UTC+9', label: 'UTC+9 (Nhật Bản, Hàn Quốc)' },
    { value: 'UTC+0', label: 'UTC+0 (London, GMT)' },
    { value: 'UTC-5', label: 'UTC-5 (New York, EST)' },
    { value: 'UTC-8', label: 'UTC-8 (Los Angeles, PST)' },
    { value: 'UTC+1', label: 'UTC+1 (Paris, Berlin)' },
    { value: 'UTC+5:30', label: 'UTC+5:30 (Ấn Độ)' },
] as const;

// Ngôn ngữ
export const LANGUAGES = [
    'Tiếng Việt',
    'Tiếng Anh',
    'Tiếng Trung',
    'Tiếng Nhật',
    'Tiếng Hàn',
    'Tiếng Pháp',
    'Tiếng Đức',
    'Tiếng Tây Ban Nha',
] as const;

// Kỹ năng chính
export const SKILLS = [
    // Programming
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'C#',
    'Go',
    'Rust',
    'PHP',
    'Ruby',
    'Swift',
    'Kotlin',
    // Frontend
    'React',
    'Vue.js',
    'Angular',
    'Next.js',
    'HTML/CSS',
    'Tailwind CSS',
    'SASS/SCSS',
    // Backend
    'Node.js',
    'Express.js',
    'Django',
    'Flask',
    'Spring Boot',
    'Laravel',
    'FastAPI',
    // Mobile
    'React Native',
    'Flutter',
    'iOS Development',
    'Android Development',
    // Database
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Firebase',
    // DevOps
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'GCP',
    'CI/CD',
    'Linux',
    // AI/ML
    'Machine Learning',
    'Deep Learning',
    'NLP',
    'Computer Vision',
    'TensorFlow',
    'PyTorch',
    // Design
    'Figma',
    'Adobe XD',
    'Photoshop',
    'Illustrator',
    'UI Design',
    'UX Research',
    'Prototyping',
    // Business
    'Business Analysis',
    'Project Management',
    'Agile/Scrum',
    'Product Management',
    'Market Research',
    // Soft skills
    'Leadership',
    'Communication',
    'Problem Solving',
    'Critical Thinking',
    'Teamwork',
    'Presentation',
    'Public Speaking',
] as const;

// Công cụ giao tiếp
export const COMMUNICATION_TOOLS = [
    'Discord',
    'Slack',
    'Microsoft Teams',
    'Zoom',
    'Google Meet',
    'Telegram',
    'Zalo',
    'Messenger',
    'Notion',
    'Trello',
    'Jira',
    'GitHub',
    'GitLab',
] as const;

// Tech Stack / Công cụ lập trình
export const TECH_STACK = [
    // Frontend Frameworks
    'React',
    'Vue.js',
    'Angular',
    'Next.js',
    'Nuxt.js',
    'Svelte',
    'Remix',
    // CSS Frameworks
    'Tailwind CSS',
    'Bootstrap',
    'Material UI',
    'Chakra UI',
    'Ant Design',
    'SASS/SCSS',
    'Styled Components',
    // Backend Frameworks
    'Node.js',
    'Express.js',
    'NestJS',
    'Django',
    'Flask',
    'FastAPI',
    'Spring Boot',
    'Laravel',
    'Ruby on Rails',
    'ASP.NET',
    // Mobile
    'React Native',
    'Flutter',
    'SwiftUI',
    'Jetpack Compose',
    'Expo',
    // Database
    'MySQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Firebase',
    'Supabase',
    'PlanetScale',
    'DynamoDB',
    'SQLite',
    // Cloud & DevOps
    'AWS',
    'Azure',
    'Google Cloud',
    'Vercel',
    'Netlify',
    'Docker',
    'Kubernetes',
    'GitHub Actions',
    'Jenkins',
    // Design Tools
    'Figma',
    'Adobe XD',
    'Sketch',
    'Photoshop',
    'Illustrator',
    'Canva',
    'Miro',
    'FigJam',
    // Project Management
    'Jira',
    'Trello',
    'Asana',
    'Notion',
    'Linear',
    'ClickUp',
    // Version Control
    'Git',
    'GitHub',
    'GitLab',
    'Bitbucket',
    // AI/ML Tools
    'TensorFlow',
    'PyTorch',
    'OpenAI API',
    'Hugging Face',
    'LangChain',
    'Jupyter',
    'Google Colab',
    // Other
    'GraphQL',
    'REST API',
    'WebSocket',
    'gRPC',
    'Prisma',
    'Drizzle',
] as const;

// Hình thức làm việc
export const REMOTE_PREFERENCES = [
    { value: 'remote', label: 'Remote - Làm việc từ xa' },
    { value: 'hybrid', label: 'Hybrid - Kết hợp' },
    { value: 'onsite', label: 'Onsite - Làm việc trực tiếp' },
    { value: 'flexible', label: 'Flexible - Linh hoạt' },
] as const;

// Lịch làm việc
export const AVAILABILITY_OPTIONS = [
    'Full-time - Toàn thời gian',
    'Part-time - Bán thời gian',
    'Cuối tuần',
    'Buổi tối (sau 18h)',
    'Buổi sáng (6h-12h)',
    'Buổi chiều (12h-18h)',
    'Linh hoạt theo lịch',
    'Chỉ ngày lễ/nghỉ',
] as const;

// Phong cách làm việc
export const COLLABORATION_STYLES = [
    'Async - Chat, email',
    'Sync - Meeting, call thường xuyên',
    'Kết hợp async + sync',
    'Daily standup ngắn',
    'Brainstorm trực quan (Figma, Miro)',
    'Quy trình rõ ràng (Agile/Scrum)',
    'Flexible - Tùy team quyết định',
    'Độc lập, chỉ sync khi cần',
] as const;

// Loại cuộc thi quan tâm
export const CONTEST_INTERESTS = [
    'Hackathon',
    'Coding Competition',
    'Design Contest',
    'Startup Competition',
    'Case Competition',
    'AI/ML Challenge',
    'Data Science',
    'Cybersecurity CTF',
    'Game Development',
    'Mobile App Contest',
    'Web Development',
    'IoT/Hardware',
    'Blockchain/Web3',
    'Social Impact',
    'Research Competition',
] as const;

// Định dạng cuộc thi
export const CONTEST_FORMATS = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'hybrid', label: 'Hybrid' },
] as const;

// Kích thước team ưa thích
export const TEAM_SIZES = [
    { value: 'solo', label: 'Solo (1 người)' },
    { value: 'small', label: 'Nhỏ (2-3 người)' },
    { value: 'medium', label: 'Trung bình (4-5 người)' },
    { value: 'large', label: 'Lớn (6+ người)' },
    { value: 'any', label: 'Không quan trọng' },
] as const;

// Điểm mạnh
export const STRENGTHS = [
    'Giải quyết vấn đề nhanh',
    'Sáng tạo ý tưởng',
    'Làm việc dưới áp lực',
    'Giao tiếp hiệu quả',
    'Học hỏi nhanh',
    'Tỉ mỉ, chi tiết',
    'Lãnh đạo team',
    'Quản lý thời gian',
    'Phân tích dữ liệu',
    'Thiết kế UI/UX',
    'Pitching/Thuyết trình',
    'Debug & Troubleshoot',
    'Code review',
    'Documentation',
    'Research & Planning',
] as const;

// Mục tiêu học tập
export const LEARNING_GOALS = [
    'Nâng cao kỹ năng lập trình',
    'Học công nghệ mới',
    'Kinh nghiệm thực tế',
    'Networking',
    'Giải thưởng & CV',
    'Khởi nghiệp',
    'Tìm việc làm',
    'Vui & Trải nghiệm',
    'Mentoring & Hướng dẫn người khác',
    'Phát triển soft skills',
] as const;

// Thành phố/Khu vực ở Việt Nam
export const LOCATIONS_VN = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Biên Hòa',
    'Nha Trang',
    'Huế',
    'Buôn Ma Thuột',
    'Vũng Tàu',
    'Quy Nhơn',
    'Thái Nguyên',
    'Nam Định',
    'Vinh',
    'Khác',
] as const;

export type Role = typeof ROLES[number];
export type Skill = typeof SKILLS[number];
export type Language = typeof LANGUAGES[number];
export type CommunicationTool = typeof COMMUNICATION_TOOLS[number];
export type ContestInterest = typeof CONTEST_INTERESTS[number];
export type Strength = typeof STRENGTHS[number];
export type LearningGoal = typeof LEARNING_GOALS[number];
export type Location = typeof LOCATIONS_VN[number];

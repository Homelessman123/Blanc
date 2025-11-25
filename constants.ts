import type { Contest, Course, User } from './types';

export const USERS: { [key: string]: User } = {
  '1': { id: '1', name: 'Alice Student', email: 'alice@test.com', role: 'USER', avatar: '/images/Competition.jpg', streak: 5 },
  '2': { id: '2', name: 'Bob Teacher', email: 'bob@test.com', role: 'USER', avatar: '/images/Competition.jpg', streak: 25, walletBalance: 1250.50 },
  '3': { id: '3', name: 'Charlie Admin', email: 'admin@test.com', role: 'ADMIN', avatar: '/images/Competition.jpg', streak: 99 },
};

export const CONTESTS: Contest[] = [
  {
    id: '1',
    title: 'Hội Thi Khoa Học & Kỹ Thuật Quốc Gia',
    organization: 'Bộ Giáo Dục và Đào Tạo',
    description: 'Sân chơi khoa học hàng đầu dành cho các nhà khoa học trẻ thể hiện tài năng qua những dự án đột phá. Bao gồm các lĩnh vực: Vật lý, Sinh học và Khoa học máy tính.',
    imageUrl: '/images/National_Science_Engineering_Fair.jpeg',
    deadline: '2024-12-15T23:59:59Z',
    startDate: '2024-10-01T00:00:00Z',
    tags: ['Khoa học', 'Kỹ thuật', 'STEM'],
    relatedCourseIds: ['101', '102'],
    fee: 0, // Miễn phí
    format: 'OFFLINE',
    targetGrade: 'THPT', // Học sinh THPT
    registrationUrl: 'https://example.com/register/science-fair',
  },
  {
    id: '2',
    title: 'Giải Tranh Biện Thanh Niên Toàn Cầu',
    organization: 'Hội Đồng Tranh Biện Thế Giới',
    description: 'Tham gia những cuộc tranh luận sâu sắc về các vấn đề toàn cầu. Hơn 50 quốc gia cùng tham dự giải đấu danh giá này. Thể hiện khả năng tư duy phản biện và nghệ thuật hùng biện của bạn!',
    imageUrl: '/images/Competition.jpg',
    deadline: '2024-11-30T23:59:59Z',
    startDate: '2024-09-15T00:00:00Z',
    tags: ['Tranh biện', 'Hùng biện', 'Chính trị'],
    relatedCourseIds: ['103'],
    fee: 50, // $50
    format: 'HYBRID',
    targetGrade: 'THCS, THPT', // Cả THCS và THPT
    registrationUrl: 'https://example.com/register/debate',
  },
  {
    id: '3',
    title: 'Thử Thách SAT Quốc Tế',
    organization: 'College Board',
    description: 'Cuộc thi dành cho học sinh THPT để kiểm tra năng lực SAT và giành học bổng du học. Bao gồm bài thi thử và các buổi workshop luyện thi chuyên sâu.',
    imageUrl: '/images/International_SAT_Challenge.webp',
    deadline: '2025-01-20T23:59:59Z',
    startDate: '2024-11-01T00:00:00Z',
    tags: ['SAT', 'Luyện thi', 'Học bổng'],
    relatedCourseIds: ['104'],
    fee: 20, // $20
    format: 'ONLINE',
    targetGrade: '10-12', // Lớp 10-12
    registrationUrl: 'https://example.com/register/sat',
  },
  {
    id: '4',
    title: 'Hackathon Lập Trình Sáng Tạo',
    organization: 'CodeArt Collective',
    description: 'Hackathon 48 giờ tập trung vào việc tạo ra nghệ thuật tương tác và đồ họa ấn tượng bằng code. Chào đón mọi ngôn ngữ lập trình. Thể hiện khả năng sáng tạo không giới hạn của bạn!',
    imageUrl: '/images/Creative_Coding_Hackathon.png',
    deadline: '2024-12-01T23:59:59Z',
    startDate: '2024-11-15T00:00:00Z',
    tags: ['Lập trình', 'Nghệ thuật', 'Hackathon'],
    relatedCourseIds: ['101', '105'],
    fee: 0, // Miễn phí
    format: 'ONLINE',
    targetGrade: '9-12', // Lớp 9-12
    registrationUrl: 'https://example.com/register/hackathon',
  },
];

export const COURSES: Course[] = [
  {
    id: '101',
    title: 'Python Cho Khoa Học Dữ Liệu - Từ Cơ Bản Đến Nâng Cao',
    author: 'Thầy Trần Minh Hoàng',
    price: 49.99,
    description: 'Khám phá nền tảng Python và ứng dụng trong phân tích dữ liệu, machine learning. Hoàn hảo cho các dự án khoa học và nghiên cứu. Học thực hành, làm dự án thật!',
    imageUrl: '/images/Intro_to_Python_for_Data_Science.jpg',
    type: 'Online Course',
    duration: '8 tuần',
    level: 'BEGINNER',
    language: 'Tiếng Việt',
    rating: 4.5,
    reviewCount: 127,
    reviews: [
      {
        id: '1',
        rating: 5,
        comment: 'Khóa học rất chi tiết và dễ hiểu, phù hợp cho người mới bắt đầu.',
        reviewerName: 'Nguyễn Văn A',
        reviewerId: '1',
        isVerifiedPurchase: true,
        createdAt: '2024-09-15T10:30:00Z'
      },
      {
        id: '2',
        rating: 4,
        comment: 'Nội dung hay nhưng cần thêm bài tập thực hành.',
        reviewerName: 'Trần Thị B',
        reviewerId: '2',
        isVerifiedPurchase: true,
        createdAt: '2024-09-20T14:20:00Z'
      }
    ]
  },
  {
    id: '102',
    title: 'Lập Trình Robot Nâng Cao Với Arduino',
    author: 'Học Viện STEM Việt Nam',
    price: 79.99,
    description: 'Xây dựng và lập trình robot phức tạp với nền tảng Arduino. Thực hành 100% với các dự án thực tế. Từ robot di chuyển đến robot tự động hóa thông minh!',
    imageUrl: '/images/Advanced_Robotics_with_Arduino.webp',
    type: 'Online Course',
    duration: '12 tuần',
    level: 'INTERMEDIATE',
    language: 'Tiếng Việt',
    rating: 4.7,
    reviewCount: 89,
    reviews: [
      {
        id: '3',
        rating: 5,
        comment: 'Khóa học tuyệt vời! Đã làm được robot hoàn chỉnh.',
        reviewerName: 'Lê Minh C',
        reviewerId: '3',
        isVerifiedPurchase: true,
        createdAt: '2024-09-25T16:45:00Z'
      }
    ]
  },
  {
    id: '103',
    title: 'Nghệ Thuật Hùng Biện & Thuyết Phục',
    author: 'Diễn giả Nguyễn Thanh Tùng',
    price: 29.99,
    description: 'Phát triển kỹ năng trở thành diễn giả tự tin và thuyết phục. Thiết yếu cho mọi nhà vô địch tranh biện. Từ giao tiếp hàng ngày đến sân khấu lớn!',
    imageUrl: '/images/Mastering_Persuasive_Speaking.webp',
    type: 'Online Course',
    duration: '6 tuần',
    level: 'INTERMEDIATE',
    language: 'Tiếng Việt',
    rating: 4.3,
    reviewCount: 156,
    reviews: [
      {
        id: '4',
        rating: 4,
        comment: 'Giúp tôi tự tin hơn khi thuyết trình.',
        reviewerName: 'Phạm Thu D',
        reviewerId: '4',
        isVerifiedPurchase: true,
        createdAt: '2024-09-18T11:15:00Z'
      }
    ]
  },
  {
    id: '104',
    title: 'Chinh Phục SAT Math - Bí Kíp Đạt Điểm Cao',
    author: 'Viện Luyện Thi PrepMasters',
    price: 19.99,
    description: 'Tài liệu PDF toàn diện bao quát mọi chủ đề trong phần Toán SAT, với hàng trăm câu hỏi thực hành. Phương pháp học thông minh, tối ưu thời gian!',
    imageUrl: '/images/Ultimate_SAT_Math_Prep_Guide.webp',
    type: 'PDF Document',
    duration: '4 tuần ôn tập',
    level: 'INTERMEDIATE',
    language: 'Tiếng Anh',
    rating: 4.1,
    reviewCount: 203,
    reviews: [
      {
        id: '5',
        rating: 4,
        comment: 'Tài liệu đầy đủ, nhiều bài tập hay.',
        reviewerName: 'Hoàng Văn E',
        reviewerId: '5',
        isVerifiedPurchase: true,
        createdAt: '2024-09-22T09:30:00Z'
      }
    ]
  },
  {
    id: '105',
    title: 'Animation Web Sáng Tạo Với JavaScript',
    author: 'Lê Thị Hương',
    price: 59.99,
    description: 'Học cách xây dựng animation web đẹp mắt từ đầu với GSAP và Three.js. Tạo hiệu ứng chuyển động mượt mà, website tương tác đỉnh cao. Biến ý tưởng thành hiện thực!',
    imageUrl: '/images/Creative_Web_Animations_with_JavaScript.webp',
    type: 'Online Course',
    duration: '10 tuần',
    level: 'ADVANCED',
    language: 'Tiếng Việt',
    rating: 4.8,
    reviewCount: 74,
    reviews: [
      {
        id: '6',
        rating: 5,
        comment: 'Khóa học rất chất lượng, animation đẹp mắt.',
        reviewerName: 'Đỗ Thị F',
        reviewerId: '6',
        isVerifiedPurchase: true,
        createdAt: '2024-09-28T13:20:00Z'
      }
    ]
  },
];

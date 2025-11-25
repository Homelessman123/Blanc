// Constants for backend - CommonJS compatible
export const COURSES = [
    {
        id: '101',
        title: 'Intro to Python for Data Science',
        author: 'Bob Teacher',
        price: 49.99,
        description: 'Learn the fundamentals of Python and its application in data analysis and machine learning. Perfect for science fair projects.',
        imageUrl: '/images/Intro_to_Python_for_Data_Science.jpg',
        type: 'Online Course',
        duration: '8 tuần',
        level: 'BEGINNER',
        language: 'Vietnamese',
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
        title: 'Advanced Robotics with Arduino',
        author: 'STEM Academy',
        price: 79.99,
        description: 'Build and program complex robots using the Arduino platform. Hands-on projects included.',
        imageUrl: '/images/Advanced_Robotics_with_Arduino.webp',
        type: 'Online Course',
        duration: '12 tuần',
        level: 'INTERMEDIATE',
        language: 'Vietnamese',
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
        title: 'Mastering Persuasive Speaking',
        author: 'Bob Teacher',
        price: 29.99,
        description: 'Develop the skills to become a confident and persuasive speaker. Essential for any debate champion.',
        imageUrl: '/images/Mastering_Persuasive_Speaking.webp',
        type: 'Online Course',
        duration: '6 tuần',
        level: 'INTERMEDIATE',
        language: 'Vietnamese',
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
        title: 'Ultimate SAT Math Prep Guide',
        author: 'PrepMasters Inc.',
        price: 19.99,
        description: 'A comprehensive PDF guide covering all topics in the SAT Math section, with hundreds of practice questions.',
        imageUrl: '/images/Ultimate_SAT_Math_Prep_Guide.webp',
        type: 'PDF Document',
        duration: '4 tuần ôn tập',
        level: 'INTERMEDIATE',
        language: 'English',
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
        title: 'Creative Web Animations with JavaScript',
        author: 'Jane Doe',
        price: 59.99,
        description: 'Learn to build beautiful web animations from scratch using GSAP and Three.js.',
        imageUrl: '/images/Creative_Web_Animations_with_JavaScript.webp',
        type: 'Online Course',
        duration: '10 tuần',
        level: 'ADVANCED',
        language: 'Vietnamese',
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

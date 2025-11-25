/**
 * Khoa học Kỹ thuật Knowledge Base
 * Thông tin về các lĩnh vực, kỹ năng, career paths và tips học tập
 */

export interface TechField {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    keySkills: string[];
    relatedContests: string[];
    careerPaths: string[];
    learningTips: string[];
    resources: string[];
}

export const TECH_FIELDS: TechField[] = [
    {
        id: 'programming',
        name: 'Lập trình',
        nameEn: 'Programming',
        description: 'Nghệ thuật tạo ra phần mềm và giải quyết vấn đề bằng code',
        keySkills: [
            'Tư duy thuật toán',
            'Cấu trúc dữ liệu',
            'OOP (Lập trình hướng đối tượng)',
            'Design Patterns',
            'Clean Code',
            'Version Control (Git)',
            'Testing & Debugging'
        ],
        relatedContests: [
            'Olympic Tin học',
            'Hackathon',
            'Coding Competition',
            'ACM ICPC'
        ],
        careerPaths: [
            'Software Engineer',
            'Full-stack Developer',
            'Backend Developer',
            'Frontend Developer',
            'Mobile App Developer',
            'DevOps Engineer'
        ],
        learningTips: [
            '🎯 **Bắt đầu với Python hoặc JavaScript** - ngôn ngữ dễ học cho beginners',
            '💻 **Code mỗi ngày** - consistency quan trọng hơn intensity',
            '🧩 **Giải thuật toán trên LeetCode/HackerRank** - train tư duy logic',
            '🚀 **Build projects thực tế** - áp dụng kiến thức vào practice',
            '📚 **Đọc code của người khác** - học từ open source projects',
            '👥 **Tham gia coding communities** - học hỏi và networking'
        ],
        resources: [
            'freeCodeCamp.org - học web development miễn phí',
            'Codecademy - interactive coding courses',
            'CS50 Harvard - computer science cơ bản',
            'The Odin Project - full-stack roadmap'
        ]
    },
    {
        id: 'ai-ml',
        name: 'Trí tuệ nhân tạo & Machine Learning',
        nameEn: 'AI & Machine Learning',
        description: 'Xây dựng hệ thống thông minh có khả năng học và ra quyết định',
        keySkills: [
            'Python Programming',
            'Mathematics (Linear Algebra, Statistics)',
            'Deep Learning',
            'Neural Networks',
            'TensorFlow/PyTorch',
            'Data Processing',
            'Model Evaluation'
        ],
        relatedContests: [
            'Kaggle Competitions',
            'AI Challenge',
            'Data Science Hackathon'
        ],
        careerPaths: [
            'Machine Learning Engineer',
            'AI Research Scientist',
            'Data Scientist',
            'Computer Vision Engineer',
            'NLP Engineer'
        ],
        learningTips: [
            '📊 **Nắm vững toán học** - Linear Algebra, Calculus, Statistics là nền tảng',
            '🐍 **Master Python** - ngôn ngữ chính cho AI/ML',
            '📚 **Học theory + practice** - hiểu cả lý thuyết lẫn implementation',
            '🏆 **Tham gia Kaggle** - practice với real-world datasets',
            '🔬 **Đọc research papers** - cập nhật xu hướng mới',
            '💾 **Build portfolio projects** - showcase khả năng của bạn'
        ],
        resources: [
            'Andrew Ng\'s Machine Learning Course (Coursera)',
            'Fast.ai - practical deep learning',
            'Kaggle Learn - free micro-courses',
            'Papers with Code - research papers + implementation'
        ]
    },
    {
        id: 'robotics',
        name: 'Robotics',
        nameEn: 'Robotics',
        description: 'Thiết kế, xây dựng và lập trình robot tự động',
        keySkills: [
            'Mechanical Design',
            'Electronics & Circuits',
            'Programming (C++, Python)',
            'Control Systems',
            'Sensors & Actuators',
            'ROS (Robot Operating System)',
            'Computer Vision'
        ],
        relatedContests: [
            'Robot Contest',
            'FIRST Robotics',
            'Robocon',
            'VEX Robotics'
        ],
        careerPaths: [
            'Robotics Engineer',
            'Automation Engineer',
            'Mechatronics Engineer',
            'Research Scientist (Robotics)'
        ],
        learningTips: [
            '🔧 **Bắt đầu với Arduino/Raspberry Pi** - learn by doing',
            '⚙️ **Hiểu mechanics & electronics** - kiến thức đa ngành',
            '🤖 **Build simple robots first** - từ line follower đến phức tạp hơn',
            '📐 **Học CAD software** - thiết kế parts 3D',
            '🎮 **Practice with simulation** - Gazebo, Webots',
            '🏆 **Tham gia robot competitions** - áp dụng thực tế'
        ],
        resources: [
            'Arduino Project Hub',
            'ROS Tutorials',
            'MIT OpenCourseWare - Robotics',
            'Udacity Robotics Nanodegree'
        ]
    },
    {
        id: 'web-dev',
        name: 'Phát triển Web',
        nameEn: 'Web Development',
        description: 'Xây dựng websites và web applications hiện đại',
        keySkills: [
            'HTML/CSS/JavaScript',
            'Frontend Frameworks (React, Vue, Angular)',
            'Backend Development (Node.js, Django)',
            'Database (SQL, MongoDB)',
            'REST APIs',
            'Responsive Design',
            'Web Security'
        ],
        relatedContests: [
            'Web Development Hackathon',
            'UI/UX Design Contest'
        ],
        careerPaths: [
            'Frontend Developer',
            'Backend Developer',
            'Full-stack Developer',
            'UI/UX Designer',
            'Web Designer'
        ],
        learningTips: [
            '🎨 **Master HTML/CSS first** - nền tảng của web',
            '⚡ **JavaScript is essential** - học sâu về JS',
            '🚀 **Pick one framework** - React recommended cho beginners',
            '💾 **Learn databases** - SQL và NoSQL',
            '🔐 **Security matters** - học về web security basics',
            '📱 **Make it responsive** - mobile-first approach'
        ],
        resources: [
            'MDN Web Docs - best documentation',
            'JavaScript.info - deep JS knowledge',
            'Frontend Mentor - practice projects',
            'Full Stack Open - comprehensive course'
        ]
    },
    {
        id: 'cybersecurity',
        name: 'An ninh mạng',
        nameEn: 'Cybersecurity',
        description: 'Bảo vệ hệ thống và dữ liệu khỏi các mối đe dọa mạng',
        keySkills: [
            'Network Security',
            'Ethical Hacking',
            'Cryptography',
            'Penetration Testing',
            'Security Protocols',
            'Incident Response',
            'Linux/Unix Systems'
        ],
        relatedContests: [
            'CTF (Capture The Flag)',
            'Cybersecurity Challenge',
            'Hacking Competition'
        ],
        careerPaths: [
            'Security Engineer',
            'Penetration Tester',
            'Security Analyst',
            'Ethical Hacker',
            'SOC Analyst'
        ],
        learningTips: [
            '🔒 **Learn networking basics** - understand how systems communicate',
            '🐧 **Master Linux** - essential for security work',
            '🎯 **Practice on CTF platforms** - TryHackMe, HackTheBox',
            '📚 **Study common vulnerabilities** - OWASP Top 10',
            '🔐 **Learn cryptography** - hiểu encryption & hashing',
            '⚖️ **Know the ethics & laws** - responsible disclosure'
        ],
        resources: [
            'TryHackMe - beginner-friendly',
            'HackTheBox - advanced challenges',
            'OWASP - web security knowledge',
            'Cybrary - free security courses'
        ]
    },
    {
        id: 'data-science',
        name: 'Khoa học dữ liệu',
        nameEn: 'Data Science',
        description: 'Phân tích và extract insights từ big data',
        keySkills: [
            'Python/R Programming',
            'Statistics & Probability',
            'Data Visualization',
            'SQL',
            'Pandas, NumPy',
            'Machine Learning',
            'Big Data Tools (Spark)'
        ],
        relatedContests: [
            'Data Science Competition',
            'Kaggle Challenges',
            'Analytics Hackathon'
        ],
        careerPaths: [
            'Data Scientist',
            'Data Analyst',
            'Business Intelligence Analyst',
            'Data Engineer'
        ],
        learningTips: [
            '📊 **Statistics is key** - nền tảng của data science',
            '🐍 **Python + Pandas** - tools chính cho data manipulation',
            '📈 **Visualization matters** - learn Matplotlib, Seaborn',
            '🗄️ **Master SQL** - query data efficiently',
            '🏆 **Kaggle competitions** - practice with real datasets',
            '💼 **Business context** - hiểu business problems'
        ],
        resources: [
            'Kaggle Learn',
            'DataCamp',
            'Mode Analytics - SQL tutorials',
            'Towards Data Science blog'
        ]
    },
    {
        id: 'iot',
        name: 'Internet of Things (IoT)',
        nameEn: 'Internet of Things',
        description: 'Kết nối thiết bị vật lý với internet',
        keySkills: [
            'Embedded Systems',
            'Sensors & Actuators',
            'Wireless Communication',
            'Cloud Platforms',
            'Programming (C, Python)',
            'Data Analytics',
            'Security'
        ],
        relatedContests: [
            'IoT Innovation Challenge',
            'Smart Home Contest'
        ],
        careerPaths: [
            'IoT Engineer',
            'Embedded Systems Engineer',
            'IoT Architect',
            'Hardware Engineer'
        ],
        learningTips: [
            '🔌 **Start with Arduino/ESP32** - hands-on learning',
            '☁️ **Learn cloud platforms** - AWS IoT, Azure IoT',
            '📡 **Understand protocols** - MQTT, HTTP, CoAP',
            '🔐 **Security first** - IoT devices are vulnerable',
            '📊 **Data handling** - collect, store, analyze sensor data',
            '⚡ **Power management** - optimize for battery life'
        ],
        resources: [
            'Arduino Official Tutorials',
            'ESP32 Documentation',
            'AWS IoT Core Tutorials',
            'Hackster.io - IoT projects'
        ]
    }
];

/**
 * Mapping từ interests/talents → tech fields
 */
export const INTEREST_FIELD_MAPPING: Record<string, string[]> = {
    'lập trình': ['programming', 'web-dev'],
    'programming': ['programming', 'web-dev'],
    'ai': ['ai-ml'],
    'machine learning': ['ai-ml'],
    'trí tuệ nhân tạo': ['ai-ml'],
    'robotics': ['robotics', 'iot'],
    'robot': ['robotics', 'iot'],
    'web': ['web-dev'],
    'web development': ['web-dev'],
    'security': ['cybersecurity'],
    'an ninh mạng': ['cybersecurity'],
    'hacking': ['cybersecurity'],
    'data': ['data-science'],
    'data science': ['data-science'],
    'khoa học dữ liệu': ['data-science'],
    'iot': ['iot'],
    'embedded': ['iot', 'robotics']
};

/**
 * Tìm tech fields phù hợp với interests/talents của user
 */
export function findRelevantFields(interests: string[], talents: string[]): TechField[] {
    const allUserInterests = [...interests, ...talents].map(i => i.toLowerCase());
    const relevantFieldIds = new Set<string>();

    allUserInterests.forEach(interest => {
        Object.entries(INTEREST_FIELD_MAPPING).forEach(([key, fields]) => {
            if (interest.includes(key) || key.includes(interest)) {
                fields.forEach(f => relevantFieldIds.add(f));
            }
        });
    });

    return TECH_FIELDS.filter(field => relevantFieldIds.has(field.id));
}

/**
 * General learning tips cho học sinh
 */
export const GENERAL_LEARNING_TIPS = [
    '🎯 **Đặt mục tiêu cụ thể** - SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound',
    '📅 **Lập kế hoạch học tập** - chia nhỏ mục tiêu lớn thành tasks nhỏ',
    '⏰ **Time management** - Pomodoro technique: 25 phút tập trung + 5 phút nghỉ',
    '📝 **Ghi chú hiệu quả** - Cornell method hoặc Mind mapping',
    '🤝 **Học nhóm** - giải thích cho người khác giúp hiểu sâu hơn',
    '💪 **Practice regularly** - consistency beats intensity',
    '🔄 **Review định kỳ** - spaced repetition để nhớ lâu',
    '❓ **Đặt câu hỏi** - không hiểu thì hỏi ngay, đừng để tồn đọng',
    '🏆 **Celebrate small wins** - động lực từ những thành công nhỏ',
    '😴 **Đủ giấc ngủ** - não cần nghỉ ngơi để consolidate kiến thức'
];

/**
 * Contest preparation tips
 */
export const CONTEST_PREP_TIPS = [
    '📚 **Nghiên cứu format** - hiểu rõ cấu trúc và yêu cầu của cuộc thi',
    '⏱️ **Practice under time pressure** - làm quen với deadline',
    '📊 **Phân tích đề cũ** - xem các kỳ trước để biết pattern',
    '👥 **Tìm đội ngũ phù hợp** - skills complement nhau',
    '🎯 **Lập chiến lược** - plan trước khi execute',
    '🔄 **Mock competitions** - practice như thi thật',
    '💬 **Networking** - kết nối với contestants khác',
    '😌 **Stay calm** - mindset tích cực ảnh hưởng lớn đến performance'
];

/**
 * Career guidance
 */
export const CAREER_PATHS_INFO = {
    'Software Engineer': {
        description: 'Thiết kế, phát triển và maintain phần mềm',
        salary: '15-50 triệu VNĐ/tháng (junior-senior)',
        demand: 'Rất cao',
        education: 'Cử nhân CNTT hoặc tương đương + portfolio mạnh'
    },
    'Data Scientist': {
        description: 'Phân tích dữ liệu lớn để đưa ra insights cho business',
        salary: '20-60 triệu VNĐ/tháng',
        demand: 'Cao',
        education: 'Cử nhân CNTT/Toán/Thống kê + strong analytics'
    },
    'AI Engineer': {
        description: 'Xây dựng hệ thống AI và ML models',
        salary: '25-80 triệu VNĐ/tháng',
        demand: 'Rất cao',
        education: 'Cử nhân CNTT + chuyên về AI/ML'
    },
    'Cybersecurity Engineer': {
        description: 'Bảo vệ hệ thống khỏi cyber attacks',
        salary: '18-55 triệu VNĐ/tháng',
        demand: 'Cao',
        education: 'Cử nhân CNTT + certifications (CEH, CISSP)'
    },
    'Robotics Engineer': {
        description: 'Thiết kế và lập trình robot',
        salary: '20-65 triệu VNĐ/tháng',
        demand: 'Trung bình-Cao',
        education: 'Cử nhân Kỹ thuật Cơ điện tử/Robot'
    }
};

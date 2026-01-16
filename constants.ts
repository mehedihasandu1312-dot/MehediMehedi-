import { UserRole, User, Folder, StudyContent, Exam, Appeal, ContentType, Notice, BlogPost, SocialPost, SocialReport, ExamSubmission, AdminActivityLog } from './types';

// --- DATA CONSTANTS ---

export const ALL_DISTRICTS = [
    "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", "Chandpur", 
    "Chattogram", "Chuadanga", "Comilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", 
    "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokathi", "Jhenaidah", 
    "Joypurhat", "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", 
    "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", 
    "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", 
    "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", 
    "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

export const EDUCATION_LEVELS = {
    REGULAR: [
        "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", 
        "HSC (Class 11)", "HSC (Class 12)", 
        "Honours 1st Year", "Honours 2nd Year", "Honours 3rd Year", "Honours 4th Year", 
        "Masters",
        "Job Preparation" // Added as requested
    ],
    ADMISSION: [
        "University Admission (A Unit)", 
        "University Admission (B Unit)", 
        "University Admission (C Unit)", 
        "Medical Admission", 
        "Engineering Admission"
    ]
};

// --- MOCK DATA ---

export const MOCK_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Super Admin',
    email: 'admin@edumaster.com',
    role: UserRole.ADMIN,
    profileCompleted: true,
    status: 'ACTIVE',
    joinedDate: '2023-01-01T00:00:00Z',
    avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D9488&color=fff'
  },
  {
    id: 'admin2',
    name: 'Content Manager',
    email: 'editor@edumaster.com',
    role: UserRole.ADMIN,
    profileCompleted: true,
    status: 'ACTIVE',
    joinedDate: '2023-03-15T00:00:00Z',
    avatar: 'https://ui-avatars.com/api/?name=Content+Manager&background=6366f1&color=fff'
  },
  {
    id: 'student1',
    name: 'Rahim Ahmed',
    email: 'student@edumaster.com',
    role: UserRole.STUDENT,
    profileCompleted: true,
    status: 'ACTIVE',
    joinedDate: '2023-05-15T10:30:00Z',
    lastLogin: '2023-10-26T14:20:00Z',
    class: 'Class 10', // Matched for filtering
    studentType: 'REGULAR',
    phone: '01700000000',
    district: 'Dhaka',
    institute: 'Dhaka College',
    points: 1250,
    rank: 42,
    avatar: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: 'student_new',
    name: 'New Student',
    email: 'new@edumaster.com',
    role: UserRole.STUDENT,
    profileCompleted: false, 
    status: 'ACTIVE',
    joinedDate: new Date().toISOString(), 
    points: 0,
    rank: 0
  },
  {
    id: 'student_blocked',
    name: 'Bad Actor',
    email: 'blocked@edumaster.com',
    role: UserRole.STUDENT,
    profileCompleted: true,
    status: 'BLOCKED',
    joinedDate: '2023-08-01T09:00:00Z',
    class: 'Class 11',
    institute: 'Unknown',
    points: 100,
    rank: 150
  }
];

export const MOCK_ADMIN_LOGS: AdminActivityLog[] = [
    { id: 'l1', adminId: 'admin1', adminName: 'Super Admin', action: 'Created Exam', details: 'Physics Mid-Term 2024', timestamp: '2023-10-28T10:00:00Z', type: 'SUCCESS' },
    { id: 'l2', adminId: 'admin2', adminName: 'Content Manager', action: 'Deleted User', details: 'Spam Account (ID: 992)', timestamp: '2023-10-28T09:30:00Z', type: 'DANGER' },
    { id: 'l3', adminId: 'admin1', adminName: 'Super Admin', action: 'Updated Notice', details: 'Maintenance Alert', timestamp: '2023-10-27T14:00:00Z', type: 'INFO' },
    { id: 'l4', adminId: 'admin2', adminName: 'Content Manager', action: 'Blocked User', details: 'Bad Actor', timestamp: '2023-10-26T11:15:00Z', type: 'WARNING' },
    { id: 'l5', adminId: 'admin1', adminName: 'Super Admin', action: 'Login', details: 'System Access', timestamp: '2023-10-28T08:00:00Z', type: 'INFO' },
];

export const MOCK_FOLDERS: Folder[] = [
  { id: 'f1', name: 'Physics - Class 10', description: 'Dynamics and Motion', targetClass: 'Class 10', type: 'CONTENT', icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081530.png' },
  { id: 'f2', name: 'Chemistry - Class 12', description: 'Basic Organic Chemistry', targetClass: 'HSC (Class 12)', type: 'CONTENT' },
  { id: 'f3', name: 'Math - HSC', description: 'Calculus', targetClass: 'HSC (Class 11)', type: 'CONTENT' },
  { id: 'exam_f1', name: 'SSC Prep (Class 10)', description: 'Scheduled competitive exams', targetClass: 'Class 10', type: 'EXAM', icon: 'https://cdn-icons-png.flaticon.com/512/2641/2641457.png' },
  { id: 'exam_f2', name: 'HSC Model Tests', description: 'Full syllabus practice', targetClass: 'HSC (Class 12)', type: 'EXAM' },
  { id: 'f_job', name: 'BCS Preliminary', description: 'Job Preparation Content', targetClass: 'Job Preparation', type: 'CONTENT', icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png' },
  { id: 'f_common', name: 'General Knowledge', description: 'For Everyone', type: 'CONTENT' }, // No targetClass = Public
];

export const MOCK_CONTENT: StudyContent[] = [
  { id: 'c1', folderId: 'f1', title: 'Newton\'s Laws Notes', type: ContentType.WRITTEN, body: 'Detailed notes on three laws...', isDeleted: false },
  { id: 'c2', folderId: 'f1', title: 'Motion Practice MCQ', type: ContentType.MCQ, questions: 20, isDeleted: false },
  { id: 'c3', folderId: 'f2', title: 'Hydrocarbons Summary', type: ContentType.WRITTEN, body: 'Alkanes, Alkenes, Alkynes...', isDeleted: false },
];

export const MOCK_EXAMS: Exam[] = [
  { 
      id: 'e1', 
      folderId: 'exam_f1',
      title: 'Physics Live Challenge (SSC)', 
      type: 'LIVE', 
      examFormat: 'MCQ',
      durationMinutes: 10, 
      totalMarks: 20, 
      questionsCount: 4, 
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      isPublished: true, 
      negativeMarks: 0.25,
      attempts: 145,
      questionList: [
          { id: 'q1', text: 'What is the unit of Force?', marks: 5, type: 'MCQ', options: ['Joule', 'Newton', 'Pascal', 'Watt'], correctOption: 1 },
          { id: 'q2', text: 'Rate of change of momentum is?', marks: 5, type: 'MCQ', options: ['Force', 'Energy', 'Power', 'Impulse'], correctOption: 0 },
          { id: 'q3', text: 'Which is a vector quantity?', marks: 5, type: 'MCQ', options: ['Mass', 'Time', 'Velocity', 'Speed'], correctOption: 2 },
          { id: 'q4', text: 'Value of g on earth surface?', marks: 5, type: 'MCQ', options: ['9.8 ms-2', '10 ms-1', '9.8 ms-1', '8.9 ms-2'], correctOption: 0 }
      ]
  },
  { 
      id: 'e2', 
      folderId: 'exam_f2',
      title: 'Organic Chem Test (HSC)', 
      type: 'GENERAL', 
      examFormat: 'MCQ',
      durationMinutes: 5, 
      totalMarks: 10, 
      questionsCount: 2, 
      isPublished: true,
      attempts: 2300,
      questionList: [
          { id: 'gk1', text: 'Benzene is?', marks: 5, type: 'MCQ', options: ['Alkane', 'Aromatic', 'Alkene', 'None'], correctOption: 1 },
          { id: 'gk2', text: 'Formula of Methane?', marks: 5, type: 'MCQ', options: ['CH3', 'CH4', 'C2H6', 'C2H4'], correctOption: 1 },
      ]
  },
  { 
      id: 'e3', 
      folderId: 'exam_f2',
      title: 'Math Written Test (Algebra)', 
      type: 'GENERAL', 
      examFormat: 'WRITTEN',
      durationMinutes: 30, 
      totalMarks: 50, 
      questionsCount: 2, 
      isPublished: true,
      attempts: 56,
      questionList: [
          { id: 'w1', text: 'Prove that (a+b)^2 = a^2 + 2ab + b^2', marks: 25, type: 'WRITTEN' },
          { id: 'w2', text: 'Solve for x: 2x + 5 = 15', marks: 25, type: 'WRITTEN' },
      ]
  },
];

export const MOCK_SUBMISSIONS: ExamSubmission[] = [
    {
        id: 'sub_1',
        examId: 'e3',
        studentId: 'student1',
        studentName: 'Rahim Ahmed',
        submittedAt: '2023-10-27T14:30:00Z',
        status: 'PENDING',
        obtainedMarks: 0,
        answers: [
            { questionId: 'w1', writtenImages: ['https://picsum.photos/400/600', 'https://picsum.photos/400/600?random=2'] },
            { questionId: 'w2', writtenImages: ['https://picsum.photos/400/600?random=3'] }
        ]
    }
];

export const MOCK_APPEALS: Appeal[] = [
  { 
    id: 'a1', 
    contentId: 'c1', 
    contentTitle: 'Newton\'s Laws Notes', 
    studentName: 'Rahim Ahmed', 
    text: 'There is a typo in the second law formula. It should be F=ma, not F=m/a.', 
    image: 'https://picsum.photos/600/400?random=50',
    status: 'PENDING', 
    timestamp: '2h ago' 
  },
  { 
    id: 'a2', 
    contentId: 'c3', 
    contentTitle: 'Hydrocarbons Summary', 
    studentName: 'Rahim Ahmed', 
    text: 'The diagram for Benzene is missing in the PDF view.', 
    status: 'REPLIED', 
    reply: 'Thanks for reporting. We have updated the file. Please refresh.', 
    timestamp: '1d ago' 
  },
  { 
    id: 'a3', 
    contentId: 'c2', 
    contentTitle: 'Motion Practice MCQ', 
    studentName: 'Karim Ullah', 
    text: 'Question 5 has two correct options (A and C).', 
    status: 'PENDING', 
    timestamp: '5h ago' 
  },
];

export const MOCK_NOTICES: Notice[] = [
  { id: 'n1', title: 'System Maintenance Update', date: '2023-10-25', content: 'The platform will be down for maintenance from 2 AM to 4 AM on Sunday.', priority: 'HIGH' },
  { id: 'n2', title: 'New Physics Content Added', date: '2023-10-24', content: 'Check out the new chapter on Electromagnetism in the study section.', priority: 'MEDIUM' },
  { id: 'n3', title: 'Welcome to the new term!', date: '2023-10-20', content: 'We wish all students a productive learning journey this semester.', priority: 'LOW' },
];

export const MOCK_BLOG_FOLDERS: Folder[] = [
    { id: 'bf1', name: 'Mathematics Tips', description: 'Tricks and tips for faster calculation' },
    { id: 'bf2', name: 'Science Explained', description: 'Deep dives into scientific concepts' },
    { id: 'bf3', name: 'Exam Strategy', description: 'How to score better in exams' },
];

export const MOCK_BLOGS: BlogPost[] = [
  { 
    id: 'b1', 
    folderId: 'bf1',
    title: '5 Tips to Master Calculus', 
    author: 'Dr. S. Khan', 
    date: 'Oct 22, 2023', 
    excerpt: 'Calculus can be daunting, but with these 5 simple strategies, you can master derivatives and integrals in no time.', 
    content: 'Full article content here...', 
    tags: ['Math', 'Tips'],
    thumbnail: 'https://picsum.photos/400/250?random=10',
    views: 1240
  },
  { 
    id: 'b2', 
    folderId: 'bf2',
    title: 'Understanding Organic Reactions', 
    author: 'A. Rahman', 
    date: 'Oct 18, 2023', 
    excerpt: 'A deep dive into the mechanisms of SN1 and SN2 reactions for college students.', 
    content: 'Full article content here...', 
    tags: ['Chemistry', 'Organic'],
    thumbnail: 'https://picsum.photos/400/250?random=11',
    views: 856
  },
];

export const MOCK_SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'sp1',
    authorName: 'EduMaster Official',
    authorAvatar: 'https://picsum.photos/200/200?random=1',
    timestamp: '2 hours ago',
    content: '🎉 Congratulations to our top performers in last week\'s Physics Marathon! Keep up the great work everyone. 🚀 #Physics #Champions',
    imageUrl: 'https://picsum.photos/600/300?random=20',
    likes: 124,
    comments: 18,
    isLiked: false,
    feeling: { label: 'Proud', icon: '🏆' }
  },
  {
    id: 'sp2',
    authorName: 'Dr. A. Bashir',
    authorAvatar: 'https://picsum.photos/200/200?random=5',
    timestamp: '5 hours ago',
    content: 'Just uploaded a quick revision guide for Organic Chemistry. Check the study content folder! 📚💡',
    likes: 89,
    comments: 45,
    isLiked: true
  },
  {
    id: 'sp3',
    authorName: 'Science Club',
    authorAvatar: 'https://picsum.photos/200/200?random=8',
    timestamp: '1 day ago',
    content: 'We are organizing a virtual science fair next month. Who is interested in participating? Comment below! 👇',
    likes: 256,
    comments: 112,
    isLiked: false,
    feeling: { label: 'Excited', icon: '🤩' }
  }
];

export const MOCK_REPORTS: SocialReport[] = [
    {
        id: 'r1',
        postId: 'sp_bad_1',
        postContent: 'I hate this subject, it is useless and the teacher is worst.',
        postAuthor: 'Bad Actor',
        reporterName: 'Rahim Ahmed',
        reason: 'Hate Speech / Disrespectful',
        timestamp: '10 min ago',
        status: 'PENDING'
    },
    {
        id: 'r2',
        postId: 'sp_bad_2',
        postContent: 'Join this link for free answers: http://scam-link.com',
        postAuthor: 'Unknown User',
        reporterName: 'Sarah J.',
        reason: 'Spam / Scam Link',
        timestamp: '2 hours ago',
        status: 'PENDING'
    }
];
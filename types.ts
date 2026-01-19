
import React from 'react';

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

// Updated System Settings to support Pricing
export interface ClassPrice {
    monthly: number;
    yearly: number;
}

export type PremiumFeature = 'NO_ADS' | 'EXAMS' | 'CONTENT' | 'LEADERBOARD' | 'SOCIAL';

export interface SystemSettings {
  id: string; // usually 'global_settings'
  educationLevels: {
    REGULAR: string[];
    ADMISSION: string[];
  };
  // NEW: Map class name to pricing structure
  pricing?: Record<string, ClassPrice>;
  // NEW: Map class name to array of locked features (features that require subscription)
  lockedFeatures?: Record<string, PremiumFeature[]>;
  // NEW: Admin configured payment numbers
  paymentNumbers?: {
      bKash: string;
      Nagad: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isSuperAdmin?: boolean; // Identifies the Master Admin
  profileCompleted: boolean;
  status: 'ACTIVE' | 'BLOCKED';
  joinedDate: string; // ISO Date string
  lastLogin?: string; // ISO Date string
  avatar?: string;
  // Updated fields based on requirement
  studentType?: 'REGULAR' | 'ADMISSION'; 
  class?: string; // Class 6-Master's OR Admission Category
  phone?: string;
  district?: string;
  institute?: string;
  points?: number;
  rank?: number;
  // Admin Management
  warnings?: string[]; // Array of warning messages sent by Super Admin
  banReason?: string; // Reason for blocking the user (Visible to user)
  // Social Fields
  friends?: string[]; // Array of User IDs
  friendRequests?: string[]; // Array of User IDs who sent request
  // SUBSCRIPTION
  subscription?: {
      plan: 'MONTHLY' | 'YEARLY';
      status: 'ACTIVE' | 'EXPIRED';
      expiryDate: string;
      startedAt: string;
  };
}

// NEW: Payment Request Interface (Subscription)
export interface PaymentRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    studentClass: string; // NEW: Track class for analytics
    amount: number;
    method: 'bKash' | 'Nagad';
    plan: 'MONTHLY' | 'YEARLY';
    senderNumber: string;
    trxId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    timestamp: string;
}

// --- STORE INTERFACES (NEW) ---

export type ProductType = 'DIGITAL' | 'PHYSICAL';

export interface StoreProduct {
    id: string;
    title: string;
    description: string;
    type: ProductType;
    price: number; // 0 for free
    prevPrice?: number; // For discount display
    image: string;
    fileUrl?: string; // For Digital products (PDF link)
    previewUrl?: string; // NEW: Link to sample/preview PDF
    stock?: number; // For Physical products
    isFree: boolean;
    category?: string; // Subject or Topic
    targetClass?: string; // NEW: Class specific visibility (e.g. "Class 10", "HSC") or undefined for General
}

export interface StoreOrder {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    productId: string;
    productTitle: string;
    productType: ProductType;
    amount: number;
    method: 'bKash' | 'Nagad'; // Manual payment
    senderNumber: string;
    trxId: string;
    address?: string; // Only for Physical
    status: 'PENDING' | 'COMPLETED' | 'SHIPPED' | 'REJECTED';
    orderDate: string;
    fileUrl?: string; // Copied from product for easier access after purchase
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string; // e.g., "Created Exam", "Blocked User"
  details: string; // e.g., "Physics Mid-Term"
  timestamp: string;
  type: 'DANGER' | 'WARNING' | 'INFO' | 'SUCCESS';
}

export enum ContentType {
  WRITTEN = 'WRITTEN',
  MCQ = 'MCQ',
  VIDEO = 'VIDEO' // NEW TYPE ADDED
}

export interface MCQQuestion {
  id: string;
  questionText: string;
  options: string[]; // Array of 4 strings
  correctOptionIndex: number; // 0-3
}

export interface StudyContent {
  id: string;
  folderId: string;
  title: string;
  type: ContentType;
  body?: string; // For written
  videoUrl?: string; // NEW: For Video Links (YouTube/Vimeo)
  questions?: number; // Count for MCQ (Legacy/Summary)
  questionList?: MCQQuestion[]; // Detailed MCQ data
  isDeleted?: boolean; // Soft delete
  isPremium?: boolean; // NEW: Granular Lock
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  parentId?: string; // Added for nesting/sub-folders
  targetClass?: string; // Filter content by class
  type?: 'CONTENT' | 'EXAM'; // NEW: Distinguish between Study Material folders and Exam folders
  icon?: string; // NEW: Custom image/icon for the folder
}

export interface Appeal {
  id: string;
  contentId: string;
  contentTitle: string;
  studentName: string;
  text: string;
  image?: string; // Optional screenshot/image URL
  status: 'PENDING' | 'REPLIED';
  reply?: string;
  replyImage?: string; // Admin can reply with an image
  timestamp: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  marks: number;
  type: 'MCQ' | 'WRITTEN';
  options?: string[]; // For MCQ
  correctOption?: number; // For MCQ
  image?: string; // Optional image for the question itself
}

export interface Exam {
  id: string;
  folderId?: string; // Added Folder Support
  targetClass?: string; // NEW: Filter exam by class if not in a folder
  title: string;
  type: 'LIVE' | 'GENERAL';
  examFormat: 'MCQ' | 'WRITTEN'; // New Format Field
  durationMinutes: number;
  totalMarks: number;
  questionsCount: number; // Renamed from questions to avoid confusion
  startTime?: string; // For Live ISO String
  negativeMarks?: number;
  isPublished: boolean;
  questionList?: ExamQuestion[]; // Detailed questions
  attempts?: number; // Track how many students took this
  isPremium?: boolean; // NEW: Granular Lock
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'PENDING' | 'GRADED';
  obtainedMarks: number;
  gradedBy?: string; // NEW: Name of the admin who graded this
  answers: {
    questionId: string;
    selectedOption?: number; // For MCQ
    writtenImages?: string[]; // For Written (Array of base64/urls)
    feedback?: string; // NEW: Admin feedback text for specific mistakes
  }[];
}

// New Interface for tracking student results in dashboard
export interface StudentResult {
    id: string;
    studentId: string; // Added to track WHOSE result this is
    examId: string;
    examTitle: string;
    score: number;
    totalMarks: number;
    negativeDeduction: number;
    date: string; // ISO String
    status: 'PASSED' | 'MERIT' | 'FAILED';
}

export interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
  image?: string; // Added image support for notices
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  targetClass?: string; // NEW: Audience targeting (All or specific class)
}

export interface BlogPost {
  id: string;
  folderId: string; // Added folderId for categorization
  title: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
  thumbnail?: string;
  tags: string[];
  views: number; // New field for tracking views
  isPremium?: boolean; // NEW: Granular Lock
}

export interface SocialPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  feeling?: { label: string; icon: string };
}

export interface SocialReport {
  id: string;
  postId: string;
  postContent: string;
  postAuthor: string;
  reporterName: string;
  reason: string;
  timestamp: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

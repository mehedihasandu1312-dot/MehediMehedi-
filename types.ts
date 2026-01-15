import React from 'react';

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileCompleted: boolean;
  status: 'ACTIVE' | 'BLOCKED';
  joinedDate: string; // ISO Date string
  lastLogin?: string; // ISO Date string
  avatar?: string;
  class?: string;
  institute?: string;
  points?: number;
  rank?: number;
}

export enum ContentType {
  WRITTEN = 'WRITTEN',
  MCQ = 'MCQ'
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
  questions?: number; // Count for MCQ (Legacy/Summary)
  questionList?: MCQQuestion[]; // Detailed MCQ data
  isDeleted?: boolean; // Soft delete
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  parentId?: string; // Added for nesting/sub-folders
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
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'PENDING' | 'GRADED';
  obtainedMarks: number;
  answers: {
    questionId: string;
    selectedOption?: number; // For MCQ
    writtenImages?: string[]; // For Written (Array of base64/urls)
  }[];
}

// New Interface for tracking student results in dashboard
export interface StudentResult {
    id: string;
    examId: string;
    examTitle: string;
    score: number;
    totalMarks: number;
    negativeDeduction: number;
    date: string;
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
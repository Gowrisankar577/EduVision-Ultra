export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[]; // Base64 strings
  generatedImage?: string; // Base64 string for AI generated image
  generatedVideo?: string; // URL/Blob for AI generated video
  timestamp: number;
  isError?: boolean;
}

export enum GradeLevel {
  Elementary = 'Grade 1-5',
  MiddleSchool = 'Grade 6-10',
  HighSchool = 'Grade 11-12',
  College = 'College/University',
}

export interface UserSettings {
  gradeLevel: GradeLevel;
  language: string;
  selectedMode: string;
  isTeacherMode: boolean; // For Content Quality Checker
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardData {
  topic: string;
  cards: Flashcard[];
}

export interface MindmapNode {
  label: string;
  children?: MindmapNode[];
}

export interface WhiteboardStep {
  label: string;
  content: string;
}

export interface WhiteboardData {
  title: string;
  steps: WhiteboardStep[];
}

export interface StudyPlanDay {
  day: string;
  focus: string;
  tasks: string[];
}

export interface StudyPlanData {
  title: string;
  days: StudyPlanDay[];
}

// Special block types parsed from JSON in AI response
export type InteractiveBlock = 
  | { type: 'quiz'; data: QuizData }
  | { type: 'flashcards'; data: FlashcardData }
  | { type: 'whiteboard'; data: WhiteboardData }
  | { type: 'study_plan'; data: StudyPlanData };

export type ImageSize = '1K' | '2K' | '4K';
export type VideoAspectRatio = '16:9' | '9:16';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
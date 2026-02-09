
export enum Section {
  RailStandardAI = 'RailStandardAI',
  FlashCards = 'FlashCards',
  Quiz = 'Quiz',
  Standards = 'Standards',
}

export interface Citation {
  standard: string;
  clause: string;
  page: number;
}

export interface AIResponse {
  answer: string;
  citations: Citation[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  distractors: string[];
  citations: Citation[];
}

export interface UploadedStandard {
  id: string;
  name: string;
  originalName: string;
  data: Uint8Array;
  text: string;
}

export interface SelectedStandardRef {
  standard: UploadedStandard;
  page: number;
  clause?: string;
}

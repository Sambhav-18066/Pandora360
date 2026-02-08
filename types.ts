
export enum AppState {
  SETUP = 'SETUP',
  GENERATING = 'GENERATING',
  IMMERSION = 'IMMERSION'
}

export interface PanoramaData {
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

export interface TranscriptionItem {
  text: string;
  sender: 'user' | 'tutor';
  timestamp: number;
}

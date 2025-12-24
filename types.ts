export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface GenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
}

export interface GenerationResult {
  imageUrl: string | null; // The Data URI for immediate display
  remoteUrl: string | null; // The hosted URL (catbox)
  loading: boolean;
  error: string | null;
  executionTime?: number;
}

export interface HistoryItem extends GenerationConfig {
  id: string;
  imageUrl: string;
  remoteUrl?: string | null;
  timestamp: number;
  
  // Version Control
  version: number;
  parentId?: string | null; // ID of the image this was edited from
}

export type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
};

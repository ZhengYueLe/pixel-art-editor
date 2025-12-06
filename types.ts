export interface PixelGrid {
  width: number;
  height: number;
  pixels: string[]; // Hex codes or empty string for transparent
}

export interface Template {
  id: string;
  name: string;
  grid: string[]; // 16x16 flattened
  previewColor: string;
  image?: string; // Base64 encoded image string for reference
}

export enum ToolType {
  PENCIL = 'PENCIL',
  ERASER = 'ERASER',
  FILL = 'FILL'
}

export interface GenerationConfig {
  blessing: string;
  includeArt: boolean;
}
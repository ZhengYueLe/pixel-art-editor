import { Template } from './types';

export const DEFAULT_GRID_SIZE = 16;
export const GRID_OPTIONS = [
  { label: '入门 (12x12)', value: 12 },
  { label: '标准 (16x16)', value: 16 },
  { label: '进阶 (24x24)', value: 24 },
  { label: '专家 (32x32)', value: 32 },
];
export const CELL_SIZE_PREVIEW = 10;

// Traditional Chinese Colors
export const PALETTE = [
  '#DC2626', // Red (Primary)
  '#FCD34D', // Gold/Yellow
  '#1F2937', // Ink Black
  '#FFFFFF', // White
  '#F87171', // Light Red
  '#B91C1C', // Dark Red
  '#10B981', // Jade Green
  '#F59E0B', // Amber
  '#60A5FA', // Blue (Porcelain)
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#92400E', // Bronze/Brown
];

// Helper to convert hex to RGB
export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Find nearest color in palette
export const findNearestPaletteColor = (hex: string): string => {
  const input = hexToRgb(hex);
  let minDistance = Infinity;
  let nearest = PALETTE[0];

  for (const color of PALETTE) {
    const target = hexToRgb(color);
    // Simple Euclidean distance
    const dist = Math.sqrt(
      Math.pow(input.r - target.r, 2) +
      Math.pow(input.g - target.g, 2) +
      Math.pow(input.b - target.b, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearest = color;
    }
  }
  return nearest;
};

const createEmpty = (size: number) => new Array(size * size).fill('');

// Helper to create simple patterns quickly (Standard 16x16)
const t1 = createEmpty(16);
// Simple 'Fu' (福) rough representation
[54,55,56,57, 69,73, 85,86,87,88,89, 101,103,105, 117,119,121, 133,134,135,136,137, 149,153, 165,166,167,168].forEach(i => t1[i] = '#1F2937'); // Black char
t1.forEach((v, i) => { if(!v && i > 32 && i < 224) t1[i] = '#DC2626'; }); // Red BG fill

const t2 = createEmpty(16);
// Lantern
const lanternRed = [
  37,38,39,40,41,42,
  52,53,54,55,56,57,58,59,
  68,69,70,71,72,73,74,75,
  84,85,86,87,88,89,90,91,
  100,101,102,103,104,105,106,107,
  116,117,118,119,120,121,122,123,
  133,134,135,136,137,138
];
lanternRed.forEach(i => t2[i] = '#DC2626');
// Gold accents
[37,42,133,138, 87,88].forEach(i => t2[i] = '#FCD34D');
// Tassel
[149,150, 165,166, 181,182, 197,198].forEach(i => t2[i] = '#FCD34D');

const t3 = createEmpty(16);
// Ingot (Yuanbao)
const goldBody = [
  100,101,102,103,104,105,106,107,
  115,116,117,118,119,120,121,122,123,124,
  132,133,134,135,136,137,138,139,140,141,
  149,150,151,152,153,154,155,156
];
goldBody.forEach(i => t3[i] = '#FCD34D');
// Red details
[119,120, 135,136].forEach(i => t3[i] = '#DC2626');

const t4 = createEmpty(16);
// Firecracker
[
  38,39, 54,55, 70,71, 86,87, // String
  52,53,68,69,84,85, // Left cracker
  56,57,72,73,88,89, // Right cracker
  102,103, 118,119, 134,135, // Middle
  150,151 // Bottom
].forEach(i => t4[i] = '#DC2626');
[38,39].forEach(i => t4[i] = '#1F2937'); // Fuse

export const DEFAULT_TEMPLATES: Template[] = [
  { id: 'fu', name: '福 (Prosperity)', grid: t1, previewColor: '#FEE2E2' },
  { id: 'lantern', name: '红灯笼 (Lantern)', grid: t2, previewColor: '#FEF3C7' },
  { id: 'ingot', name: '金元宝 (Ingot)', grid: t3, previewColor: '#FFFBEB' },
  { id: 'cracker', name: '鞭炮 (Firecracker)', grid: t4, previewColor: '#FEF2F2' },
];
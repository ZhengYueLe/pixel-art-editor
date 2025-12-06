import { DEFAULT_GRID_SIZE, PALETTE, DEFAULT_TEMPLATES, findNearestPaletteColor } from '../constants';
import { Template } from '../types';

// Palette Map for Compression: 'a' through 'l' for colors, 'z' for transparent.
const COLOR_MAP_ENC: Record<string, string> = {};
const COLOR_MAP_DEC: Record<string, string> = { 'z': '' };

PALETTE.forEach((color, i) => {
  const char = String.fromCharCode(97 + i); // a, b, c...
  COLOR_MAP_ENC[color] = char;
  COLOR_MAP_DEC[char] = color;
});

const encodeGrid = (grid: string[]): string => {
  let rle = '';
  let count = 0;
  let prevVal: string | null = null;

  for (let i = 0; i <= grid.length; i++) {
    // Current char (mapped)
    const val = i < grid.length ? (grid[i] ? COLOR_MAP_ENC[grid[i]] || 'a' : 'z') : null;
    
    if (val === prevVal) {
      count++;
    } else {
      if (prevVal !== null) {
        rle += `${count}${prevVal}`;
      }
      prevVal = val;
      count = 1;
    }
  }
  return rle;
};

// Decodes assuming DEFAULT_GRID_SIZE (16) for templates
const decodeGrid = (rle: string): string[] => {
  const grid: string[] = [];
  const matches = rle.match(/(\d+)([a-z])/g);
  if (!matches) return new Array(DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE).fill('');

  matches.forEach(m => {
    const count = parseInt(m.slice(0, -1), 10);
    const char = m.slice(-1);
    const color = COLOR_MAP_DEC[char] || '';
    for (let i = 0; i < count; i++) {
      grid.push(color);
    }
  });

  // Fill remainder if any (error safety)
  while (grid.length < DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE) grid.push('');
  return grid.slice(0, DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE);
};

export const encodeTemplatesToUrl = (templates: Template[], baseUrl?: string): string => {
  try {
    const parts = templates.map(t => {
      // Use encodeURI for names to handle Chinese characters safely
      const safeName = encodeURIComponent(t.name);
      const gridData = encodeGrid(t.grid);
      // Safe encode image data (replace unsafe chars if any, though base64 is mostly safe, strictly it uses + and /)
      // We use a custom separator ~
      const imageData = t.image ? encodeURIComponent(t.image) : '';
      return `${safeName}~${gridData}~${imageData}`; 
    });
    // Use _ as separator between items
    const hash = parts.join('_');
    
    const origin = baseUrl || window.location.origin;
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    return cleanOrigin + window.location.pathname + '#data=' + hash;
  } catch (e) {
    console.error("Encoding failed", e);
    return window.location.href;
  }
};

export const decodeTemplatesFromUrl = (): Template[] | null => {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#data=')) return null;
    
    const data = hash.substring(6); // remove #data=
    const parts = data.split('_');
    
    if (parts.length === 0) return null;

    return parts.map((part, index) => {
      const [nameEnc, gridRle, imageEnc] = part.split('~');
      const name = decodeURIComponent(nameEnc);
      const grid = decodeGrid(gridRle);
      const image = imageEnc ? decodeURIComponent(imageEnc) : undefined;
      
      const defaultPreview = DEFAULT_TEMPLATES[index % DEFAULT_TEMPLATES.length]?.previewColor || '#FFFBEB';

      return {
        id: `shared-${index}-${Date.now()}`,
        name: name || `图样 ${index + 1}`,
        grid: grid,
        previewColor: defaultPreview,
        image: image
      };
    });

  } catch (e) {
    console.error("Decoding failed", e);
    return null;
  }
};

// Updated: Compress image to small Base64 JPEG for reference
export const processImageUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Limit size to 100x100 to keep QR code size manageable
      const MAX_SIZE = 100; 
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');

      // Draw with white background (for transparency handling)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress to JPEG with 0.7 quality to save space
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      URL.revokeObjectURL(url);
      resolve(base64);
    };
    
    img.onerror = reject;
    img.src = url;
  });
};
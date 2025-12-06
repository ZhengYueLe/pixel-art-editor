import React, { useRef, useEffect, useState } from 'react';
import { generateCNYBlessing } from '../services/genai';

interface CardPreviewProps {
  size: number;
  pixels: string[];
  isOpen: boolean;
  onClose: () => void;
}

const CardPreview: React.FC<CardPreviewProps> = ({ size: gridSize, pixels, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blessing, setBlessing] = useState("新春快乐\n万事如意");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'CARD' | 'RAW'>('CARD');

  // Generate a random blessing when opened if empty
  useEffect(() => {
    if (isOpen) {
      // Pre-fill default
    }
  }, [isOpen]);

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 600;
    const height = 800; // Portrait card
    canvas.width = width;
    canvas.height = height;

    if (mode === 'RAW') {
      // Draw just the pixel art scaled up
      canvas.width = 512;
      canvas.height = 512;
      
      // Ensure white background (per user request)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);

      const cellSize = 512 / gridSize;
      pixels.forEach((color, i) => {
        if (color) {
          const x = (i % gridSize) * cellSize;
          const y = Math.floor(i / gridSize) * cellSize;
          ctx.fillStyle = color;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      });
      return;
    }

    // --- CARD MODE ---

    // 1. Background (Rich Red Gradient)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#991b1b'); // Red 800
    gradient.addColorStop(1, '#7f1d1d'); // Red 900
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 1.5 Decorative Pattern (Subtle Clouds)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for(let i=0; i<20; i++) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const r = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r, cy, r*0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - r*0.5, cy + r*0.5, r*0.6, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Borders
    // Outer Gold Line
    ctx.strokeStyle = '#FCD34D'; // Gold
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, width - 30, height - 30);
    
    // Inner Thick Gold Border
    ctx.strokeStyle = '#F59E0B'; // Darker Gold
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 25, width - 50, height - 50);

    // Corner Patterns (Traditional Bracket Style)
    const cornerSize = 40;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FCD34D';
    
    // Top Left
    ctx.beginPath();
    ctx.moveTo(35, 35 + cornerSize);
    ctx.lineTo(35, 35);
    ctx.lineTo(35 + cornerSize, 35);
    ctx.stroke();

    // Top Right
    ctx.beginPath();
    ctx.moveTo(width - 35 - cornerSize, 35);
    ctx.lineTo(width - 35, 35);
    ctx.lineTo(width - 35, 35 + cornerSize);
    ctx.stroke();

    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(35, height - 35 - cornerSize);
    ctx.lineTo(35, height - 35);
    ctx.lineTo(35 + cornerSize, height - 35);
    ctx.stroke();

    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(width - 35 - cornerSize, height - 35);
    ctx.lineTo(width - 35, height - 35);
    ctx.lineTo(width - 35, height - 35 - cornerSize);
    ctx.stroke();

    // --- LAYOUT: Branding (Top) -> Art (Middle) -> Text (Bottom) ---

    // 3. Branding Text (TOP)
    ctx.font = '56px "Ma Shan Zheng", cursive';
    ctx.fillStyle = '#FCD34D'; // Gold text
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.textAlign = 'center';
    
    // Draw "古纹像素坊" at top
    ctx.fillText("古纹像素坊", width / 2, 110);
    
    // Subtitle slightly smaller
    ctx.font = '24px "Ma Shan Zheng", cursive';
    ctx.fillStyle = 'rgba(252, 211, 77, 0.8)';
    ctx.shadowBlur = 0;
    ctx.fillText("Traditional Pixel Art Workshop", width / 2, 145);

    // 4. Draw Pixel Art (MIDDLE)
    const artSize = 380; 
    const artX = (width - artSize) / 2;
    const artY = 180; // Moved UP
    const cellSize = artSize / gridSize;

    // Paper backing for art (Rounded Square)
    ctx.fillStyle = '#FFFBEB'; // Warm white
    const r = 20;
    ctx.beginPath();
    ctx.roundRect(artX - 20, artY - 20, artSize + 40, artSize + 40, r);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow
    
    // Inner Red Border for Art
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the pixels
    pixels.forEach((color, i) => {
      if (color) {
        const x = artX + (i % gridSize) * cellSize;
        const y = artY + Math.floor(i / gridSize) * cellSize;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    });

    // 5. Text (Blessing) - BOTTOM POSITION
    ctx.fillStyle = '#FCD34D'; // Gold text
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.font = '52px "Ma Shan Zheng", cursive';
    ctx.textAlign = 'center';
    
    const lines = blessing.split('\n');
    let textY = 650; // Start at bottom
    lines.forEach((line) => {
      ctx.fillText(line, width / 2, textY);
      textY += 70;
    });

    // 6. Flower Decor (Simple Plum Blossoms)
    const drawFlower = (cx: number, cy: number) => {
        ctx.fillStyle = '#FECACA'; // Light pink petals
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        for(let i=0; i<5; i++) {
            const angle = (i * 2 * Math.PI) / 5;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle)*10, cy + Math.sin(angle)*10, 8, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.fillStyle = '#FCD34D'; // Gold center
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI*2);
        ctx.fill();
    };

    // Draw flowers around branding
    drawFlower(width/2 - 160, 100);
    drawFlower(width/2 + 160, 100);

    // Draw flowers at corners
    drawFlower(60, 60);
    drawFlower(width - 60, 60);
    drawFlower(60, height - 60);
    drawFlower(width - 60, height - 60);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(drawCard, 200); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, blessing, mode, pixels, gridSize]);

  const handleGenerateBlessing = async () => {
    setLoading(true);
    const newBlessing = await generateCNYBlessing();
    setBlessing(newBlessing);
    setLoading(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > 17) return;
    const lines = val.split('\n');
    if (lines.length > 2) return;
    setBlessing(val);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = mode === 'CARD' ? 'guwen-pixel-card.png' : 'pixel-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-red-900 border-2 border-yellow-600 rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto flex flex-col shadow-2xl animate-fade-in relative">
        
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>

        <div className="p-4 flex justify-between items-center sticky top-0 bg-red-900/95 z-10 border-b border-red-800">
          <h2 className="text-xl font-bold text-yellow-100 flex items-center gap-2 font-calligraphy">
             <span>🧧</span> 古纹像素坊 - 保存作品
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-red-800 rounded-full text-yellow-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          <div className="flex gap-4 mb-2">
            <button 
              onClick={() => setMode('CARD')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${mode === 'CARD' ? 'bg-yellow-500 border-yellow-500 text-red-900 shadow-lg scale-105' : 'bg-transparent border-yellow-700 text-yellow-600 hover:border-yellow-500'}`}
            >
              🧧 节日贺卡
            </button>
            <button 
              onClick={() => setMode('RAW')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all border-2 ${mode === 'RAW' ? 'bg-yellow-500 border-yellow-500 text-red-900 shadow-lg scale-105' : 'bg-transparent border-yellow-700 text-yellow-600 hover:border-yellow-500'}`}
            >
              🎨 原始图片
            </button>
          </div>

          <div className="relative shadow-2xl border-4 border-yellow-600 rounded-lg overflow-hidden bg-red-800">
            <canvas ref={canvasRef} className="max-w-full h-auto max-h-[40vh]" />
          </div>

          {mode === 'CARD' && (
            <div className="w-full flex flex-col gap-3">
              <label className="text-sm font-bold text-yellow-200/80 flex justify-between">
                <span>祝福语 (显示在最下方)</span>
                <span className="text-xs font-normal text-yellow-200/50">最多16字 / 2行</span>
              </label>
              <div className="flex gap-2">
                <textarea 
                  value={blessing} 
                  onChange={handleTextChange}
                  className="flex-1 p-3 border-2 border-red-700 rounded-lg resize-none text-center font-calligraphy text-xl bg-red-950 focus:ring-2 focus:ring-yellow-600 outline-none text-yellow-100 placeholder-red-800"
                  rows={2}
                  maxLength={17}
                  placeholder="输入祝福..."
                />
                <button 
                  onClick={handleGenerateBlessing}
                  disabled={loading}
                  className="px-4 bg-gradient-to-br from-yellow-500 to-yellow-700 text-red-900 rounded-lg font-bold shadow hover:scale-105 active:scale-95 transition-transform flex flex-col items-center justify-center min-w-[80px] border border-yellow-400"
                >
                  {loading ? (
                    <span className="animate-spin text-xl">⟳</span>
                  ) : (
                    <>
                      <span className="text-xl">✨</span>
                      <span className="text-xs">随机</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={handleDownload}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            保存到本地
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
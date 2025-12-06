import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolType } from '../types';

interface PixelGridProps {
  size: number;
  pixels: string[];
  setPixels: React.Dispatch<React.SetStateAction<string[]>>;
  selectedColor: string;
  tool: ToolType;
  showGridLines: boolean;
}

const PixelGrid: React.FC<PixelGridProps> = ({ 
  size: gridSize,
  pixels, 
  setPixels, 
  selectedColor, 
  tool,
  showGridLines
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [containerSize, setContainerSize] = useState(300);

  // Resize observer to make canvas responsive
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Limit max size for better UX on large screens
        setContainerSize(Math.min(width, 500));
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = containerSize;
    const cellSize = size / gridSize;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw Checkered Background (Transparency Indicator)
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#e5e7eb' : '#ffffff';
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }

    // Draw Pixels
    pixels.forEach((color, index) => {
      if (color) {
        const x = (index % gridSize) * cellSize;
        const y = Math.floor(index / gridSize) * cellSize;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    });

    // Draw Grid Lines
    if (showGridLines) {
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= gridSize; i++) {
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, size);
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(size, i * cellSize);
      }
      ctx.stroke();
    }
  }, [pixels, containerSize, showGridLines, gridSize]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const handleDraw = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const cellSize = containerSize / gridSize;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
      const index = row * gridSize + col;
      
      if (tool === ToolType.FILL) {
        // Flood Fill Implementation
        const targetColor = pixels[index];
        if (targetColor === selectedColor) return;

        const newPixels = [...pixels];
        const stack = [index];
        
        while (stack.length > 0) {
          const curr = stack.pop()!;
          if (newPixels[curr] === targetColor) {
            newPixels[curr] = selectedColor;
            const c = curr % gridSize;
            const r = Math.floor(curr / gridSize);
            
            // Check neighbors
            if (c > 0) stack.push(curr - 1);
            if (c < gridSize - 1) stack.push(curr + 1);
            if (r > 0) stack.push(curr - gridSize);
            if (r < gridSize - 1) stack.push(curr + gridSize);
          }
        }
        setPixels(newPixels);
      } else {
        // Pencil or Eraser
        const newColor = tool === ToolType.ERASER ? '' : selectedColor;
        if (pixels[index] !== newColor) {
          const newPixels = [...pixels];
          newPixels[index] = newColor;
          setPixels(newPixels);
        }
      }
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    handleDraw(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDrawing && tool !== ToolType.FILL) {
      handleDraw(e.clientX, e.clientY);
    }
  };

  const onPointerUp = () => {
    setIsDrawing(false);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full flex justify-center items-center p-2 bg-white rounded-xl shadow-inner border border-stone-200"
    >
      <canvas
        ref={canvasRef}
        width={containerSize}
        height={containerSize}
        className="cursor-crosshair touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ width: containerSize, height: containerSize }}
      />
    </div>
  );
};

export default PixelGrid;
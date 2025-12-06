import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import PixelGrid from './components/PixelGrid';
import CardPreview from './components/CardPreview';
import { DEFAULT_GRID_SIZE, GRID_OPTIONS, PALETTE, DEFAULT_TEMPLATES } from './constants';
import { ToolType, Template } from './types';
import { encodeTemplatesToUrl, decodeTemplatesFromUrl, processImageUpload } from './services/sharing';

function App() {
  // State
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [pixels, setPixels] = useState<string[]>(new Array(DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE).fill(''));
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [tool, setTool] = useState<ToolType>(ToolType.PENCIL);
  
  // Templates State
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  
  // UI State
  const [showGridLines, setShowGridLines] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(true); // Default to showing selection
  
  // Admin Mode State
  const [isAdmin, setIsAdmin] = useState(false);

  // QR Code State
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [customOrigin, setCustomOrigin] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load from URL if present
  useEffect(() => {
    const shared = decodeTemplatesFromUrl();
    if (shared) {
      setTemplates(shared);
    }
    // We keep showSelectionModal as true so the user (mobile or desktop) has to pick one to start.
  }, []);

  // Initialize custom origin with current location
  useEffect(() => {
    setCustomOrigin(window.location.origin);
  }, []);

  // Update QR code when URL or Custom Origin changes
  useEffect(() => {
    if (showQRCode) {
      // Re-generate URL if origin changed
      const url = encodeTemplatesToUrl(templates, customOrigin);
      setQrUrl(url);

      if (qrCanvasRef.current) {
        QRCode.toCanvas(qrCanvasRef.current, url, { 
          width: 256, 
          margin: 1,
          color: {
            dark: '#991b1b', // Red-800 for style
            light: '#ffffff'
          }
        }, (error) => {
          if (error) console.error("QR Generation failed", error);
        });
      }
    }
  }, [showQRCode, customOrigin, templates]);

  const loadTemplate = (template: Template) => {
    setActiveTemplate(template);
    setShowSelectionModal(false);
    setShowTemplates(false);
  };

  const copyTemplateToCanvas = () => {
    if (!activeTemplate) return;
    
    // Check if user confirmed
    if (!window.confirm("确定要覆盖当前的画作吗？")) return;

    // If Grid Size matches default (16), just copy
    if (gridSize === DEFAULT_GRID_SIZE) {
      setPixels([...activeTemplate.grid]);
      return;
    }

    // If Grid Size is different, we need to center the 16x16 template on the current grid
    const newPixels = new Array(gridSize * gridSize).fill('');
    const tSize = DEFAULT_GRID_SIZE; // Templates are always 16x16
    
    // Calculate offset to center
    const offsetX = Math.floor((gridSize - tSize) / 2);
    const offsetY = Math.floor((gridSize - tSize) / 2);

    for (let r = 0; r < tSize; r++) {
      for (let c = 0; c < tSize; c++) {
        const tIndex = r * tSize + c;
        const color = activeTemplate.grid[tIndex];
        
        // Target coordinates
        const tr = r + offsetY;
        const tc = c + offsetX;

        if (tr >= 0 && tr < gridSize && tc >= 0 && tc < gridSize) {
           const targetIndex = tr * gridSize + tc;
           newPixels[targetIndex] = color;
        }
      }
    }
    setPixels(newPixels);
  };

  const handleTemplateUpload = async (index: number, file: File) => {
    try {
      const imageBase64 = await processImageUpload(file);
      const newTemplates = [...templates];
      newTemplates[index] = { 
        ...newTemplates[index], 
        image: imageBase64,
        grid: new Array(DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE).fill('') // Clear grid as it's now an image template
      };
      setTemplates(newTemplates);
    } catch (e) {
      console.error(e);
      alert("图片处理失败，请重试");
    }
  };

  const handleTemplateRename = (index: number, newName: string) => {
    const newTemplates = [...templates];
    newTemplates[index] = { ...newTemplates[index], name: newName };
    setTemplates(newTemplates);
  };

  const handleAddTemplate = () => {
    const newTemplate: Template = {
      // Add random suffix to ensure uniqueness even if clicked fast
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: '新图样',
      grid: new Array(DEFAULT_GRID_SIZE * DEFAULT_GRID_SIZE).fill(''),
      previewColor: '#FFFBEB'
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); // Important: Stop click from triggering parent/other elements
    
    if (templates.length <= 1) {
      alert("至少保留一个模板");
      return;
    }

    if (window.confirm("确定删除这个图样吗？")) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      
      // If we deleted the currently active template, close it
      if (activeTemplate && activeTemplate.id === id) {
        setActiveTemplate(null);
      }
    }
  };

  const handleOpenQR = () => {
    setShowQRCode(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
      alert("链接已复制到剪贴板！");
    });
  };

  const clearCanvas = () => {
    // Directly set a fresh array based on current gridSize
    setPixels(new Array(gridSize * gridSize).fill(''));
  };

  const changeGridSize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    if (newSize === gridSize) return;

    if (pixels.some(p => p !== '') && !window.confirm("改变画板大小将清空当前画布，确定吗？")) {
       return;
    }
    
    setGridSize(newSize);
    setPixels(new Array(newSize * newSize).fill(''));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row max-w-7xl mx-auto overflow-hidden font-sans relative">
      
      {/* Decorative Floating Elements (Lanterns) */}
      <div className="absolute top-4 left-4 w-12 h-20 bg-red-600 rounded-lg shadow-lg hidden xl:flex flex-col items-center justify-end pb-2 animate-bounce duration-[3000ms] z-0">
         <div className="w-10 h-16 border-2 border-yellow-400 rounded opacity-50"></div>
         <div className="w-1 h-4 bg-yellow-500 absolute -top-4"></div>
         <div className="w-1 h-10 bg-yellow-500 absolute -bottom-8"></div>
      </div>
      <div className="absolute top-12 right-12 w-16 h-24 bg-red-700 rounded-xl shadow-xl hidden xl:flex flex-col items-center justify-end pb-2 animate-bounce duration-[4000ms] z-0">
         <div className="w-12 h-20 border-2 border-yellow-400 rounded opacity-50"></div>
         <div className="w-1 h-4 bg-yellow-500 absolute -top-4"></div>
         <div className="w-1 h-12 bg-yellow-500 absolute -bottom-10"></div>
      </div>

      {/* --- Initial Selection Modal (Landing Screen) --- */}
      {showSelectionModal && (
        <div className="fixed inset-0 z-[100] bg-[#7f1d1d] flex flex-col items-center justify-center p-4">
           {/* Background Pattern */}
           <div className="absolute inset-0 opacity-10 bg-[url('./resources/rice-paper-2.png')] pointer-events-none"></div>
           
           <h1 className="text-4xl md:text-5xl font-calligraphy text-yellow-300 mb-2 drop-shadow-md text-center">古纹像素坊</h1>
           <p className="text-yellow-100/80 mb-8 text-center max-w-md">请选择一个传统图样开始您的创作</p>

           <div className="grid grid-cols-2 gap-4 max-w-2xl w-full max-h-[60vh] overflow-y-auto p-4 scrollbar-hide">
             {templates.map((t) => (
                <button 
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className="bg-white/90 p-4 rounded-xl shadow-xl flex flex-col items-center gap-3 transform transition-all hover:scale-105 hover:bg-white active:scale-95 border-2 border-transparent hover:border-yellow-500 group"
                >
                   <div 
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg shadow-inner border border-stone-200 flex-shrink-0 overflow-hidden flex items-center justify-center" 
                    style={{ backgroundColor: t.previewColor }}
                   >
                     {t.image ? (
                        <img src={t.image} alt={t.name} className="w-full h-full object-contain" />
                     ) : (
                       <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${DEFAULT_GRID_SIZE}, 1fr)` }}>
                         {t.grid.map((c, i) => (
                           <div key={i} style={{ backgroundColor: c }} />
                         ))}
                       </div>
                     )}
                   </div>
                   <span className="font-bold text-red-900 font-calligraphy text-xl">{t.name}</span>
                </button>
             ))}
           </div>
           
           <button 
             onClick={() => setShowSelectionModal(false)}
             className="mt-8 text-sm text-yellow-500 hover:text-yellow-300 underline"
           >
             跳过选择，直接进入工坊 &rarr;
           </button>
        </div>
      )}

      {/* --- Sidebar (Templates & Admin) --- */}
      <div className={`
        fixed inset-0 z-40 bg-black/80 lg:static lg:bg-transparent lg:w-80 lg:flex-shrink-0
        transition-opacity duration-300 ${showTemplates ? 'opacity-100 visible' : 'opacity-0 invisible lg:opacity-100 lg:visible'}
      `}>
        <div 
          className={`
            h-full w-80 bg-[#fff1f2] border-r-4 border-red-800 flex flex-col overflow-hidden transform transition-transform duration-300
            ${showTemplates ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            absolute lg:relative top-0 left-0 shadow-2xl lg:shadow-none
          `}
        >
          <div className="p-5 border-b-2 border-red-200 flex justify-between items-center bg-red-800 text-yellow-100">
             <h1 className="text-2xl font-calligraphy">古纹像素坊</h1>
             <button onClick={() => setShowTemplates(false)} className="lg:hidden p-2 text-yellow-200">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex flex-col gap-2 border-b border-red-200 pb-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-red-800 font-bold tracking-wider flex items-center gap-1">
                  <span className="text-xl">🎨</span> 传统图样
                </p>
                <button 
                  onClick={handleOpenQR}
                  className="hidden lg:flex text-xs bg-yellow-100 text-red-800 border border-yellow-300 px-3 py-1 rounded-full hover:bg-yellow-200 gap-1 items-center font-bold shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><path d="M3 21h7v-7H3v7zM10 3v7h4V3h-4z"></path></svg>
                  手机运行
                </button>
              </div>
              
              {/* Admin Toggle - NOW VISIBLE ON ALL DEVICES */}
              <div className="flex justify-end px-1">
                 <label className="text-xs flex items-center gap-2 cursor-pointer text-gray-500 hover:text-red-600 transition-colors">
                   <input 
                     type="checkbox" 
                     checked={isAdmin} 
                     onChange={e => setIsAdmin(e.target.checked)} 
                     className="rounded text-red-600 focus:ring-red-500" 
                   />
                   管理员模式
                 </label>
              </div>
            </div>

            {templates.map((t, idx) => (
              <div key={t.id} className="group relative bg-white border-2 border-red-100 rounded-xl overflow-hidden transition-all hover:border-red-400 hover:shadow-lg hover:scale-[1.02]">
                {/* Header / Click to Load */}
                <button
                  onClick={() => { loadTemplate(t); setShowTemplates(false); }}
                  className={`w-full p-3 flex items-center gap-3 text-left transition-colors ${activeTemplate?.id === t.id ? 'bg-red-50' : ''}`}
                >
                   <div 
                    className="w-14 h-14 rounded-lg shadow-sm border border-stone-200 flex-shrink-0 overflow-hidden flex items-center justify-center" 
                    style={{ backgroundColor: t.previewColor }}
                   >
                     {t.image ? (
                        <img src={t.image} alt={t.name} className="w-full h-full object-contain" />
                     ) : (
                       <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${DEFAULT_GRID_SIZE}, 1fr)` }}>
                         {t.grid.map((c, i) => (
                           <div key={i} style={{ backgroundColor: c }} />
                         ))}
                       </div>
                     )}
                   </div>
                   <span className="font-bold text-gray-800 truncate flex-1 font-calligraphy text-lg">{t.name}</span>
                </button>

                {/* Edit Controls (Only in Admin Mode) */}
                {isAdmin && (
                  <div className="border-t border-red-50 p-2 bg-red-50/50 flex gap-2 items-center text-xs animate-fade-in" onClick={(e) => e.stopPropagation()}>
                     <input 
                       type="text" 
                       value={t.name}
                       onChange={(e) => handleTemplateRename(idx, e.target.value)}
                       className="flex-1 bg-white border border-red-200 rounded px-2 py-1 focus:ring-1 focus:ring-red-500 outline-none text-red-900"
                       placeholder="名字"
                     />
                     <label className="cursor-pointer text-blue-500 hover:text-blue-700 p-2 bg-white rounded border border-blue-100 hover:border-blue-300" title="上传图片">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => e.target.files?.[0] && handleTemplateUpload(idx, e.target.files[0])}
                        />
                     </label>
                     <button 
                        type="button"
                        onClick={(e) => handleDeleteTemplate(e, t.id)}
                        className="text-red-500 hover:text-red-700 p-2 bg-white rounded border border-red-100 hover:border-red-300 z-50"
                        title="删除"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                     </button>
                  </div>
                )}
              </div>
            ))}

            {isAdmin && (
              <button 
                onClick={handleAddTemplate}
                className="w-full py-3 border-2 border-dashed border-red-300 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-400 font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>+ 添加新图样</span>
              </button>
            )}
          </div>
          
          <div className="p-4 bg-yellow-100 border-t border-yellow-200 hidden lg:block">
            <p className="text-xs text-yellow-900 leading-relaxed font-medium">
              <strong>管理员贴士：</strong> 勾选上方“管理员模式”可管理图样。上传图片将保持原图(不转像素)，供玩家参考。
            </p>
          </div>
        </div>
      </div>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 shadow-2xl">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 bg-red-800 border-b-4 border-yellow-600 shrink-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTemplates(true)}
              className="lg:hidden p-2 -ml-2 text-yellow-100 hover:bg-red-700 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className="text-xl font-calligraphy text-yellow-100 lg:hidden">古纹像素坊</h1>
            
            {/* Grid Size Selector */}
            <div className="flex items-center gap-2 bg-red-900/50 p-1 pr-2 rounded-lg border border-red-700">
               <label className="text-xs text-yellow-200 font-bold hidden sm:block pl-2">画板:</label>
               <select 
                 value={gridSize} 
                 onChange={changeGridSize}
                 className="bg-red-50 border border-red-200 text-red-900 text-sm rounded focus:ring-yellow-500 focus:border-yellow-500 block p-1 font-bold"
               >
                 {GRID_OPTIONS.map(opt => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                 ))}
               </select>
            </div>
          </div>

          <button 
            onClick={() => setIsExportOpen(true)}
            className="px-4 py-2 bg-yellow-500 text-red-900 text-sm font-bold rounded-full shadow-[0_2px_0_#b45309] hover:bg-yellow-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>完成制作</span> 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
          </button>
        </header>

        {/* Canvas Area */}
        <main className="flex-1 overflow-y-auto bg-stone-100 flex flex-col items-center justify-start py-8 px-4 gap-6 bg-[url('./resources/rice-paper-2.png')]">
          
          {/* Reference View */}
          {activeTemplate && (
             <div className="flex flex-col items-center animate-fade-in transition-all bg-white p-2 rounded-xl shadow-lg border-2 border-red-100">
               <div className="flex items-center gap-2 mb-1 w-full justify-between">
                 <p className="text-xs text-red-800 font-bold uppercase tracking-wider">参考图样</p>
                 <button onClick={() => setActiveTemplate(null)} className="text-gray-400 hover:text-red-500 font-bold px-1">✕</button>
               </div>
               <div className="border border-gray-200 rounded overflow-hidden flex items-center justify-center bg-gray-50">
                 {activeTemplate.image ? (
                   <img src={activeTemplate.image} alt="参考" className="max-w-[150px] max-h-[150px] object-contain" />
                 ) : (
                   <div style={{ 
                     display: 'grid', 
                     gridTemplateColumns: `repeat(${DEFAULT_GRID_SIZE}, 8px)`, 
                     gridTemplateRows: `repeat(${DEFAULT_GRID_SIZE}, 8px)` 
                   }}>
                      {activeTemplate.grid.map((c, i) => (
                        <div key={i} style={{ backgroundColor: c || '#f5f5f4' }} />
                      ))}
                   </div>
                 )}
               </div>
               
               {/* Only show "Copy" button if it's a grid template, not an image */}
               {!activeTemplate.image && (
                 <button 
                  onClick={copyTemplateToCanvas}
                  className="mt-2 text-xs w-full bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-700 font-bold hover:bg-blue-100 transition-colors shadow-sm"
                 >
                   复制到画板
                 </button>
               )}
             </div>
          )}

          <div className="relative shadow-2xl rounded-xl border-[8px] border-white ring-4 ring-gray-200 bg-white">
             <PixelGrid 
                size={gridSize}
                pixels={pixels} 
                setPixels={setPixels} 
                selectedColor={selectedColor} 
                tool={tool}
                showGridLines={showGridLines}
             />
          </div>

          <div className="flex gap-6 text-sm font-medium">
             <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 hover:text-red-700 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
               <input type="checkbox" checked={showGridLines} onChange={e => setShowGridLines(e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
               显示网格
             </label>
             <button onClick={clearCanvas} className="flex items-center gap-1 text-gray-600 hover:text-red-700 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200 transition-colors active:scale-95">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
               清空画板
             </button>
          </div>
        </main>

        {/* Bottom Toolbar */}
        <div className="bg-white border-t-2 border-red-100 p-4 pb-8 lg:pb-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] z-30">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            
            {/* Colors */}
            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar mask-fade-sides items-center py-2">
              {PALETTE.map(color => (
                <button
                  key={color}
                  onClick={() => { setSelectedColor(color); setTool(ToolType.PENCIL); }}
                  className={`
                    w-10 h-10 rounded-full shrink-0 border-2 transition-all shadow-sm
                    ${selectedColor === color && tool !== ToolType.ERASER ? 'border-gray-800 scale-125 shadow-lg z-10 ring-2 ring-offset-2 ring-gray-300' : 'border-white hover:scale-110'}
                  `}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>

            {/* Tools */}
            <div className="flex justify-between items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200">
               <div className="flex gap-1 w-full">
                 <button 
                  onClick={() => setTool(ToolType.PENCIL)}
                  className={`p-3 rounded-lg flex-1 flex justify-center items-center gap-2 transition-all ${tool === ToolType.PENCIL ? 'bg-white shadow text-red-600 font-bold' : 'text-gray-500 hover:bg-gray-200'}`}
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                   <span className="text-xs">画笔</span>
                 </button>
                 <button 
                  onClick={() => setTool(ToolType.FILL)}
                  className={`p-3 rounded-lg flex-1 flex justify-center items-center gap-2 transition-all ${tool === ToolType.FILL ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-200'}`}
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11z"></path><path d="M5 2h14"></path><path d="M2 22h20"></path></svg>
                   <span className="text-xs">填充</span>
                 </button>
                 <button 
                  onClick={() => setTool(ToolType.ERASER)}
                  className={`p-3 rounded-lg flex-1 flex justify-center items-center gap-2 transition-all ${tool === ToolType.ERASER ? 'bg-white shadow text-gray-800 font-bold' : 'text-gray-500 hover:bg-gray-200'}`}
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path><path d="M17 17L7 7"></path></svg>
                   <span className="text-xs">橡皮</span>
                 </button>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border-4 border-red-100">
            <h2 className="text-xl font-bold text-red-800 mb-2">在手机上画画</h2>
            <p className="text-sm text-gray-500 mb-4">使用微信或相机扫码</p>
            
            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 border-4 border-red-600 rounded-xl shadow-inner">
                 <canvas ref={qrCanvasRef} className="w-64 h-64" />
              </div>
            </div>

            {/* Server Address Helper */}
            <div className="mb-4 text-left bg-gray-50 p-3 rounded-lg">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">服务器地址修正</label>
              <input 
                type="text" 
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
                placeholder="例如 http://192.168.1.5:3000"
                className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-200 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                注意：如果扫码后无法打开（显示 localhost），请输入您电脑的局域网 IP 地址。
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={copyLink}
                className="w-full py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors"
              >
                复制链接
              </button>
              <button 
                onClick={() => setShowQRCode(false)}
                className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-xl transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <CardPreview 
        size={gridSize}
        pixels={pixels} 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
      />
    </div>
  );
}

export default App;
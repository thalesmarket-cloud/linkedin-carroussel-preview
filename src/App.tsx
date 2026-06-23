import React, { useState, useRef, useEffect } from "react";
import {
  Upload, Trash2, Eye, Smartphone, Monitor, Shield, ArrowLeft, ArrowRight,
  GripVertical, AlertTriangle, CheckCircle, Image as ImageIcon, HelpCircle
} from "lucide-react";

interface Slide {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
  width: number;
  height: number;
  isValidDimensions: boolean; // Exact standard of 1080x1350 px
}

export default function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [safeAreaOn, setSafeAreaOn] = useState<boolean>(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Helper file size formatter
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Pre-load default template slides to guide user immediately
  useEffect(() => {
    // Elegant system templates
    const generateDemoSvg = (title: string, subtitle: string, step: string, bg: string, textCol: string) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
        <rect width="100%" height="100%" fill="${bg}"/>
        <circle cx="900" cy="200" r="300" fill="white" fill-opacity="0.04" />
        <rect x="100" y="100" width="30" height="30" rx="8" fill="${textCol}" fill-opacity="0.8"/>
        <text x="150" y="122" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="${textCol}" fill-opacity="0.7">APERÇU CARROUSEL</text>
        <text x="100" y="550" font-family="system-ui, sans-serif" font-weight="800" font-size="64" fill="${textCol}">${title}</text>
        <text x="100" y="650" font-family="system-ui, sans-serif" font-weight="400" font-size="32" fill="${textCol}" fill-opacity="0.8">${subtitle}</text>
        <text x="100" y="1150" font-family="system-ui, sans-serif" font-weight="950" font-size="160" fill="${textCol}" fill-opacity="0.12">${step}</text>
        <text x="100" y="1250" font-family="system-ui, sans-serif" font-weight="bold" font-size="22" fill="${textCol}" fill-opacity="0.5">Glissez vers la gauche ➔</text>
      </svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    setSlides([
      {
        id: "demo-1",
        name: "01_Introduction.png",
        dataUrl: generateDemoSvg("Titre de votre Carrousel", "Glissez vos propres images à gauche", "01", "#0a66c2", "#ffffff"),
        size: 15400,
        width: 1080,
        height: 1350,
        isValidDimensions: true
      },
      {
        id: "demo-2",
        name: "02_Guide_Dimensions.png",
        dataUrl: generateDemoSvg("Format Idéal LinkedIn", "Portrait standard 1080 x 1350 px", "02", "#1d2226", "#ffffff"),
        size: 14200,
        width: 1080,
        height: 1350,
        isValidDimensions: true
      }
    ]);
  }, []);

  // Keyboard navigation listeners (Arrow Left & Arrow Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slides.length === 0) return;
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  // Handle local user files upload
  const handleFiles = (files: FileList) => {
    const loadedSlides: Slide[] = [];
    let processedCount = 0;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        // Dynamically measure width/height
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const isValidDimensions = width === 1080 && height === 1350;

          loadedSlides.push({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            dataUrl,
            size: file.size,
            width,
            height,
            isValidDimensions
          });

          processedCount++;
          if (processedCount === files.length) {
            setSlides((prev) => {
              const updated = [...prev, ...loadedSlides];
              // default to first added if workspace was empty
              if (prev.length === 0 && updated.length > 0) {
                setCurrentIndex(0);
              }
              return updated;
            });
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Drag and Drop reordering controls
  const handleDragStartSlide = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOverSlide = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...slides];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setSlides(updated);
  };

  const handleDragEndSlide = () => {
    setDraggedIndex(null);
  };

  const deleteSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = slides.filter((_, i) => i !== index);
    setSlides(updated);
    if (updated.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= updated.length) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const clearAll = () => {
    setSlides([]);
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] text-slate-900 flex flex-col font-sans" id="app-root">
      
      {/* Navigation Top Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-[#0a66c2] text-white rounded flex items-center justify-center font-black text-lg">
            in
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-none">Prévisualisation Simple</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Carrousel LinkedIn (1080 × 1350 px)</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {slides.length > 0 && (
            <button
              onClick={clearAll}
              className="text-slate-500 hover:text-red-650 font-semibold cursor-pointer py-1 px-2 hover:bg-slate-50 rounded"
            >
              Vider le Workspace
            </button>
          )}
          <span className="font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-bold">
            {slides.length} {slides.length > 1 ? "slides" : "slide"}
          </span>
        </div>
      </header>

      {/* Primary Layout splits */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full max-w-[1500px] w-full mx-auto" id="app-body-split">
        
        {/* LEFT COLUMN: Import & List (5 Cols) */}
        <section className="lg:col-span-4 p-5 border-r border-slate-200 bg-white flex flex-col overflow-y-auto" id="col-import">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-850 tracking-tight">1. Importez vos images</h2>
            <p className="text-xs text-slate-400 mt-0.5">Sélectionnez ou déposez vos slides ci-dessous.</p>
          </div>

          {/* Dragger Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 mb-5 ${
              isDragOver
                ? "border-[#0a66c2] bg-blue-50/10 scale-[0.98]"
                : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
            }`}
            id="drop-zone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <div className="p-3 bg-blue-50 text-[#0a66c2] rounded-full mb-2.5">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-750">Glissez-déposez vos images ici</p>
            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG ou WEBP (Max 50 Mo)</p>
          </div>

          <div className="flex-1 flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordre des Slides</span>
              <span className="text-[10px] text-slate-400">Glissez un élément pour réorganiser</span>
            </div>

            {slides.length > 0 ? (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1" id="file-list">
                {slides.map((slide, index) => {
                  const isActive = index === currentIndex;
                  return (
                    <div
                      key={slide.id}
                      draggable
                      onDragStart={() => handleDragStartSlide(index)}
                      onDragOver={(e) => handleDragOverSlide(e, index)}
                      onDragEnd={handleDragEndSlide}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? "border-[#0a66c2] bg-blue-50/10 ring-1 ring-[#0a66c2]/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      id={`slide-item-${index}`}
                    >
                      <div className="text-slate-400 cursor-grab active:cursor-grabbing shrink-0">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      <div className="w-5 h-5 flex items-center justify-center bg-slate-900 text-white rounded-full font-bold text-[10px] shrink-0 font-mono">
                        {index + 1}
                      </div>

                      <div className="w-10 h-12 bg-slate-100 border border-slate-200 rounded overflow-hidden shrink-0 relative flex items-center justify-center">
                        <img
                          src={slide.dataUrl}
                          alt={slide.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate" title={slide.name}>
                          {slide.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 mt-0.5">
                          <span>{formatSize(slide.size)}</span>
                          <span>•</span>
                          <span className={slide.isValidDimensions ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                            {slide.width}x{slide.height} px
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => deleteSlide(index, e)}
                        type="button"
                        className="p-1 text-slate-400 hover:text-red-650 transition-colors rounded hover:bg-slate-50 shrink-0"
                        title="Supprimer la slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center p-6 bg-slate-50">
                <ImageIcon className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                <p className="text-xs font-semibold text-slate-500">Aucun fichier</p>
                <p className="text-[10px] text-slate-400 mt-1">Glissez des images pour démarrer de suite.</p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Simulator Arena (8 Cols) */}
        <section className="lg:col-span-8 p-6 flex flex-col items-center justify-start overflow-y-auto space-y-5" id="col-preview">
          
          {/* Controls toolbar */}
          <div className="w-full max-w-[500px] flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm" id="tools-panel">
            {/* View selectors */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/40">
              <button
                onClick={() => setPreviewMode("desktop")}
                type="button"
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  previewMode === "desktop"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-550 hover:text-slate-900"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                type="button"
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  previewMode === "mobile"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-550 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            {/* Safe boundaries selector switcher */}
            <button
              onClick={() => setSafeAreaOn(!safeAreaOn)}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                safeAreaOn
                  ? "bg-amber-50 border-amber-200 text-amber-700 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${safeAreaOn ? "fill-amber-500 stroke-white" : ""}`} />
              <span>Zone Safe : {safeAreaOn ? "ACTIF" : "OFF"}</span>
            </button>
          </div>

          {slides.length > 0 ? (
            <div className="w-full flex flex-col items-center space-y-4">
              
              {/* Dynamic Mockup Viewport frame */}
              <div
                className={`relative transition-all duration-300 w-full overflow-hidden ${
                  previewMode === "mobile"
                    ? "max-w-[340px] border-[12px] border-slate-950 rounded-[40px] shadow-2xl bg-[#0f172a] aspect-[9/19] flex flex-col justify-between"
                    : "max-w-[480px] bg-[#0f172a] rounded-xl border border-slate-300/80 shadow-lg aspect-[4/5]"
                }`}
                id="carousel-outer"
              >
                
                {/* Mobile top simulator header wrapper bar */}
                {previewMode === "mobile" && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-40 flex items-center justify-around px-2">
                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
                  </div>
                )}

                {/* Subtitle information */}
                {previewMode === "mobile" && (
                  <div className="bg-white border-b border-slate-100 pt-7 pb-2 px-4 flex items-center justify-between shrink-0 select-none text-slate-700 font-semibold text-[10px] z-20">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#0a66c2] rounded-full"></div>
                      <span>Simulation Mobile</span>
                    </div>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full font-mono font-bold text-slate-600">
                      {currentIndex + 1} / {slides.length}
                    </span>
                  </div>
                )}

                {/* Main slide display center container (exactly 4:5 aspect layout) */}
                <div className="relative w-full h-full flex-1 flex items-center justify-center bg-slate-950">
                  <img
                    src={slides[currentIndex]?.dataUrl}
                    alt={`Slide ${currentIndex + 1}`}
                    className="w-full h-full object-contain pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Top-right index counter natively rendered by LinkedIn */}
                  <div className="absolute top-3 right-3 z-30 bg-black/55 backdrop-blur text-[11px] text-white font-semibold font-mono px-2.5 py-1 rounded-full pointer-events-none tracking-wider shadow-sm">
                    {currentIndex + 1}/{slides.length}
                  </div>

                  {/* LinkedIn blue bottom progression line tracking */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 z-30 pointer-events-none">
                    <div
                      className="h-full bg-[#0a66c2] transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                    ></div>
                  </div>

                  {/* Physical navigation chevrons for easier click operations */}
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                    type="button"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white shadow-md z-30 transition-all cursor-pointer"
                    title="Slide Précédente"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white shadow-md z-30 transition-all cursor-pointer"
                    title="Slide Suivante"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Visual Safe Zone boundaries layout meshes */}
                  {safeAreaOn && (
                    <div className="absolute inset-0 z-20 pointer-events-none" id="safe-area-lines">
                      {/* Top Unstable area warning */}
                      <div className="absolute inset-x-0 top-0 h-[100px] bg-rose-500/10 border-b border-dashed border-rose-500 flex items-center justify-center">
                        <span className="text-[9px] text-rose-800 font-bold bg-white/90 px-1.5 py-0.5 rounded shadow">
                          Zone d'exclusion du numéro {currentIndex + 1}/{slides.length}
                        </span>
                      </div>

                      {/* Bottom Unstable area warning */}
                      <div className="absolute inset-x-0 bottom-0 h-[110px] bg-rose-500/10 border-t border-dashed border-rose-500 flex items-center justify-center">
                        <span className="text-[9px] text-rose-800 font-bold bg-white/90 px-1.5 py-0.5 rounded shadow">
                          Zone d'exclusion de la barre bleue LinkedIn
                        </span>
                      </div>

                      {/* Side borders padding */}
                      <div className="absolute inset-y-0 left-0 w-[44px] bg-amber-500/5 border-r border-dashed border-amber-500"></div>
                      <div className="absolute inset-y-0 right-0 w-[44px] bg-amber-500/5 border-l border-dashed border-amber-500"></div>

                      <div className="absolute top-[102px] bottom-[112px] left-[46px] right-[46px] border border-dashed border-emerald-500 flex items-center justify-center">
                        <span className="text-[10px] text-emerald-800 font-bold bg-white/90 px-2.5 py-1 rounded-full shadow border border-emerald-200">
                          ZONE DE SÉCURITÉ : OK POUR TEXTES 
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile bottom empty shelf simulator */}
                {previewMode === "mobile" && (
                  <div className="h-4 bg-white shrink-0 z-25"></div>
                )}
              </div>

              {/* Slider Dots Navigator */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                      index === currentIndex ? "w-6 bg-[#0a66c2]" : "w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                  ></button>
                ))}
              </div>

              {/* Standard format check alert banner */}
              <div className="w-full max-w-[480px]">
                {slides[currentIndex]?.isValidDimensions ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <p><b>Visuel Conforme :</b> Cette slide respecte parfaitement le format vertical portrait recommandé <b>(1080 × 1350 px)</b>.</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                    <div>
                      <p><b>⚠️ Dimensions différentes :</b> Vos dimensions réelles sont de <b>{slides[currentIndex]?.width} × {slides[currentIndex]?.height} px</b>.</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">Pour éviter un recadrage flou par LinkedIn, convertissez vos images au format standard 1080 × 1350.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center text-slate-400 text-[10px] flex items-center gap-1 mt-1 justify-center">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Astuce : Vous pouvez utiliser les flèches directionnelles de votre clavier <b>← / →</b> pour passer les images.</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full max-w-[480px] bg-slate-100/50 rounded-xl border border-dashed border-slate-300 shadow-inner flex flex-col items-center justify-center p-8 text-center aspect-[4/5]" id="empty-state">
              <ImageIcon className="w-12 h-12 text-slate-300 stroke-1 mb-3" />
              <h3 className="font-bold text-slate-700">En attente des images</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mt-2">
                Glissez-déposez vos images dans la zone de gauche pour tester et prévisualiser immédiatement leur affichage LinkedIn.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import {
  Upload, Trash2, Smartphone, Monitor, ArrowLeft, ArrowRight,
  GripVertical, Image as ImageIcon, HelpCircle, ThumbsUp, MessageSquare,
  Share2, Send, Check, Sparkles, Link as LinkIcon, AlertCircle, Copy,
  Maximize2, Minimize2, X
} from "lucide-react";

interface Slide {
  id: string;
  name: string;
  dataUrl: string; // local base64 or public web URL
  size: number;
  width: number;
  height: number;
}

export default function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Custom advertiser post states
  const [companyName, setCompanyName] = useState<string>("Mon Entreprise");
  const [companyTitle, setCompanyTitle] = useState<string>("B2B Marketing Architect & Coach");
  const [adText, setAdText] = useState<string>(
    "🚀 Saviez-vous que les carrousels LinkedIn génèrent 3x plus d'engagement qu'une image standard ?\n\n🎯 Cependant, il y a un piège : les éléments clés de vos visuels (textes importants, boutons de swipe, visages) sont souvent masqués par l'interface de LinkedIn (numérotation en haut à droite, barre de défilement bleue en bas).\n\n👇 Entrez votre texte publicitaire ci-contre, glissez vos slides et activez les \"zones de sécurité\" pour adapter vos créas directement pour mobile et desktop !"
  );
  const [isAdTextExpanded, setIsAdTextExpanded] = useState<boolean>(false);
  
  // Image URL input state
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlInputError, setUrlInputError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sharing states
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [largeFilesWarning, setLargeFilesWarning] = useState<boolean>(false);

  // Helper file size formatter
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Safe encoding and decoding of state in URL Hash
  const serializeState = (currentSlides: Slide[], text: string, name: string, title: string) => {
    try {
      const compactSlides = currentSlides.map(s => ({
        id: s.id,
        name: s.name,
        dataUrl: s.dataUrl,
        size: s.size,
        width: s.width,
        height: s.height
      }));

      const stateObj = {
        slides: compactSlides,
        adText: text,
        companyName: name,
        companyTitle: title
      };

      const jsonStr = JSON.stringify(stateObj);
      // UTF-8 friendly Base 64 encoding
      const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      return encoded;
    } catch (e) {
      console.error("Error serializing state:", e);
      return null;
    }
  };

  const deserializeState = (hash: string) => {
    try {
      const decoded = decodeURIComponent(atob(hash).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(decoded);
    } catch (e) {
      console.error("Error deserializing state:", e);
      return null;
    }
  };

  // Preload default templates or restore from URL Hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#state=")) {
      const encodedState = hash.slice("#state=".length);
      const restored = deserializeState(encodedState);
      if (restored) {
        if (Array.isArray(restored.slides)) setSlides(restored.slides);
        if (restored.adText !== undefined) setAdText(restored.adText);
        if (restored.companyName !== undefined) setCompanyName(restored.companyName);
        if (restored.companyTitle !== undefined) setCompanyTitle(restored.companyTitle);
        return;
      }
    }

    // Default Fallback Template Slides if no hash is present
    const generateDemoSvg = (title: string, subtitle: string, step: string, bg: string, textCol: string) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
        <rect width="100%" height="100%" fill="${bg}"/>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.1" />
            <stop offset="100%" style="stop-color:#000000;stop-opacity:0.25" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <circle cx="900" cy="200" r="320" fill="white" fill-opacity="0.05" />
        <circle cx="100" cy="1100" r="220" fill="black" fill-opacity="0.1" />
        
        <g transform="translate(100, 100)">
          <rect width="180" height="40" rx="10" fill="${textCol}" fill-opacity="0.15" />
          <text x="90" y="25" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="${textCol}" text-anchor="middle">SLIDE ${step}</text>
        </g>
        
        <text x="100" y="480" font-family="system-ui, sans-serif" font-weight="900" font-size="70" fill="${textCol}" letter-spacing="-1">${title}</text>
        <text x="100" y="580" font-family="system-ui, sans-serif" font-weight="400" font-size="34" fill="${textCol}" fill-opacity="0.85" letter-spacing="-0.5">${subtitle}</text>
        
        <text x="100" y="1180" font-family="system-ui, sans-serif" font-weight="bold" font-size="24" fill="${textCol}" fill-opacity="0.6">Glissez vers la gauche ➔</text>
      </svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    setSlides([
      {
        id: "demo-1",
        name: "01_Introduction.png",
        dataUrl: generateDemoSvg("Votre Super Carrousel", "Glissez vos slides ou insérez des images", "01", "#0a66c2", "#ffffff"),
        size: 18200,
        width: 1080,
        height: 1350
      },
      {
        id: "demo-2",
        name: "02_Guide_Pratique.png",
        dataUrl: generateDemoSvg("Prévisualisation instantanée", "Modifiez les textes pour tester votre copywriting publicitaire", "02", "#1d2226", "#ffffff"),
        size: 16500,
        width: 1080,
        height: 1350
      }
    ]);
  }, []);

  // Keyboard navigation listeners (Arrow Left & Arrow Right & Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slides.length === 0) return;
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  // Monitor total size of slides to warn the user if URL length becomes critical for local files
  useEffect(() => {
    let totalLength = 0;
    slides.forEach(s => {
      if (s.dataUrl && s.dataUrl.startsWith("data:")) {
        totalLength += s.dataUrl.length;
      }
    });
    // If total base64 content exceeds roughly 100KB, URL sharing might be unstable or cut off by browsers
    setLargeFilesWarning(totalLength > 120000);
  }, [slides]);

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

          loadedSlides.push({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            dataUrl,
            size: file.size,
            width,
            height
          });

          processedCount++;
          if (processedCount === files.length) {
            setSlides((prev) => {
              const updated = [...prev, ...loadedSlides];
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

  // Add slide via image URL
  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setUrlInputError("");

    // Minimal validation
    if (!urlInput.startsWith("http://") && !urlInput.startsWith("https://") && !urlInput.startsWith("data:")) {
      setUrlInputError("Le lien doit commencer par http:// ou https://");
      return;
    }

    const img = new Image();
    img.onload = () => {
      const newSlide: Slide = {
        id: Math.random().toString(36).substring(2, 9),
        name: `Web_Image_${slides.length + 1}.png`,
        dataUrl: urlInput.trim(),
        size: 0,
        width: img.width,
        height: img.height
      };
      setSlides(prev => {
        const updated = [...prev, newSlide];
        if (prev.length === 0) setCurrentIndex(0);
        return updated;
      });
      setUrlInput("");
    };
    img.onerror = () => {
      setUrlInputError("Impossible de charger cette image. Vérifiez que le lien pointe directement vers un format d'image valide.");
    };
    img.src = urlInput.trim();
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

  // Generate and copy share link to clipboard
  const handleShareProject = () => {
    const serialized = serializeState(slides, adText, companyName, companyTitle);
    if (!serialized) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}#state=${serialized}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }).catch(err => {
      console.error("Failed to copy link:", err);
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-950 flex flex-col font-sans" id="app-root">
      
      {/* Navigation Top Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-[#0a66c2] text-white rounded flex items-center justify-center font-black text-xl shadow-sm select-none">
            in
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-none">Simulateur de Carrousel</h1>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Partage Vercel</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Importez, ordonnez, prévisualisez et partagez l'aperçu réel</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {slides.length > 0 && (
            <button
              onClick={clearAll}
              className="text-slate-500 hover:text-red-650 font-semibold cursor-pointer py-1 px-2.5 hover:bg-slate-100 rounded-lg transition"
            >
              Vider le projet
            </button>
          )}
          <span className="font-mono bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full font-bold shadow-sm">
            {slides.length} {slides.length > 1 ? "slides" : "slide"}
          </span>
        </div>
      </header>

      {/* Primary Layout splits */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden h-full w-full mx-auto" id="app-body-split">
        
        {/* LEFT COLUMN: Controls, Text Pub, Light Image Import Tabs, Share Actions (5 Cols / 12) */}
        <section className="xl:col-span-5 p-5 border-r border-slate-200 bg-white flex flex-col overflow-y-auto space-y-5" id="col-import">
          
          {/* SHARE CARD ACTION PANEL - NEW FEATURE FOR VERCEL DEPLOYMENT & SHARABLE LINK */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0a66c2] text-white rounded-lg flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-905 uppercase tracking-wide">Partager le Carrousel réel </h3>
                <p className="text-[10px] text-slate-500">Transmettez le lien exact de l'aperçu prêt à être visionné</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Une fois déployé ou partagé, vous pouvez envoyer ce lien à vos collègues ou vos clients. Ils verront exactement vos images et votre accroche en temps réel !
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleShareProject}
                type="button"
                className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all cursor-pointer ${
                  shareCopied
                    ? "bg-emerald-600 text-white"
                    : "bg-[#0a66c2] hover:bg-blue-700 text-white"
                }`}
              >
                {shareCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Lien de partage copié avec succès !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier le Lien de Partage 🔗</span>
                  </>
                )}
              </button>

              {largeFilesWarning && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Attention sur le partage d'images locales limitées</span>
                    <p className="mt-0.5 leading-tight">
                      Certains navigateurs coupent les URL trop longues contenant de gros fichiers hors ligne. Pour un partage parfait et stable, utilisez l'onglet <b>"Par URL d'image"</b> ci-dessous avec des liens d'images (Imgur, Unsplash...) !
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION A: EDIT ADVERTISING TEXT */}
          <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0a66c2]" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Texte de l'accroche LinkedIn</h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-white border px-1.5 py-0.5 rounded">
                {adText.length} caractères
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Émetteur / Nom du Profil</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a66c2]"
                  placeholder="Ex: Thales Market"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Slogan / Titre professionnel</label>
                <input
                  type="text"
                  value={companyTitle}
                  onChange={(e) => setCompanyTitle(e.target.value)}
                  className="w-full text-xs mt-1 p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a66c2]"
                  placeholder="Ex: Head of Brand & Copywriting"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase">Message descriptif ou publicitaire</label>
              <textarea
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                rows={4}
                className="w-full text-xs mt-1.5 p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a66c2] leading-normal"
                placeholder="Exprimez votre message à l'audience..."
              />
            </div>
          </div>

          {/* SECTION B: IMAGE IMPORT METHODS TABS (Local and Web Links) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">1. Ajoutez vos images</h2>
              <p className="text-[10px] text-slate-400">Importez des fichiers ou insérez des URL d'images pour le partage à distance</p>
            </div>

            {/* URL input section */}
            <form onSubmit={handleAddImageUrl} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                <span>Méthode A : Par URL publique d'image (Partage Vercel Optimal)</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setUrlInputError("");
                  }}
                  placeholder="Ex: https://images.unsplash.com/photo-1557804506-669a67965ba0?fit=crop&w=1080&h=1350"
                  className="flex-1 text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0a66c2]"
                />
                <button
                  type="submit"
                  className="bg-[#1d2226] text-white hover:bg-slate-800 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition"
                >
                  Ajouter URL
                </button>
              </div>
              {urlInputError ? (
                <p className="text-[10px] text-red-650 font-semibold">{urlInputError}</p>
              ) : (
                <p className="text-[9px] text-slate-400 font-normal">
                  Idéal pour charger des visuels hébergés de manière permanente et les envoyer directement dans votre lien de partage !
                </p>
              )}
            </form>

            {/* Local file uploader */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Méthode B : Importer des fichiers locaux</span>
              </span>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? "border-[#0a66c2] bg-blue-50/20 scale-[0.98]"
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
                <p className="text-xs font-semibold text-slate-800">Glissez-déposez ou parcourez vos fichiers d'images</p>
                <p className="text-[9px] text-slate-400 mt-1">PNG, JPG, WEBP (Max 50 Mo par image)</p>
              </div>
            </div>

            {/* LIST OF CURRENT SLIDES */}
            <div className="flex-1 flex flex-col pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordre des Slides du Carrousel ({slides.length})</span>
                {slides.length > 1 && (
                  <span className="text-[9px] text-slate-400">Glissez-déposez pour changer l'ordre</span>
                )}
              </div>

              {slides.length > 0 ? (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1" id="file-list">
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
                        <div className="text-slate-400 cursor-grab active:cursor-grabbing shrink-0 p-0.5">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        <div className="w-5 h-5 flex items-center justify-center bg-[#1d2226] text-white rounded-full font-bold text-[10px] shrink-0 font-mono">
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
                            {slide.size > 0 && <span>{formatSize(slide.size)}</span>}
                            <span>{slide.width && slide.height ? `${slide.width}x${slide.height} px` : "Web Image"}</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => deleteSlide(index, e)}
                          type="button"
                          className="p-1 text-slate-400 hover:text-red-650 transition-colors rounded hover:bg-slate-50 shrink-0"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-center p-6 bg-slate-50">
                  <ImageIcon className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Aucun visuel de configuré</p>
                  <p className="text-[10px] text-slate-400 mt-1">Glissez des images ou collez un lien d'image ci-dessus pour le charger.</p>
                </div>
              )}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Real Dynamic LinkedIn Feed Simulator (7 Cols / 12) - ZONE EXCLUSION REMOVED */}
        <section className="xl:col-span-7 bg-[#f3f2f0] p-4 lg:p-6 flex flex-col items-center justify-start overflow-y-auto space-y-4" id="col-preview">
          
          {/* Controls toolbar */}
          <div className="w-full max-w-[550px] flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex-wrap gap-2" id="tools-panel">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Simuler le Rendu sur :</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  type="button"
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    previewMode === "desktop"
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Ordinateur</span>
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  type="button"
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    previewMode === "mobile"
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Téléphone Mobile</span>
                </button>
              </div>
            </div>

            {/* FULL SCREEN ACTION TRIGGER - USER DEMAND */}
            {slides.length > 0 && (
              <button
                onClick={() => setIsFullscreen(true)}
                type="button"
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                title="Afficher l'aperçu final plein écran"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Plein Écran ⛶</span>
              </button>
            )}
          </div>

          {/* SIMULATION ZONE CARD */}
          {slides.length > 0 ? (
            <div className="w-full flex flex-col items-center space-y-4">
              
              {/* Dynamic Viewport frame styled as a LinkedIn Post container without overlay lines */}
              <div
                className={`transition-all duration-300 w-full ${
                  previewMode === "mobile"
                    ? "max-w-[360px] border-[10px] border-slate-900 rounded-[36px] bg-[#f3f2f0] shadow-2xl p-0 overflow-hidden"
                    : "max-w-[550px] bg-[#f3f2f0] rounded-none shadow-none border-0"
                }`}
                id="carousel-outer"
              >
                
                {/* Mobile top mockup standard header */}
                {previewMode === "mobile" && (
                  <div className="bg-black text-white px-5 py-1 flex items-center justify-between text-[11px] font-semibold border-b border-slate-200">
                    <span>10:24</span>
                    <div className="w-20 h-4 bg-black rounded-full z-45 mx-auto"></div>
                    <div className="flex gap-1 items-center">
                      <span>LTE</span>
                      <div className="w-4 h-2 bg-white rounded-xs"></div>
                    </div>
                  </div>
                )}

                {/* Simulated White Container Feed post */}
                <div className="bg-white border border-slate-200 rounded-none md:rounded-lg shadow-sm p-4 w-full text-slate-900 animate-fadeIn">
                  
                  {/* Creator header profile */}
                  <div className="flex items-start justify-between mb-3 select-none">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-[#0a66c2] text-white font-bold rounded-full flex items-center justify-center text-sm shrink-0 uppercase">
                        {companyName ? companyName.charAt(0).toUpperCase() : "E"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-900 hover:text-[#0a66c2] hover:underline cursor-pointer truncate">
                            {companyName || "Mon Carrousel"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">• 1er</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{companyTitle || "Professionnel LinkedIn"}</p>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                          <span>À l'instant</span>
                          <span>•</span>
                          <span>Sponsorisé 🌐</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-[#0a66c2] hover:bg-blue-50 px-2.5 py-1 rounded cursor-pointer shrink-0">
                      + Suivre
                    </button>
                  </div>

                  {/* Text hook */}
                  <div className="text-xs text-slate-900 mb-3 leading-relaxed whitespace-pre-line" id="linkedin-post-text">
                    {(() => {
                      const limit = previewMode === "mobile" ? 140 : 220;
                      if (adText.length <= limit || isAdTextExpanded) {
                        return (
                          <div>
                            {adText}
                            {adText.length > limit && (
                              <button
                                onClick={() => setIsAdTextExpanded(false)}
                                className="text-slate-400 font-bold ml-1.5 hover:underline text-[10px]"
                              >
                                [Réduire]
                              </button>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <div>
                            {adText.slice(0, limit)}...{" "}
                            <button
                              onClick={() => setIsAdTextExpanded(true)}
                              className="text-[#0a66c2] font-semibold hover:underline block md:inline font-sans mt-1 md:mt-0"
                            >
                              voir plus
                            </button>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {/* Carousel Container Frame exactly 4:5 Portrait format - NO EXCLUSION GRIDS */}
                  <div className="relative aspect-[4/5] bg-slate-950 w-full overflow-hidden border border-slate-200 group rounded" id="stage-carousel-container">
                    
                    <img
                      src={slides[currentIndex]?.dataUrl}
                      alt={`Slide focus ${currentIndex + 1}`}
                      className="w-full h-full object-contain pointer-events-none select-none animate-fadeIn"
                      referrerPolicy="no-referrer"
                    />

                    {/* Top-right standard UI indicator of slides count */}
                    <div className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur text-[10.5px] text-white font-bold font-mono px-2.5 py-1 rounded-full pointer-events-none tracking-wide shadow">
                      {currentIndex + 1}/{slides.length}
                    </div>

                    {/* Progress tracking line */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-black/30 z-30 pointer-events-none">
                      <div
                        className="h-full bg-[#0a66c2] transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                      ></div>
                    </div>

                    {/* Smooth navigational cursor arrow triggers */}
                    <button
                      onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                      type="button"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/45 hover:bg-black/65 rounded-full text-white shadow-md z-30 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Précédent"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-black/45 hover:bg-black/65 rounded-full text-white shadow-md z-30 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Suivant"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* LinkedIn Action Buttons (Fake Feed Interactions to complete realism) */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-150 text-slate-500 text-xs">
                    <button className="flex items-center gap-1.5 hover:bg-slate-100 py-2 px-3 rounded-lg font-semibold cursor-pointer transition">
                      <ThumbsUp className="w-4 h-4" />
                      <span>J'aime</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:bg-slate-100 py-2 px-3 rounded-lg font-semibold cursor-pointer transition">
                      <MessageSquare className="w-4 h-4" />
                      <span>Commenter</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:bg-slate-100 py-2 px-3 rounded-lg font-semibold cursor-pointer transition">
                      <Share2 className="w-4 h-4" />
                      <span>Partager</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:bg-slate-100 py-2 px-3 rounded-lg font-semibold cursor-pointer transition">
                      <Send className="w-4 h-4" />
                      <span>Envoyer</span>
                    </button>
                  </div>

                </div>

                {/* Mobile bottom simulator utility menu shelf */}
                {previewMode === "mobile" && (
                  <div className="bg-white border-t border-slate-200 py-2 px-6 flex justify-between text-slate-400 z-30 text-[10px] shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-[#0a66c2]">🏠</span>
                      <span className="text-[9px] text-[#0a66c2] font-semibold">Accueil</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs">👥</span>
                      <span className="text-[9px]">Réseau</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs">🔔</span>
                      <span className="text-[9px]">Notifications</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs">💼</span>
                      <span className="text-[9px]">Emplois</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Slider Dots Indicator */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-2 rounded-full shadow-sm">
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

              {/* Keyboard navigation tip indicator */}
              <div className="text-center text-slate-400 text-[10px] flex items-center gap-1.5 justify-center max-w-[500px] select-none">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <b>Astuce clavier :</b> Utilisez les flèches directionnelles de votre clavier <b>←</b> et <b>→</b> pour naviguer sur le carrousel.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full max-w-[550px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-8 text-center aspect-[4/5]" id="empty-state">
              <ImageIcon className="w-12 h-12 text-slate-300 stroke-1 mb-3" />
              <h3 className="font-bold text-slate-655">En attente de visuels</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mt-2">
                Glissez-déposez des slides à gauche ou ajoutez un lien d'image pour afficher l'aperçu de publication finale.
              </p>
            </div>
          )}
        </section>

      </div>

      {/* FULLSCREEN IMMERSIVE PRESENTATION THEATER MODE - SPECIALLY DEVELOPED FOR CLIENTS / PRESENTATION GIE */}
      {isFullscreen && slides.length > 0 && (
        <div className="fixed inset-0 bg-[#0c0f16] z-50 flex flex-col lg:flex-row overflow-hidden animate-fadeIn" id="fullscreen-overlay">
          
          {/* Main Presentation Stage Area */}
          <div className="flex-1 relative flex flex-col justify-between items-center bg-[#07090e] p-4 lg:p-8 select-none">
            
            {/* Top header navigation buttons inside fullscreen */}
            <div className="w-full max-w-5xl flex items-center justify-between text-slate-400 text-xs py-2 border-b border-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">Mode Présentation</span>
                <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full">
                  Appuyez sur <kbd className="bg-slate-750 px-1 py-0.5 rounded font-sans text-white text-[8.5px]">Échap</kbd> ou cliquez sur Retour
                </span>
              </div>
              <span className="text-xs font-bold text-slate-200 font-mono tracking-wider bg-slate-900 border border-slate-800 px-3 py-1 rounded-md">
                SLIDE {currentIndex + 1} SUR {slides.length}
              </span>
            </div>

            {/* Slide showcase - Center box with exact responsive fits */}
            <div className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-6">
              <img
                src={slides[currentIndex]?.dataUrl}
                alt={`Slide presentation ${currentIndex + 1}`}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-slate-800"
                referrerPolicy="no-referrer"
              />

              {/* Prev / Next navigation overlays */}
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                type="button"
                className="absolute left-1 lg:-left-6 p-3 bg-slate-900/90 hover:bg-[#0a66c2] text-white rounded-full border border-slate-700/60 shadow-xl transition-all cursor-pointer hover:scale-105"
                title="Précédent"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
                type="button"
                className="absolute right-1 lg:-right-6 p-3 bg-slate-900/90 hover:bg-[#0a66c2] text-white rounded-full border border-slate-700/60 shadow-xl transition-all cursor-pointer hover:scale-105"
                title="Suivant"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom active indicators dots panel */}
            <div className="flex flex-col items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-2 rounded-full">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                      index === currentIndex ? "w-8 bg-[#0a66c2]" : "w-2.5 bg-slate-700 hover:bg-slate-600"
                    }`}
                  ></button>
                ))}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Modèle d'aperçu de carrousel 1080x1350 • Format d'image originel
              </div>
            </div>

          </div>

          {/* Right Presentation Info Dock Sidebar */}
          <section className="w-full lg:w-[420px] bg-[#0f131a] border-t lg:border-t-0 lg:border-l border-slate-800 text-slate-100 flex flex-col justify-between shrink-0 overflow-y-auto" id="fullscreen-sidebar">
            
            {/* Sidebar header logo, profile info and page name */}
            <div className="p-6 border-b border-slate-800/80 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-[#0a66c2] uppercase bg-[#0a66c2]/10 px-2.5 py-1 rounded-md">
                  Aperçu de post
                </span>
                
                {/* Close modal action button */}
                <button
                  onClick={() => setIsFullscreen(false)}
                  type="button"
                  className="p-2 rounded-full bg-slate-850 hover:bg-red-600 hover:text-white text-slate-400 transition cursor-pointer flex items-center justify-center"
                  title="Retourner au simulateur"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Company / Brand Profile */}
              <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/55 select-none">
                <div className="w-12 h-12 bg-[#0a66c2] text-white font-bold rounded-full flex items-center justify-center text-lg uppercase shrink-0">
                  {companyName ? companyName.charAt(0).toUpperCase() : "E"}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-white truncate">
                    {companyName || "Mon Entreprise"}
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {companyTitle || "Votre titre professionnel"}
                  </p>
                  <span className="inline-block mt-1.5 text-[10px] text-slate-500">
                    Sponsorisé 🌐 • À l'instant
                  </span>
                </div>
              </div>
            </div>

            {/* Advertising text copywriting text (fully expanded with scrollbar) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                TEXTE PUBLICITAIRE DU POST
              </span>
              <div className="text-xs leading-relaxed text-slate-200 bg-slate-900/30 border border-slate-850 p-4 rounded-xl whitespace-pre-line font-sans">
                {adText ? adText : "Aucun texte d'accroche saisi."}
              </div>
            </div>

            {/* Quick action helper buttons inside presentation mode */}
            <div className="p-6 border-t border-slate-800 bg-[#0b0e14] flex flex-col gap-3">
              <button
                onClick={handleShareProject}
                type="button"
                className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-3 px-4 rounded-lg shadow-sm transition-all cursor-pointer ${
                  shareCopied
                    ? "bg-emerald-600 text-white"
                    : "bg-[#1d2226] text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700"
                }`}
              >
                {shareCopied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Lien copié pour votre client !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4.5 h-4.5 text-slate-400" />
                    <span>Copier le Lien Direct du Projet</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                type="button"
                className="w-full text-center py-2.5 text-xs text-slate-400 hover:text-white transition font-medium rounded-lg"
              >
                Retourner à l'Éditeur &rarr;
              </button>
            </div>

          </section>

        </div>
      )}

    </div>
  );
}

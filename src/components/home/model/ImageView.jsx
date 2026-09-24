import {
    FileImageIcon, FolderOpenIcon,
    GridIcon,
    ImageIcon,
    Loader2,
    PanelLeftOpenIcon,
    RotateCcwIcon,
    UploadIcon,
    ZoomInIcon,
    ZoomOutIcon
} from "lucide-react";
import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {formatFileSize, selectImage} from "./utils.js";

export default function ImageView({ sidebarOpen, activeImageList, setSidebarOpen, selectedModel, currentImage, setCurrentImage, setIsSourceModalOpen, image }){

    const [viewMode, setViewMode] = useState('single')
    const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'batch-seq' | 'batch-parallel' | 'success' | 'error'
    // Batch Processing State
    const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);
    const [batchResults, setBatchResults] = useState({});
    const [showBatchSummaryModal, setShowBatchSummaryModal] = useState(false);

    const [isDragOver, setIsDragOver] = useState(false);
    const imageViewportRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const [zoom, setZoom] = useState(1);

    const [error, setError] = useState(null)
    const viewportRef = useRef(null);
    const focalPointRef = useRef(null);

    const handleViewportScroll = () => {
        const container = viewportRef.current;
        if (!container || !container.scrollWidth || !container.scrollHeight) return;
        const centerX = container.scrollLeft + container.clientWidth / 2;
        const centerY = container.scrollTop + container.clientHeight / 2;
        focalPointRef.current = {
          x: centerX / container.scrollWidth,
          y: centerY / container.scrollHeight
        };
    };

    useLayoutEffect(() => {
        const container = viewportRef.current;
        if (!container) return;

        if (zoom === 1) {
          focalPointRef.current = null;
          container.scrollLeft = 0;
          container.scrollTop = 0;
          return;
        }

        // Lock initial focus point if none exists yet
        if (!focalPointRef.current) {
          focalPointRef.current = { x: 0.5, y: 0.5 };
        }

        const scrollW = container.scrollWidth;
        const scrollH = container.scrollHeight;
        const clientW = container.clientWidth;
        const clientH = container.clientHeight;

        const targetLeft = focalPointRef.current.x * scrollW - clientW / 2;
        const targetTop = focalPointRef.current.y * scrollH - clientH / 2;

        container.scrollLeft = Math.max(0, targetLeft);
        container.scrollTop = Math.max(0, targetTop);
      }, [zoom]);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length === 1) {
          setFolderImages([]);
          setBatchResults({});
          setSelectedSampleId(null);
          processImageFile(files[0]);
        } else if (files.length > 1) {
          const loadedList = files.map((file) => ({
            file,
            path: file.name,
            src: URL.createObjectURL(file),
            isPortrait: false
          }));

          loadedList.forEach((item) => {
            const tempImg = new Image();
            tempImg.onload = () => {
              item.isPortrait = tempImg.naturalHeight > tempImg.naturalWidth;
            };
            tempImg.src = item.src;
          });

          // setFolderImages(loadedList);
          setBatchResults({});
          // setSelectedSampleId(null);
          // setActiveFolderIndex(0);
          // processImageFile(loadedList[0].file, loadedList[0].path);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
      };

    const handleDragLeave = () => {
        setIsDragOver(false);
      };

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 1));
    const handleResetZoom = () => setZoom(1);

    const handleMouseDown = (e) => {
        if (zoom <= 1 || !imageViewportRef.current) return;
        setIsDragging(true);
        setDragStart({
          x: e.clientX,
          y: e.clientY,
          scrollLeft: imageViewportRef.current.scrollLeft,
          scrollTop: imageViewportRef.current.scrollTop
        });
      };

    const handleMouseMove = (e) => {
        if (!isDragging || !imageViewportRef.current) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        imageViewportRef.current.scrollLeft = dragStart.scrollLeft - dx;
        imageViewportRef.current.scrollTop = dragStart.scrollTop - dy;
      };

    const handleMouseUp = () => {
        setIsDragging(false);
      };

    const handleStartLoadFlow = () => {
        setIsSourceModalOpen(true);
    };

    const processImageFile = (image) => {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const width = img.naturalWidth;
                const height = img.naturalHeight;

                const isPortrait = height > width;

                const gcd = (a, b) =>
                    b === 0 ? a : gcd(b, a % b);

                const divisor = gcd(width, height) || 1;

                const aspectWidth = Math.round(width / divisor);
                const aspectHeight = Math.round(height / divisor);

                const orientation =
                    isPortrait
                        ? "Portrait"
                        : width === height
                            ? "Square"
                            : "Landscape";

                const imageData = {
                    src: image.url,
                    isPortrait,

                    metadata: {
                        filename: image.name,
                        fileSize: formatFileSize(image.size),
                        dimensions: `${width} × ${height} px`,
                        aspectRatio: `${aspectWidth}:${aspectHeight} (${orientation})`,
                        format: image.name
                            .split(".")
                            .pop()
                            .toUpperCase(),
                        colorSpace: "8-bit / RGB Color",
                        sourceUrl: image.path
                    }
                };

                setCurrentImage(imageData);
                handleResetZoom();

                resolve({
                    isPortrait,
                    width,
                    height,
                    imageData
                });
            };

            img.onerror = reject;
            img.src = image.url;
        });
    };

    useEffect(() => {
        if (image) {
            // setFolderImages([]);
            setBatchResults({});
            // setSelectedSampleId(null);
            processImageFile(image);
        }
    }, [image]);
    
    return (
        <>
            {/* View Mode & Header Action Toolbar */}
            <div className="w-full flex items-center justify-between mb-3 bg-white p-2 rounded-xl border border-gray-200 shadow-2xs">
                <div className="flex items-center gap-2 pl-2">
                    {!sidebarOpen && (
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="mr-2 text-xs font-semibold text-gray-700 hover:text-[#F69220] transition-colors flex items-center gap-1 cursor-pointer"
                        title="Expand Inspector"
                      >
                        <PanelLeftOpenIcon className="w-4 h-4 text-[#F69220]" />
                      </button>
                    )}
                    <span className="text-xs font-bold text-gray-800 hidden sm:inline">Image View:</span>
                    <span className="text-[11px] font-mono font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                      {activeImageList?.length || 0} {activeImageList?.length === 1 ? 'Image' : 'Images'}
                    </span>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setViewMode('single')}
                      className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'single'
                          ? 'bg-[#F69220] text-white shadow-2xs font-semibold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Single Focus
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#F69220] text-white shadow-2xs font-semibold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                      }`}
                    >
                      <GridIcon className="w-3.5 h-3.5" /> View All ({activeImageList?.length})
                    </button>
                </div>
            </div>

            {/* Batch Processing Indicator Banner */}
            {(status === 'batch-seq' || status === 'batch-parallel') && (
              <div className="absolute top-16 z-30 bg-gray-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-xl shadow-xl border border-gray-700 flex items-center gap-3 text-xs font-medium animate-bounce">
                <Loader2 className="w-4 h-4 text-[#F69220] animate-spin" />
                {status === 'batch-seq' ? (
                  <span>Running {selectedModel.name} One by One (Image {batchCurrentIndex} of {activeImageList?.length})</span>
                ) : (
                  <span>Running {selectedModel.name} on ALL {activeImageList.length} Images At Once (Parallel)...</span>
                )}
              </div>
            )}

            {viewMode === "single" && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative w-full flex-1 min-h-0 bg-gray-900 rounded-2xl border transition-all shadow-inner overflow-hidden flex flex-col ${
                      isDragOver ? 'border-[#F69220] ring-4 ring-[#F69220]/20 bg-gray-800' : 'border-gray-800'
                    }`}
                  >
                    {currentImage ? (
                      <div className="relative w-full h-full overflow-hidden flex flex-col">
                        {/* Zoom Controls Overlay - Fixed to viewport frame */}
                        <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-gray-200">
                          <button
                            onClick={handleZoomOut}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Zoom Out"
                          >
                            <ZoomOutIcon className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-mono font-semibold text-gray-700 px-2 min-w-[52px] text-center">
                            {Math.round(zoom * 100)}%
                          </span>
                          <button
                            onClick={handleZoomIn}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Zoom In"
                          >
                            <ZoomInIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Reset Zoom Overlay - Fixed to viewport frame */}
                        {zoom !== 1 && (
                          <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-gray-200">
                            <button
                              onClick={handleResetZoom}
                              className="px-3 h-8 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                              title="Reset Zoom View"
                            >
                              <RotateCcwIcon className="w-3.5 h-3.5 text-[#F69220]" /> Reset View
                            </button>
                          </div>
                        )}

                        {/* Scrollable Viewport with Instant Dynamic Layout Scaling */}
                        <div
                          ref={viewportRef}
                          onScroll={handleViewportScroll}
                          className="w-full h-full overflow-auto flex p-6 relative"
                        >
                          <div
                            className="m-auto flex items-center justify-center shrink-0"
                            style={{
                              width: `${zoom * 100}%`,
                              height: `${zoom * 100}%`,
                              minWidth: '100%',
                              minHeight: '100%'
                            }}
                          >
                            <img
                              src={currentImage.src}
                              alt="Model Input"
                              className="max-w-full max-h-full object-contain select-none drop-shadow-md"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Empty State Dropzone when no image is loaded */
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                        <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-[#F69220]">
                          <UploadIcon className="w-10 h-10 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No Image Selected</h3>
                        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                          Select an image or multiple images to run model inference.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button
                            // onClick={() => fileInputRef.current?.click()}
                            onClick={handleStartLoadFlow}
                            className="py-2.5 px-5 bg-[#F69220] hover:bg-[#e07f15] text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                          >
                            <FileImageIcon className="w-4 h-4" /> Select File(s)
                          </button>
                          <button
                            // onClick={() => folderInputRef.current?.click()}
                            className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                          >
                            <FolderOpenIcon className="w-4 h-4 text-[#F69220]" /> Load Folder
                          </button>
                        </div>

                        <div className="mt-8 text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Supported files: jpg, jpeg, png, webp, bmp</span>
                        </div>
                      </div>
                    )}
                  </div>
            )}

        </>

    )
}
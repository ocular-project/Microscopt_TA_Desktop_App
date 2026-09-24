import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDown as ChevronDownIcon,
    ChevronRight as ChevronRightIcon,
    FileImage as FileImageIcon,
    FolderOpen as FolderOpenIcon,
    Play as PlayIcon,
    Layers as LayersIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    RotateCcw as RotateCcwIcon,
    PanelLeftClose as PanelLeftCloseIcon,
    PanelLeftOpen as PanelLeftOpenIcon,
    Activity as ActivityIcon,
    Loader2,
    CheckCircle as CheckCircleIcon,
    AlertTriangle as AlertTriangleIcon,
    LayoutGrid as GridIcon,
    Image as ImageIcon,
    Eye as EyeIcon,
    Zap as ZapIcon, FolderOpen, X, Laptop, ChevronRight, HardDrive
} from 'lucide-react';
import Sidebar from "./Sidebar.jsx";
import SystemCheck from "./SystemCheck.jsx";
import ImageView from "./ImageView.jsx";
import {selectImage} from "./utils.js";

const AVAILABLE_MODELS = [
  {
    id: 'malaria-net-v2',
    name: 'MalariaNet CNN-v2',
    category: 'Malaria',
    badge: 'High Precision',
    description: 'Deep convolutional network trained on thin blood smear microscopy for P. falciparum detection.',
    accuracy: '98.4%'
  },
  {
    id: 'plasmo-yolo-v8',
    name: 'PlasmoYOLO-v8',
    category: 'Malaria',
    badge: 'Real-time',
    description: 'Object detection model for rapid counting and bounding box localization of trophozoites and ring forms.',
    accuracy: '96.8%'
  },
  {
    id: 'tb-cxr-resnet',
    name: 'TB-CXR ResNet-50',
    category: 'Tuberculosis',
    badge: 'FDA Cleared',
    description: 'Screening model for pulmonary tuberculosis lesions and apical cavitations in chest X-rays.',
    accuracy: '97.2%'
  },
  {
    id: 'tb-sputum-vit',
    name: 'SputumViT Micro',
    category: 'Tuberculosis',
    badge: 'Microscopy',
    description: 'Vision Transformer targeting Ziehl-Neelsen stained sputum smear acid-fast bacilli.',
    accuracy: '95.9%'
  },
  {
    id: 'cervical-pap-eff',
    name: 'CerviScan EfficientNet',
    category: 'Cervical Cancer',
    badge: 'Bethesda Std',
    description: 'Automated classification of Pap smear cytology according to the Bethesda system (LSIL / HSIL).',
    accuracy: '96.5%'
  },
  {
    id: 'cervical-colpo-densenet',
    name: 'ColpoAI DenseNet-121',
    category: 'Cervical Cancer',
    badge: 'Colposcopy',
    description: 'Evaluates acetowhite epithelium and abnormal vascular patterns in digital colposcopy.',
    accuracy: '94.8%'
  }
];

export default function ModelAnalyzer(){

  const [modalResponse, setModalResponse] = useState(null);
  const [zoom, setZoom] = useState(1);

  // View Mode state: 'single' or 'grid'
  const [viewMode, setViewMode] = useState('single');

  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // const [currentImage, setCurrentImage] = useState(SAMPLE_IMAGES[0]);
    const [image, setImage] = useState(null)
  const [currentImage, setCurrentImage] = useState(null);
  // const [selectedSampleId, setSelectedSampleId] = useState(SAMPLE_IMAGES[0].id);
  const [folderImages, setFolderImages] = useState([]);
  const [activeFolderIndex, setActiveFolderIndex] = useState(0);

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const imageViewportRef = useRef(null);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const [systemCheck, setSystemCheck] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if(!systemCheck){
      setSidebarOpen(true)
    }
  }, [systemCheck]);

  const handleChoosePC = async () => {
        await selectImage(setImage, setIsSourceModalOpen, setError)
  }

   const activeImageList = null

    return (

        <div className="h-screen w-screen max-h-screen max-w-screen overflow-hidden bg-slate-100 flex flex-col md:flex-row box-border relative select-none">
          {/* System Check */}
          <div
              className={`
                  absolute inset-0 z-50
                  transition-all duration-700 ease-in-out
                  ${systemCheck
                      ? "opacity-100 translate-x-0 pointer-events-auto"
                      : "opacity-0 -translate-x-full pointer-events-none"
                  }
              `}
          >
              <SystemCheck setSystemCheck={setSystemCheck} />
          </div>

          {/* Application */}
          <div
              className={`
                  flex w-full h-full
                  transition-all duration-700 ease-in-out
                  ${systemCheck
                      ? "opacity-0 translate-x-8"
                      : "opacity-100 translate-x-0"
                  }
              `}
          >
              <Sidebar
                  setSidebarOpen={setSidebarOpen}
                  sidebarOpen={sidebarOpen}
                  currentImage={currentImage}
                  AVAILABLE_MODELS={AVAILABLE_MODELS}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  setImage={setImage}
                  setIsSourceModalOpen={setIsSourceModalOpen}
              />

              <main className="flex-1 min-w-0 h-full flex flex-col items-center justify-between p-4 box-border relative">
                  <ImageView sidebarOpen={sidebarOpen} activeImageList={activeImageList} setSidebarOpen={setSidebarOpen}
                             selectedModel={selectedModel} setSelectedModel={setSelectedModel} setImage={setImage} image={image}
                             setIsSourceModalOpen={setIsSourceModalOpen} currentImage={currentImage} setCurrentImage={setCurrentImage}
                  />
              </main>
          </div>

          {isSourceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-[#1f1f1f] p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[#F7F9FB] rounded-xl text-[#F69220] border border-[#F69220]/30">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1f1f1f]">
                          Select File Source
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsSourceModalOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 my-4 leading-relaxed">
                      Choose where you want to load your image from:
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={handleChoosePC}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-[#F69220] bg-[#F7F9FB] hover:bg-[#F7F9FB]/80 text-left transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-secondary/60 text-primary flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                          <Laptop className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
                            <span>Load from Local PC</span>
                            <ChevronRight className="w-4 h-4 text-[#F69220] opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Open your machine's native file explorer to pick images
                          </p>
                        </div>
                      </button>

                      <button
                        // onClick={handleChooseDrive}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-[#F69220] bg-[#F7F9FB] hover:bg-[#F7F9FB]/80 text-left transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-secondary/60 text-primary border border-[#F69220]/40 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                          <HardDrive className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
                            <span>Browse through the teaching aid</span>
                            <ChevronRight className="w-4 h-4 text-[#F69220] opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Explore folders and images from the teaching aid file system
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setIsSourceModalOpen(false)}
                        className="px-5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
          )}

        </div>
    )
}
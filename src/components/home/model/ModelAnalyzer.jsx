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
  Zap as ZapIcon
} from 'lucide-react';
import Sidebar from "./Sidebar.jsx";
import SystemCheck from "./SystemCheck.jsx";

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
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'batch-seq' | 'batch-parallel' | 'success' | 'error'
  const [modalResponse, setModalResponse] = useState(null);
  const [zoom, setZoom] = useState(1);

  // View Mode state: 'single' or 'grid'
  const [viewMode, setViewMode] = useState('single');

  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // const [currentImage, setCurrentImage] = useState(SAMPLE_IMAGES[0]);
  const [currentImage, setCurrentImage] = useState(null);
  // const [selectedSampleId, setSelectedSampleId] = useState(SAMPLE_IMAGES[0].id);
  const [folderImages, setFolderImages] = useState([]);
  const [activeFolderIndex, setActiveFolderIndex] = useState(0);

  // Batch Processing State
  const [batchCurrentIndex, setBatchCurrentIndex] = useState(0);
  const [batchResults, setBatchResults] = useState({});
  const [showBatchSummaryModal, setShowBatchSummaryModal] = useState(false);

  // Drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const imageViewportRef = useRef(null);

  const [systemCheck, setSystemCheck] = useState(true)

    return (
        <div className="h-screen w-screen max-h-screen max-w-screen overflow-hidden bg-slate-100 flex flex-col md:flex-row box-border relative select-none">
            <Sidebar setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} currentImage={currentImage}
                     AVAILABLE_MODELS={AVAILABLE_MODELS} selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            />

          <main className="flex-1 min-w-0 relative">
            {
              systemCheck && (
                  <SystemCheck setSystemCheck={setSystemCheck}/>
              )
            }
          </main>

        </div>
    )
}
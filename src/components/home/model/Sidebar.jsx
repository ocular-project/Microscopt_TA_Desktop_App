import {
    ActivityIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    FileImageIcon,
    FolderOpenIcon,
    PanelLeftCloseIcon,
    FolderOpen,
    HardDrive,
    X,
    Laptop,
    ChevronRight,
} from "lucide-react";
import styles from "../css/sidebar.module.css";
import {useState} from "react";
import {selectImage} from "./utils.js";

export default function Sidebar({ sidebarOpen, setSidebarOpen, AVAILABLE_MODELS, selectedModel, setSelectedModel, currentImage, image, setIsSourceModalOpen }){

    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [error, setError] = useState(null)

    const getAssetPath = (relativePath) => {
      const isDev = process.env.NODE_ENV === 'development';

      return isDev ? `/${relativePath}` : `./${relativePath}`;
   };

    const toggleCategory = (category) => {
        setCollapsedCategories((prev) => ({
          ...prev,
          [category]: !prev[category]
        }));
    };

    const handleStartLoadFlow = () => {
        setIsSourceModalOpen(true);
    };

    return (
        <>
            <aside
                className={`${
                  sidebarOpen ? 'w-full md:w-80 lg:w-96' : 'w-0 md:w-0'
                } transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-full z-20 shrink-0 overflow-hidden shadow-sm`}
            >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <img src={getAssetPath('images/logo.png')}  alt="" className="w-[40px] h-[45px]" />
                    {/*<ActivityIcon className="w-4 h-4 text-[#F69220] animate-pulse" />*/}
                    <h2 className="font-semibold text-gray-900 text-sm tracking-wide">Model & Image Inspector</h2>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Close Sidebar"
                  >
                    <PanelLeftCloseIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 ">
                    <div className="space-y-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Load Image Source</h3>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleStartLoadFlow}
                                className="py-2.5 px-3 bg-[#F69220] hover:bg-[#e07f15] text-white border border-[#F69220] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                           >
                                <FileImageIcon className="w-4 h-4 text-white" /> Select File(s)
                           </button>
                           <button
                                // onClick={() => folderInputRef.current?.click()}
                                className="py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-white border border-gray-900 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                           >
                                <FolderOpenIcon className="w-4 h-4 text-[#F69220]" /> Load Folder
                           </button>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Disease Detection Models</h3>
                              <span className="text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                                3 Categories ({AVAILABLE_MODELS.length})
                              </span>
                            </div>

                            <div className="space-y-3 mt-4">
                                {
                                    ['Malaria', 'Tuberculosis', 'Cervical Cancer'].map((disease) => {
                                        const isCollapsed = !!collapsedCategories[disease];
                                        const diseaseModels = AVAILABLE_MODELS.filter(m => m.category === disease);

                                        return (
                                            <div key={disease} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all">
                                               <button
                                                  onClick={() => toggleCategory(disease)}
                                                  className="w-full text-left px-3 py-2 bg-gray-50/80 hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer select-none border-b border-gray-100"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    {isCollapsed ? (
                                                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                      <ChevronDownIcon className="w-4 h-4 text-[#F69220]" />
                                                    )}
                                                    <span className="text-xs font-bold text-gray-800">{disease}</span>
                                                  </div>
                                                  <span className="text-[10px] font-mono font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                                    {diseaseModels.length} models
                                                  </span>
                                                </button>

                                                {
                                                    !isCollapsed && (
                                                        <div className="p-2 space-y-2 bg-white">
                                                            {diseaseModels.map((model) => {
                                                              const isSelected = selectedModel.id === model.id;
                                                              return (
                                                                <button
                                                                  key={model.id}
                                                                  onClick={() => setSelectedModel(model)}
                                                                  className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                                                                    isSelected
                                                                      ? 'bg-[#FEF3E7]/60 border-[#F69220] shadow-2xs ring-1 ring-[#F69220]'
                                                                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                  }`}
                                                                >
                                                                  <div className="flex items-center justify-between mb-1">
                                                                    <span className={`text-xs font-semibold ${isSelected ? 'text-[#F69220]' : 'text-gray-900'}`}>
                                                                      {model.name}
                                                                    </span>
                                                                    <span className="text-[9px] font-medium bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded shrink-0 ml-1">
                                                                      {model.badge}
                                                                    </span>
                                                                  </div>
                                                                  <p className="text-[11px] text-gray-500 leading-snug line-clamp-2 mb-2">
                                                                    {model.description}
                                                                  </p>
                                                                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                                                                    <span>Accuracy: {model.accuracy}</span>
                                                                    <span className="capitalize">{model.category}</span>
                                                                  </div>
                                                                </button>
                                                              );
                                                            })}
                                                        </div>
                                                    )
                                                }

                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Image Metadata</h3>
                            {
                                currentImage ? (
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2.5 text-xs">
                              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                <span className="text-gray-500">File Name</span>
                                <span className="font-mono text-gray-900 font-medium truncate max-w-[160px]" title={currentImage?.metadata?.filename}>
                                  {currentImage?.metadata?.filename}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Dimensions</span>
                                <span className="font-mono text-gray-800">{currentImage?.metadata?.dimensions}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Aspect Ratio</span>
                                <span className="font-mono text-gray-800">{currentImage?.metadata?.aspectRatio}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">File Size</span>
                                <span className="font-mono text-gray-800">{currentImage?.metadata?.fileSize}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Format</span>
                                <span className="font-mono text-gray-800">{currentImage?.metadata?.format}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Source Path</span>
                                <span className="font-mono text-gray-800 truncate max-w-[140px]" title={currentImage?.metadata?.sourceUrl}>
                                  {currentImage?.metadata?.sourceUrl}
                                </span>
                              </div>
                            </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 text-center text-xs text-gray-400">
                                        No image selected. Please select an image from your computer or from the Teaching Aid file management system.
                                    </div>
                                )
                            }

                       </div>

                    </div>
                </div>

            </aside>

        </>

    )
}
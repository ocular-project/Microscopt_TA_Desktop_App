import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp, Clock, FileCode2,
    ImageIcon,
    Loader2,
    Pause,
    Play, RotateCw,
    UploadCloud,
    X, Ban
} from "lucide-react";
import {useEffect, useState} from "react";
import {handleMessage} from "../../../utils/repeating.js";
import {uploadImage} from "./utils.js";

const initialUploads = [
  {
    id: '1',
    imageName: 'Dataset_Sample_001.png',
    annotationName: 'Dataset_Sample_001_labels.json',
    imageSize: 4.2 * 1024 * 1024,
    annotationSize: 128 * 1024,
    stage: 'queued', // 'queued' | 'uploading_image' | 'uploading_annotation' | 'completed' | 'error' | 'paused'
    errorMsg: null,
  },
  {
    id: '2',
    name: 'Aerial_Drone_Scan_042.jpg',
    imageName: 'Aerial_Drone_Scan_042.jpg',
    annotationName: 'Aerial_Drone_Scan_042_bboxes.xml',
    imageSize: 8.7 * 1024 * 1024,
    annotationSize: 340 * 1024,
    stage: 'queued',
    errorMsg: null,
  },
  {
    id: '3',
    imageName: 'Medical_CT_Scan_Slice12.png',
    annotationName: 'Medical_CT_Scan_Slice12_masks.json',
    imageSize: 2.1 * 1024 * 1024,
    annotationSize: 85 * 1024,
    stage: 'queued',
    errorMsg: null,
  },
  {
    id: '4',
    imageName: 'Traffic_Camera_Frame_9021.jpeg',
    annotationName: 'Traffic_Camera_Frame_9021_objects.json',
    imageSize: 3.8 * 1024 * 1024,
    annotationSize: 210 * 1024,
    stage: 'queued',
    errorMsg: null,
  },
];

export default function Loader({ isClosed, setIsClosed, setSharedAction, setLoader, setCheckedIds, setMessage,
                                   checkedIds, sharedAction }){

    const [uploads, setUploads] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [imagesData, setImagesData] = useState(null)
    const [isPaused, setIsPaused] = useState(false);
    const [isWaitingToStart, setIsWaitingToStart] = useState(true);

    const formatBytes = (bytes, decimals = 1) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Overall Statistics
    const totalItems = uploads.length;
    const completedItems = uploads.filter((u) => u.stage === 'completed').length;
    const activeItem = uploads.find((u) => u.stage === 'uploading_image' || u.stage === 'uploading_annotation');
    const errorItem = uploads.find((u) => u.stage === 'image_error' || u.stage === 'annotation_error');
    const pausedItems = uploads.filter((u) => u.stage === 'paused').length;
    const isHalted = Boolean(errorItem);

    useEffect(() => {
        if (uploads.length === 0) return;

        // 1. All items completed with zero errors -> auto-close widget
        const allCompleted = uploads.every((u) => u.stage === 'completed');
        if (allCompleted) {
          const closeTimer = setTimeout(() => {
            setIsClosed(true);
          }, 1000);
          return () => clearTimeout(closeTimer);
        }

        // 2. Check if an error occurred
        const errorIdx = uploads.findIndex(
          (u) => u.stage === 'image_error' || u.stage === 'annotation_error'
        );

        if (errorIdx !== -1) {
          // If error happened on the FIRST item (and no items were completed before it)
          if (errorIdx === 0 && completedItems === 0) {
            setIsClosed(true);
            handleMessage(uploads[0].errorMsg, "error", setMessage)
          } else if (uploads.some((u) => u.stage !== 'image_error' && u.stage !== 'annotation_error')) {
            // Error happened after the first item: keep popup open & filter list to ONLY failed items
            setUploads((prev) =>
              prev.filter((u) => u.stage === 'image_error' || u.stage === 'annotation_error')
            );
          }
        }
    }, [uploads, completedItems]);

    useEffect(() => {
        setIsWaitingToStart(true);
        const startTimer = setTimeout(() => {
          setIsWaitingToStart(false);
        }, 1000);

        return () => clearTimeout(startTimer);
    }, []);

    useEffect(() => {
        if (isPaused || isClosed || isWaitingToStart || isHalted) return;

        const folderLookUp = new Map(
            imagesData.folders.map(item => [item._id, item])
        );

        const annoLookUp = new Map(
            imagesData.annotations.map(item => [item._id, item])
        );

        const imagesLookUp = new Map(
            imagesData.annotations.map(item => [item._id, item])
        );

        const interval = setInterval(() => {
          setUploads((prevUploads) => {
            // Double check if halted inside updater
            if (prevUploads.some((u) => u.stage === 'image_error' || u.stage === 'annotation_error')) {
              return prevUploads;
            }

            // Find current active item
            const activeIdx = prevUploads.findIndex(
              (item) => item.stage === 'uploading_image' || item.stage === 'uploading_annotation'
            );

            if (activeIdx !== -1) {
              return prevUploads.map((item, index) => {
                if (index === activeIdx) {
                  // STAGE 1: Image Upload Finishing
                  if (item.stage === 'uploading_image') {

                      uploadImage(item, folderLookUp, imagesData)
                    // const imageSucceeded = Math.random() > 0.2; // 80% chance image succeeds
                    // if (!imageSucceeded) {
                    //   return {
                    //     ...item,
                    //     stage: 'image_error',
                    //     errorMsg: 'Image upload failed (Network timeout). Queue halted.',
                    //   };
                    // }

                    // If image has NO annotations (annotationId === null), complete immediately!
                    if (!item.annotationId) {
                      return { ...item, stage: 'completed', errorMsg: null };
                    }

                    // Otherwise, proceed to upload annotations
                    return { ...item, stage: 'uploading_annotation' };
                  }

                  // STAGE 2: Annotation Upload Finishing (Image already succeeded)
                  if (item.stage === 'uploading_annotation') {
                    const annotationSucceeded = Math.random() > 0.35; // 65% chance annotation succeeds
                    if (annotationSucceeded) {
                      return { ...item, stage: 'completed', errorMsg: null };
                    } else {
                      return {
                        ...item,
                        stage: 'annotation_error',
                        errorMsg: 'Image uploaded, but annotation sync failed. Queue halted.',
                      };
                    }
                  }
                }
                return item;
              });
            } else {
              // If no active item, pick the next queued item to start with image upload
              const nextQueuedIdx = prevUploads.findIndex((item) => item.stage === 'queued');
              if (nextQueuedIdx !== -1) {
                return prevUploads.map((item, index) => {
                  if (index === nextQueuedIdx) {
                    return { ...item, stage: 'uploading_image' };
                  }
                  return item;
                });
              }
            }

            return prevUploads;
          });
        }, 500);

        return () => clearInterval(interval);
    }, [isPaused, isClosed, isWaitingToStart, isHalted]);

    // Header Title Text
    const getHeaderText = () => {
        if (isWaitingToStart) {
          return `Preparing ${totalItems} item${totalItems > 1 ? 's' : ''}...`;
        }
        if (isHalted) {
          return `Upload stopped (${completedItems}/${totalItems} completed)`;
        }
        if (completedItems === totalItems && totalItems > 0) {
          return `${totalItems} item${totalItems > 1 ? 's' : ''} uploaded`;
        }
        if (activeItem) {
          return `Uploading ${completedItems + 1} of ${totalItems}${activeItem.annotationId ? ' (with annotations)' : ''}`;
        }
        if (pausedItems > 0 && !activeItem) {
          return `Uploads paused (${completedItems}/${totalItems})`;
        }
        return `${completedItems} of ${totalItems} completed`;
    };

    const handleTogglePause = (id) => {
        setUploads((prev) =>
          prev.map((u) => {
            if (u.id === id) {
              const isUploading = u.stage.startsWith('uploading');
              return {
                ...u,
                stage: isUploading ? 'paused' : 'uploading_image',
              };
            }
            return u;
          })
        );
    };

    const handleRetry = (imageId) => {
        setUploads((prev) =>
          prev.map((u) => {
            if (u.imageId === imageId) {
              // If only annotation failed, resume directly from annotation step!
              const nextStage = u.stage === 'annotation_error' ? 'uploading_annotation' : 'uploading_image';
              return { ...u, stage: nextStage, errorMsg: null };
            }
            return u;
          })
        );
    };

    const handleRemove = (imageId) => {
        setUploads((prev) => prev.filter((u) => u.id !== imageId));
    };

    useEffect(() => {
        if(!isClosed) {
            handleFileTransfer()
        }
    }, [isClosed]);

    async function handleFileTransfer() {
        setLoader(true)

        try {
           const response = await window.electronAPI.transferFiles(checkedIds, "copy")
           if (!response.success){
               handleMessage(`Error: ${response.error}`, "error", setMessage)
               return
           }
           const data = response.data
           console.log(data)
            setImagesData(data)
           setUploads(data.uploads)
           // const formData = new FormData();
           // for (const image of data.images) {
           //     const buffer = image.buffer
           //     const blob = new Blob([buffer], { type: `image/${image.extension}` })
           //     formData.append('files', blob, image.name);
           // }
           // formData.append("folders", JSON.stringify(data.folders))
           // formData.append("annotations", JSON.stringify(data.annotations))
           //
           // // console.log([...formData.entries()]);
           //
           // const resp = await axiosInstance.post("desktop/files", formData)
           // // // console.log(resp.data)
           // handleMessage(resp.data.message, "success", setMessage)
           // // console.log(resp.data.files)
           // const resp2 = await window.electronAPI.updateFiles(resp.data.files)
           // if (!resp2.success){
           //     // console.log(resp2.error)
           //     handleMessage(resp2.error, "warning", setMessage)
           //     return
           // }
           // // await refreshQuota(setQuota, setMessage, setLoader)
           // await handleRefresh()
           // handleMessage("Folder/ File delete successfully", "success", setMessage)
           // const data = response.data
           // const buffer = data.buffer
           // // console.log(data)
           // const blob = new Blob([buffer], { type: data.mineType })
           //
           // // console.log(blob)
           //
           // const formData = new FormData();
           // formData.append('file', blob, data.name);
           // // console.log(formData.get('file'))
           //
           // const resp = await axiosInstance.post("desktop/files", formData)
           // handleMessage(resp.data.message, "success", setMessage)

       }
       catch (err) {
            if (err.response?.data?.error) {
                console.log(err.response.data.error)
                handleMessage(err.response.data.error, "error", setMessage);
                return;
            }
             console.log(err)
            handleMessage(`Error: ${err.message || err}`, "error", setMessage);
        }
       finally
       {
            setLoader(false)
           // setCheckedIds([])
       }
    }

    return (
        <div
          className="fixed bottom-2.5 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] bg-white rounded-t-xl border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.14)] transition-all duration-300 ease-in-out flex flex-col overflow-hidden"
        >
            {/* HEADER BAR */}
            <div
                className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between select-none shadow-sm cursor-pointer"
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {isWaitingToStart ? (
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                  ) : isHalted ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  ) : completedItems === totalItems && totalItems > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : activeItem ? (
                    <Loader2 className="w-4 h-4 text-[#F69220] animate-spin flex-shrink-0" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  )}

                  <span className="text-xs sm:text-sm truncate">
                    {getHeaderText()}
                  </span>
                </div>

                {/* Header Control Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!isWaitingToStart && !isHalted && (activeItem || pausedItems > 0) ? (
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      title={isPaused ? 'Resume uploads' : 'Pause uploads'}
                      className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                  ) : null}

                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    title={isMinimized ? 'Expand' : 'Minimize'}
                    className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setIsClosed(true)}
                    title="Close"
                    className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
            </div>

            {/* EXPANDED CONTENT DIALOG */}
            {!isMinimized && (
                <div className="flex flex-col bg-white max-h-[440px]">

                    {isHalted && (
                        <div className="bg-rose-50 border-b border-rose-200/80 px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-rose-700">
                          <div className="flex items-center gap-2 font-medium">
                            <Ban className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            <span>Queue stopped due to an upload failure.</span>
                          </div>
                          <button
                            onClick={() => handleRetry(errorItem.imageId)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-[11px] flex-shrink-0 transition-colors"
                          >
                            Retry & Resume
                          </button>
                        </div>
                    )}

                  {/* UPLOAD FILE PAIRS LIST */}
                    <div className="overflow-y-auto divide-y divide-slate-100 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {uploads.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <UploadCloud className="w-8 h-8 mx-auto stroke-1" />
                        <p className="text-xs">No active image pair uploads</p>
                      </div>
                    ) : (
                      uploads.map((item) => {
                        const hasAnnotation = Boolean(item.annotationId);
                        const isImageActive = item.stage === 'uploading_image';
                        const isAnnotationActive = item.stage === 'uploading_annotation';
                        const isDone = item.stage === 'completed';
                        const isImageErr = item.stage === 'image_error';
                        const isAnnotationErr = item.stage === 'annotation_error';
                        const isAnyErr = isImageErr || isAnnotationErr;
                        const isQueued = item.stage === 'queued';
                        const isPausedState = item.stage === 'paused';

                        return (
                          <div
                            key={item.imageId}
                            className={`p-3.5 transition-colors space-y-2.5 relative ${
                              isAnyErr ? 'bg-rose-50/40' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            {/* Top Line: Image Name & Overall Status Icon */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`p-1.5 rounded flex-shrink-0 ${
                                      isImageErr ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-primary'
                                }`}>
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className="text-xs font-semibold text-slate-800 truncate"
                                    title={item.imageName}
                                  >
                                    {item.imageName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono truncate">
                                    ID: {item.imageId}
                                  </div>
                                </div>
                              </div>

                              {/* Top Level Action / Status Indicator */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {isDone && (
                                  <CheckCircle2 className="w-4 h-4 text-[#F69220] stroke-[2.5]" />
                                )}
                                {isAnyErr && (
                                  <button
                                    onClick={() => handleRetry(item.imageId)}
                                    title={isAnnotationErr ? 'Retry annotation upload' : 'Retry image upload'}
                                    className="p-1 rounded hover:bg-slate-200 text-rose-600"
                                  >
                                    <RotateCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!isHalted && (isImageActive || isAnnotationActive || isPausedState) && (
                                  <button
                                    onClick={() => handleTogglePause(item.imageId)}
                                    title={isPausedState ? 'Resume' : 'Pause'}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-500"
                                  >
                                    {isPausedState ? (
                                      <Play className="w-3.5 h-3.5 text-[#F69220]" />
                                    ) : (
                                      <Pause className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                                {/*<button*/}
                                {/*  onClick={() => handleRemove(item.imageId)}*/}
                                {/*  title="Cancel upload"*/}
                                {/*  className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700"*/}
                                {/*>*/}
                                {/*  <X className="w-3.5 h-3.5" />*/}
                                {/*</button>*/}
                              </div>
                            </div>

                            {/* STEP 1: IMAGE UPLOAD STATUS STAGE */}
                            <div className="pl-6 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2 text-slate-600">
                                <span className="font-medium">1. Image file</span>
                                <span className="text-slate-400">({formatBytes(item.imageSize)})</span>
                              </div>

                              <div>
                                {isDone || isAnnotationActive || isAnnotationErr ? (
                                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Uploaded
                                  </span>
                                ) : isImageActive ? (
                                  <span className="text-[#F69220] font-semibold flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading image...
                                  </span>
                                ) : isPausedState ? (
                                  <span className="text-amber-600 font-medium">Paused</span>
                                ) : isImageErr ? (
                                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Failed
                                  </span>
                                ) : isQueued && isHalted ? (
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Ban className="w-3 h-3 text-rose-400" /> Stopped
                                  </span>
                                ) : (
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Waiting
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* STEP 2: ANNOTATION FILE UPLOAD STAGE */}
                              {
                                  hasAnnotation ? (
                                      <div className="pl-6 flex items-center justify-between text-[11px]">
                                          <div className="flex items-center gap-1.5 text-slate-600 min-w-0 pr-2">
                                              <FileCode2 className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                              <span className="font-medium flex-shrink-0">2. Annotation</span>
                                              <span className="text-slate-400 font-mono text-[10px] truncate" title={item.annotationId}>
                                                ({item.annotationId.slice(-6)})
                                              </span>
                                          </div>

                                          <div>
                                            {isDone ? (
                                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Uploaded
                                              </span>
                                            ) : isAnnotationActive ? (
                                              <span className="text-[#F69220] font-semibold flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Uploading annotation...
                                              </span>
                                            ) : isImageActive ? (
                                              <span className="text-slate-400 flex items-center gap-1">
                                                Next step
                                              </span>
                                            ) : isAnnotationErr ? (
                                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                                  <AlertCircle className="w-3 h-3" /> Failed
                                              </span>
                                            ) : isImageErr ? (
                                                <span className="text-slate-400 flex items-center gap-1">
                                                  Skipped
                                                </span>
                                            ) : isQueued && isHalted ? (
                                                <span className="text-slate-400 flex items-center gap-1">
                                                  <Ban className="w-3 h-3 text-rose-400" /> Stopped
                                                </span>
                                            ) : (
                                              <span className="text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Waiting
                                              </span>
                                            )}
                                          </div>
                                      </div>
                                  ) : (
                                    <div className="pl-7 flex items-center justify-between text-[11px]">
                                        <span className="text-slate-400 italic">No annotations attached</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                                          Image only
                                        </span>
                                   </div>
                                  )
                              }

                            {/* Error message detail if applicable */}
                            {isAnyErr && item.errorMsg && (
                              <div className="pl-6 text-[11px] text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{item.errorMsg}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
            )}

        </div>
    )
}
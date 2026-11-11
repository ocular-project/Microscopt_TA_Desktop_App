import style from "../css/sidebar.module.css";
import styles from "./css/image.module.css";
import {
    IoArrowBackOutline,
    IoCloseCircleOutline, IoCloudDownloadOutline, IoCloudUploadOutline,
    IoSaveOutline,
    IoSettingsOutline,
    IoShareSocialOutline
} from "react-icons/io5";
import {LuRectangleHorizontal, LuUser} from "react-icons/lu";
import {PiCursor} from "react-icons/pi";
import {FaRegUser} from "react-icons/fa6";
import {useEffect, useRef, useState} from "react";
import {GoZoomIn, GoZoomOut} from "react-icons/go";
import {TbZoomReset} from "react-icons/tb";
import {IoIosArrowRoundBack} from "react-icons/io";
import {useNavigate, useParams} from "react-router-dom";
import {handleBack, handleMessage} from "../../utils/repeating.js";
import axiosInstance from "../../utils/files/axiosInstance.js";
import Annotators from "./Annotators.jsx";
import {RiFeedbackLine, RiFileEditLine} from "react-icons/ri";
import { configg } from "../../utils/files/config.js";
import {FaRegFileAlt} from "react-icons/fa";
import {RxFilePlus} from "react-icons/rx";
import {handleUploading} from "../../utils/files/RepeatingFiles.jsx";
import Labels from "./Labels.jsx";

export default function OtherSidebar({ setZoom, fitImageToViewport, ZOOM_STEP, setAnnotations, annotations, setLoader, setInstruct, instructions,
                                     setMessage, file, msg, annotators, cred, setMsg, setShare, setAccess, other, setOther, setSelected, selected,
                                     setFeed, setVisual, visual, setIsClosed, width, annotator, setAnnotator, setBack, back, feedback, setFeedback,
                                         setLabel, setLabels, cat, setInstructions, label, labels, filename, setFilename }) {

    // const [tool, setTool] = useState("box")
    // const [back, setBack] = useState(false)

    const navigate = useNavigate()
    const [button, setButton] = useState({ save: false, edit: false, share: false, load: false, finalShare: false, feed: false })
    const { fileId } = useParams();
    // const [annotator, setAnnotator] = useState({ owner: "", annoId: "" })

    const [isOpen, setIsOpen] = useState({ image: false, sync: false, storage: false, annotations: false, tool: true });
     const fileInputRef = useRef(null);
    // const [filename, setFilename] = useState("")

    const [labelFile, setLabelFile] = useState("")

    const getAssetPath = (relativePath) => {
      const isDev = process.env.NODE_ENV === 'development';

      return isDev ? `/${relativePath}` : `./${relativePath}`;
    };

   function handleBack() {
       let folder = localStorage.getItem("folder")
       console.log(folder)
       if (folder) {
           folder = JSON.parse(folder)
           localStorage.removeItem("folder");
           if (folder.folderId) {
               console.log(`${folder.path}/${folder.folderId}`)
               navigate(`${folder.path}/${folder.folderId}`)
           }
           else {
               console.log(`${folder.path}/${folder.folderId}`)
              navigate(folder.path)
           }
       }
       else {
           localStorage.removeItem("folder");
           navigate("/")
       }
   }

    useEffect(() => {
        if (other) {
            if(annotations && !!annotations.length && hasFeedback()) {
                setButton({...button, feed: true})
            }
            else {
                setButton({...button, feed: false})
            }
        }else {
             if (!!annotations.length) {
                setButton({...button, save: true, edit: true, share: true})
             }
             else {
                setButton({...button, save: false, edit: false, share: false})
             }
        }

    }, [annotations]);

    const hasFeedback = () => {
        return annotations.some(annotation => {
            const hasFeedbackValue = annotation?.feedback && annotation.feedback.trim() !== "";
            const isAnnotationOwner = annotation?.owner === cred._id;

            return hasFeedbackValue || isAnnotationOwner;
        });
    };

    async function handleDownload() {
        setLoader(true)
        try {
            const response = await axiosInstance.get(`desktop/download_annotations/${file._id}`)
            const data = response.data
            if (!data.object.annotations.length && !data.object.feedback.length){
                handleMessage("There are no annotations to download", "warning", setMessage);
                return
            }

            // console.log(data)
            const resp = await window.electronAPI.downloadImageAnnotations(data, cred)
            // console.log(response.data)
            if (resp.success) {
                handleMessage(resp.message, "success", setMessage);
                // navigate(`/annotation/computer/${fileId}`)
                const response2 = await axiosInstance.get(`/file-instructions/${file._id}`)
                // console.log(response2)
                const resp2 = await window.electronAPI.saveInstructions(response2.data.file)
                // console.log(resp2)
                if (!resp.success) {
                    handleMessage(resp2.message, "error", setMessage);
                    return
                }
                window.location.reload();

            }
            else {
                handleMessage(resp.error, "error", setMessage);
            }
        }
        catch (error) {
            console.log(error)
            handleMessage(`Error: ${error.response?.data?.error || error}`, "error", setMessage);
        }
        finally {
            setLoader(false)
        }
    }

    async function handleUpload() {
        await handleUploading(setLoader, fileId, setMessage, navigate)
    }

    function handleChange(name, bool) {
        setIsOpen(prev =>({...prev, [name]: bool}))
    }

    function handleClose() {
        if (width <= 768){
           setIsClosed(true)
        }
    }

    function handleLabelLoad() {
        setLoader(true)
        fileInputRef.current.click();

        const handleFocus = () => {
            window.removeEventListener('focus', handleFocus);

            // Give a slight delay to check if a file was actually chosen.
            // If fileInputRef.current.files.length is 0, they clicked Cancel!
            setTimeout(() => {
                if (fileInputRef.current && fileInputRef.current.files.length === 0) {
                    setLoader(false);
                }
            }, 300);
        };

        window.addEventListener('focus', handleFocus);
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) {
            setLoader(false);
            return;
        }

        // console.log(file)
        const reader = new FileReader();
        reader.onload = (e) => {
          setLoader(false);
          try {
            const data = JSON.parse(e.target.result);

            // Check if it's an array of strings
            if (Array.isArray(data) && data.every(item => typeof item === "string")) {
              const baseFile =   file.name.split(".").slice(0, -1).join(".")
              setLabelFile(file.name)
              setFilename(baseFile)
              setLabels(data)
              handleMessage("Labels loaded successfully", "success", setMessage)
              // Do something with the data
            } else {
                handleMessage("The json file loaded doesn't have valid labels, Please click Create Labels to generate the correct labels", "error", setMessage)
            }

          } catch (err) {
                handleMessage("Failed to load the json file, Please click Create Labels to generate the correct labels", "error", setMessage)
          }
        };

        reader.onerror = () => {
              setLoader(false);
              handleMessage("Failed to read the file", "error", setMessage);
        };

        reader.readAsText(file);
    };

    const handleFileCancel = () => {
        setLoader(false);
    };

    function handleLabelCreate() {
         setLabels([''])
        setLabelFile("")
        setLabel(true)
    }

    function handleEditLabels() {
        // console.log(filename)
        setLabel(true)
    }

    function handleLabelsDelete() {
        setLabelFile("")
        setLabels([''])
    }

    // useEffect(() => {
    //     console.log(file)
    // }, [file]);

    // useEffect(() => {
    //     console.log(file)
    // }, [file]);


    return (
        <>
            <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-white">
                 <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden">
                            <img
                                src={getAssetPath("images/logo.png")}
                                alt="Ocular logo"
                                className="h-full w-full object-contain p-1"
                            />
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-base font-bold text-slate-800">
                                Ocular's
                            </h1>

                            <p className="truncate text-xs font-medium text-slate-500">
                                Microscopy Teaching Aid
                            </p>
                        </div>
                    </div>
                 </div>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                        <div
                            className="flex cursor-pointer items-center justify-between px-4 py-3 transition hover:bg-slate-50"
                            onClick={() => handleChange("image", !isOpen.image)}
                        >
                            <h3 className="text-sm font-semibold text-slate-700">
                                Image Information
                            </h3>

                            <span className={`text-xs text-slate-400 transition-transform ${
                                isOpen.image ? "rotate-180" : ""
                            }`}>
                                ▼
                            </span>
                        </div>

                        {isOpen.image && (
                            <div className="space-y-3 border-t border-slate-200 p-4">
                                <div className={styles.labels}>
                                   <p>Name:</p>
                                    <p className={styles.even}>{file?.name}</p>
                               </div>
                               <div className={styles.labels}>
                                    <p>File Size:</p>
                                    <p className={styles.even}>{file?.size}</p>
                               </div>
                               <div className={styles.labels}>
                                   <p>Owner:</p>
                                   <p className={styles.even}>
                                       {
                                           cred?._id === file?.owner?._id ? (
                                               "Me"
                                           ) : (
                                               `${file?.owner?.firstName ?? ""} ${file?.owner?.lastName ?? ""}`
                                           )
                                       }
                                   </p>
                               </div>
                            </div>
                        )}

                    </div>
                    {
                        (cat === "computer" && file?.isOnline) && (
                             <div className="border border-slate-200 bg-white rounded-xl space-y-4 p-3">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Data Synchronisation
                                </h3>
                                <div className="border-t pt-4 border-slate-200 grid grid-cols-2 gap-2">
                                    <div className={`${styles.buttons} ${styles.active}`} onClick={handleDownload}>
                                        <span>Download Latest Changes</span>
                                    </div>
                                    {/*<div className={`${styles.buttons}`} onClick={handleUpload}>*/}
                                    {/*    <span>Upload Changes</span>*/}
                                    {/*</div>*/}
                                </div>
                            </div>
                        )
                    }
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setVisual("box")}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                                visual === "box"
                                    ? "border-none bg-[#FEF3E7] text-primary"
                                    : "border-slate-200 text-slate-600 hover:border-secondary hover:bg-slate-50"
                            }`}
                        >
                            <LuRectangleHorizontal className="text-xl" />
                            Bounding Box
                        </button>

                        <button
                            type="button"
                            onClick={() => setVisual("pointer")}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                                visual === "pointer"
                                    ? "border-none bg-[#FEF3E7] text-primary"
                                    : "border-slate-200 text-slate-600 hover:border-secondary hover:bg-slate-50"
                            }`}
                        >
                            <PiCursor className="text-xl" />
                            Pointer
                        </button>

                    </div>
                    <div className="border border-slate-200 bg-white rounded-xl space-y-4 p-3">
                        <h3 className="text-sm font-semibold text-slate-700">
                            Annotation Labels
                        </h3>
                        <div className="border-t pt-4 border-slate-200 grid grid-cols-2 gap-2">
                            {
                                !labelFile ? (
                                    <button
                                        // type="button"
                                        onClick={handleLabelLoad}
                                        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition"
                                    >
                                        <input type="file" id="fileInput" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange}/>
                                        Load labels
                                    </button>
                                ) : (
                                    <button
                                        // type="button"
                                        // onClick={handleLabelLoad}
                                        onClick={handleEditLabels}
                                        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition"
                                    >
                                        <input type="file" id="fileInput" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} onCancel={handleFileCancel}/>
                                        Edit/ Update Labels
                                    </button>
                                )
                            }

                            <button
                                type="button"
                                onClick={handleLabelCreate}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition"
                            >
                                Create labels
                            </button>
                        </div>
                        {
                           labelFile && (
                               <div className="space-y-2">
                                   <p className="text-slate-400 text-center text-sm italic">Label file: {labelFile}</p>
                                   <div className="mt-2 cursor-pointer border border-red-200 rounded-lg px-3 py-2 text-center text-xs font-semibold text-red-600 transition hover:text-white hover:bg-red-600"
                                        onClick={handleLabelsDelete}>
                                        {/*<BiUpload />*/}
                                        <span>Remove labels</span>
                                   </div>
                               </div>

                           )
                       }
                    </div>
                    {
                        cat === "computer" ? (
                           <>
                               {
                                   instructions && (
                                       <>
                                           <p>Instructions</p>
                                           <div className={`${styles.buttons}`} onClick={() => setInstruct(true)}>
                                                <FaRegFileAlt />
                                                <span>View Instructions</span>
                                          </div>
                                       </>
                                   )
                               }
                           </>
                       ) : (
                         <div className="border border-slate-200 bg-white rounded-xl space-y-4 p-3">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Instructions
                                </h3>

                                <div className="border-t pt-4 border-slate-200 grid grid-cols-2 gap-2">
                                    {
                                       cred?._id === file?.owner?._id ? (
                                           <>
                                               {
                                                   instructions ? (
                                                       <>
                                                            <div className={`${styles.buttons}`} onClick={() => setInstruct(true)}>
                                                                <RiFileEditLine />
                                                                <span>Edit Instructions</span>
                                                          </div>
                                                          <div className={`${styles.buttons}`} onClick={() => setInstruct(true)}>
                                                                <FaRegFileAlt />
                                                                <span>View Instructions</span>
                                                          </div>
                                                       </>
                                                   ) : (
                                                      <div className={`${styles.buttons}`} onClick={() => setInstruct(true)}>
                                                            <RxFilePlus />
                                                            <span>Add Instructions</span>
                                                      </div>
                                                   )
                                               }
                                           </>

                                       ) : (
                                           <>
                                               {
                                                   instructions && (
                                                       <div className={`${styles.buttons}`} onClick={() => setInstruct(true)}>
                                                            <FaRegFileAlt />
                                                            <span>View Instructions</span>
                                                      </div>
                                                   )
                                               }
                                           </>

                                       )
                                   }
                                </div>

                        </div>
                      )
                    }

                     {
                        !!annotators?.length && (
                            <Annotators annotators={annotators} setAnnotations={setAnnotations} cred={cred} setLoader={setLoader}
                                        setMessage={setMessage} setMsg={setMsg} setAccess={setAccess} setOther={setOther} feedback={feedback} setFeedback={setFeedback}
                                        setAnnotator={setAnnotator} setFeed={setFeed} setBack={setBack} isOpen={isOpen} cat={cat}
                                        setIsOpen={setIsOpen} handleChange={handleChange} selected={selected} setSelected={setSelected}
                            />
                        )
                    }
                </div>
            </div>

            {
                label && (
                    <Labels setLabel={setLabel} setMessage={setMessage} labels={labels} setLabels={setLabels} setFilename={setFilename} filename={filename}/>
                )
            }
        </>
    )
}
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

export default function OtherSidebar({ setZoom, fitImageToViewport, ZOOM_STEP, setAnnotations, annotations, setLoader, setInstruct, instructions,
                                     setMessage, file, msg, annotators, cred, setMsg, setShare, setAccess, other, setOther, setSelected, selected,
                                     setFeed, setVisual, visual, setIsClosed, width, annotator, setAnnotator, setBack, back, feedback, setFeedback,
                                         setLabel, setLabels, cat }) {

    // const [tool, setTool] = useState("box")
    // const [back, setBack] = useState(false)

    const navigate = useNavigate()
    const [button, setButton] = useState({ save: false, edit: false, share: false, load: false, finalShare: false, feed: false })
    const { fileId } = useParams();
    // const [annotator, setAnnotator] = useState({ owner: "", annoId: "" })

    const [isOpen, setIsOpen] = useState({ image: false, sync: false, storage: false, annotations: false, tool: true });
     const fileInputRef = useRef(null);
    const [filename, setFilename] = useState("")

    const getAssetPath = (relativePath) => {
      const isDev = process.env.NODE_ENV === 'development';

      return isDev ? `/${relativePath}` : `../${relativePath}`;
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
            const resp = await window.electronAPI.downloadImageAnnotations(data)
            // console.log(response.data)
            if (resp.success) {
                handleMessage(resp.message, "success", setMessage);
                // navigate(`/annotation/computer/${fileId}`)
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
        setLoader(true)
        try {
            const response = await window.electronAPI.getAllAnnotations(fileId)

            const data = response.data
            if (!data.annotations.length && !data.feedback.length){
                handleMessage("There are no annotations or annotation feedback to upload", "warning", setMessage);
                return
            }

            if (!response.success){
                console.log(response.error)
                handleMessage(`Error: ${response.error}`, "error", setMessage);
            }
            const obj = {
                imageId: fileId,
                annotations: data.annotations,
                feedback: data.feedback
            }

            // console.log(obj)
            const expressResponse = await axiosInstance.post('desktop/uploadAllAnnotations', obj)
            handleMessage(expressResponse.data.message, "success", setMessage);
            setTimeout(() => {
                handleBack()
            }, 500)
        }catch (error) {
            console.log(error)
            handleMessage(`Error: ${error.response?.data?.error || error}`, "error", setMessage);
        }finally {
            setLoader(false)
        }
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
        fileInputRef.current.click();
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // console.log(file)
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);

            // Check if it's an array of strings
            if (Array.isArray(data) && data.every(item => typeof item === "string")) {
              setFilename(file.name)
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

        reader.readAsText(file);
    };

    function handleLabelCreate() {
        setLabels([''])
        setFilename("")
        setLabel(true)
    }

    function handleLabelsDelete() {
        setFilename("")
        setLabels([''])
    }

    return (
        <div className={style.container}>
             <div className={style.header}>
                <div className={style.imgDiv}>
                    <img src={getAssetPath('images/logo.png')}  alt="" className={style.img} />
                </div>

                <div className={style.textDiv}>
                    <h1>Ocular's</h1>
                    <p>Microscopy Teaching Aid</p>
                </div>
            </div>
            <div className={style.list}>
                <div className={styles.info}>

                    <div className={styles.backDiv}>
                        <p>{msg}</p>
                        <div className={styles.back} onClick={() => handleBack()}>
                           <IoArrowBackOutline />
                           <span>Back</span>
                        </div>
                    </div>

                   <div className={styles.imgInfo}>
                       <div className={styles.header} onClick={() => handleChange("image", !isOpen.image)}>
                           <h3 className={styles.title}>Image Information</h3>
                           <span className={`${isOpen.image ? styles.open : ''} ${styles.icon}`}>▼</span>
                       </div>
                       <div className={`${isOpen.image ? styles.open : ''} ${styles.content}`}>
                           <div className={styles.labels}>
                               <p>Name:</p>
                                <p className={styles.even}>{file?.name}</p>
                           </div>
                           <div className={styles.labels}>
                                <p>File Size</p>
                                <p className={styles.even}>{file?.size}</p>
                           </div>
                           <div className={styles.labels}>
                               <p>Owner</p>
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

                   </div>

                    {
                        (cat === "computer" && file?.isOnline) && (
                            <div className={styles.imgInfo}>
                                <div className={styles.header} onClick={() => handleChange("sync", !isOpen.sync)}>
                                   <h3 className={styles.title}>Data Synchronisation</h3>
                                   <span className={`${isOpen.sync ? styles.open : ''} ${styles.icon}`}>▼</span>
                                </div>
                                <div className={`${isOpen.sync ? styles.open : ''} ${styles.content}`}>
                                   <div className={`${styles.toolDiv}`}>
                                        <div className={`${styles.buttons} ${styles.active}`} onClick={handleDownload}>
                                            <span>Download Latest Annotations</span>
                                        </div>
                                        <div className={`${styles.buttons}`} onClick={handleUpload}>
                                            <span>Upload Annotation Changes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    <div className={styles.imgInfo}>
                       <div className={styles.header} onClick={() => handleChange("tool", !isOpen.tool)}>
                           <h3 className={styles.title}>Annotation Tools</h3>
                           <span className={`${isOpen.tool ? styles.open : ''} ${styles.icon}`}>▼</span>
                       </div>
                       <div className={`${isOpen.tool ? styles.open : ''} ${styles.content}`}>
                            {/*<p>Annotation Mode </p>*/}
                            <div className={`${styles.toolDiv}`}>
                               <div className={`${styles.tool} ${visual === 'box' ? styles.active : ""}`} onClick={() => setVisual("box")}>
                                   <LuRectangleHorizontal />
                                   <p>Bounding Box</p>
                               </div>
                               <div className={`${styles.tool} ${visual === 'pointer' ? styles.active : ""}`} onClick={() => setVisual("pointer")}>
                                   <PiCursor />
                                   <p>Pointer</p>
                               </div>
                            </div>

                           <hr/>
                           <p>Annotation Labels</p>
                           <div>
                               <div className="flex gap-2 justify-between">
                                   <div className={`${styles.buttons} ${styles.active} w-full`} onClick={() => handleLabelLoad()}>
                                        {/*<BiUpload />*/}
                                        <span>Load labels</span>
                                        <input type="file" id="fileInput" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange}/>
                                   </div>
                                   <div className={`${styles.buttons} w-full`} onClick={() => handleLabelCreate()}>
                                        {/*<IoCreateOutline />*/}
                                        <span>Create labels</span>
                                   </div>
                               </div>
                               {
                                   filename && (
                                       <>
                                           <p className="text-slate-400 italic">Label file: {filename}</p>
                                           <div className={`${styles.buttonsDelete} w-full`} onClick={handleLabelsDelete}>
                                                {/*<BiUpload />*/}
                                                <span>Remove labels</span>
                                           </div>
                                       </>

                                   )
                               }

                           </div>

                           <hr/>

                           <div>
                               {
                                   cred?._id === file?.owner?._id ? (
                                       <>
                                           {
                                               instructions ? (
                                                   <>
                                                       <p>Instructions</p>
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
                                                   <>
                                                       <p>Instructions</p>
                                                        <div className={`${styles.buttons}`} onClick={() => setInstruct(true)}>
                                                            <RxFilePlus />
                                                            <span>Add Instructions</span>
                                                        </div>
                                                   </>

                                               )
                                           }
                                       </>

                                   ) : (
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

                                   )
                               }

                           </div>


                       </div>
                   </div>

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
        </div>
    )
}
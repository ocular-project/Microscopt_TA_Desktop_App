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
import {useEffect, useState} from "react";
import {GoZoomIn, GoZoomOut} from "react-icons/go";
import {TbZoomReset} from "react-icons/tb";
import {IoIosArrowRoundBack} from "react-icons/io";
import {useNavigate, useParams} from "react-router-dom";
import {handleBack, handleMessage} from "../../utils/repeating.js";
import axiosInstance from "../../utils/files/axiosInstance.js";
import Annotators from "./Annotators.jsx";
import {RiFeedbackLine} from "react-icons/ri";
import { configg } from "../../utils/files/config.js";

export default function OtherSidebar({ setZoom, fitImageToViewport, ZOOM_STEP, setAnnotations, annotations, setLoader,
                                     setMessage, file, msg, annotators, cred, setMsg, setShare, setAccess, other, setOther,
                                     setFeed, setVisual, visual, cat }) {

    const [tool, setTool] = useState("box")
    const [back, setBack] = useState(false)

    const navigate = useNavigate()
    const [button, setButton] = useState({ save: false, edit: false, share: false, load: false, finalShare: false, feed: false })
    const { fileId } = useParams();
    const [annotator, setAnnotator] = useState({ owner: "", annoId: "" })

    const getAssetPath = (relativePath) => {
      const isDev = process.env.NODE_ENV === 'development';

      return isDev ? `/${relativePath}` : `./${relativePath}`;
    };

    async function handleSave() {
        // console.log(annotations)
       if (!!annotations.length && fileId) {
           setLoader(true)
           const obj = {
               annotations,
               imageId: fileId,
           }
           try {
               if (cat === "computer") {
                   // console.log(cred)
                   const response = await window.electronAPI.saveAnnotation(obj, cred)
                   if(!response.success){
                       handleMessage(response.error, "error", setMessage)
                       return
                   }
               }
               else {
                   await axiosInstance.post('/save-annotations', obj)
               }
               handleBack()
           }catch (err) {
               console.log(err.response)
               const error = err.response.data.error
               handleMessage(error, "error", setMessage)
           }finally {
               setLoader(false)
           }
       }
       else if (!fileId) {
           handleMessage("Image has no ID.", "warning", setMessage)
       }
       else {
           handleMessage("Add some annotations to the image before you can save.", "warning", setMessage)
       }
    }

    async function handleSave2() {
        console.log(annotator.owner)
        console.log(annotator.annoId)
        const isAnnotatorValid = annotator.owner !== "" && annotator.annoId !== "";
        console.log(annotations)
        console.log(fileId)
        console.log(hasFeedback())
        console.log(isAnnotatorValid)
        if (!!annotations.length && fileId && hasFeedback() && isAnnotatorValid) {
           setLoader(true)
           const obj = {
               annotations,
               imageId: fileId,
               annotator
           }
           try {
               let response
               if (cat === "computer") {
                   response = await window.electronAPI.saveFeedback(obj, cred)
                   if(!response.success) {
                       console.log(response.error)
                       handleMessage(response.error, "error", setMessage)
                       return
                   }
                   handleMessage(response.message, "success", setMessage)
               }
               else {
                   response = await axiosInstance.post(`/save-feedback/`, obj)
                   handleMessage(response.data.message, "success", setMessage)
               }
               handleBack()
           }catch (err) {
               console.log(err)
               const error = err.response.data.error
               handleMessage(error, "error", setMessage)
           }finally {
               setLoader(false)
           }
       }
       else if (!annotator) {
           handleMessage("Annotator ID not obtained.", "warning", setMessage)
       }
       else if (!fileId) {
           handleMessage("Image has no ID.", "warning", setMessage)
       }
       else if(annotations.length === 0) {
           handleMessage("Add some annotations to the image or provide before you save.", "warning", setMessage)
       }
       else {
           handleMessage("Provide feedback to some or all of the available annotations before you save .", "warning", setMessage)
        }
    }

    function handleShare(){
        setShare(true)
    }

   function handleBack() {
        let folder = localStorage.getItem("folder")
       // console.log(folder)
       if (folder) {
           folder = JSON.parse(folder)
           localStorage.removeItem("folder");
           if (folder.folderId) {
               navigate(`${folder.path}/${folder.folderId}`)
           }
           else {
              navigate(folder.path)
           }
       }
       else {
           localStorage.removeItem("folder");
           navigate("/")
       }
   }

     const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, 5));
     const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, 0.1));
     const resetZoom = () => fitImageToViewport();

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
            const resp = await window.electronAPI.downloadImageAnnotations(response.data)
            // console.log(response.data)
            if (resp.success) {
                handleMessage(resp.message, "success", setMessage);
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
            if (!response.success){
                console.log(response.error)
                handleMessage(`Error: ${response.error}`, "error", setMessage);
            }
            const obj = {
                imageId: fileId,
                annotations: response.annotations,
                feedback: response.feedbacks
            }
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
                       <div className={styles.closeDiv}>
                           <h1>Image Information</h1>
                           {/*<IoCloseCircleOutline className={styles.close} onClick={handleClose} />*/}
                       </div>
                       <div>
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
                        cat === "computer" && (
                            <div className={styles.imgInfo}>
                                <h1>Data Synchronisation</h1>
                                <div className={`${styles.toolDiv}`}>
                                    <div className={`${styles.buttons} ${styles.active}`} onClick={handleDownload}>
                                        <span>Download Latest Annotations</span>
                                    </div>
                                    <div className={`${styles.buttons}`} onClick={handleUpload}>
                                        <span>Upload Annotation Changes</span>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        !!annotators?.length && (
                            <Annotators annotators={annotators} setAnnotations={setAnnotations} cred={cred} setLoader={setLoader}
                                        setMessage={setMessage} setMsg={setMsg} setAccess={setAccess} setOther={setOther}
                                        setAnnotator={setAnnotator} setFeed={setFeed} setBack={setBack} cat={cat}
                            />
                        )
                    }

                   <div className={styles.imgInfo}>
                       <h1>Annotation Tools</h1>
                       <p>Annotation Mode </p>
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

                       <p>Zoom</p>
                       <div className={`${styles.toolDiv}`}>
                            <div className={`${styles.buttons}`} onClick={zoomOut}>
                                <GoZoomOut />
                                <span>Zoom out</span>
                            </div>
                            <div className={`${styles.buttons}`} onClick={zoomIn}>
                                <GoZoomIn />
                                <span>Zoom In</span>
                            </div>
                       </div>
                       <div className={`${styles.buttons} ${styles.active}`} onClick={resetZoom}>
                            <TbZoomReset />
                            <span>Reset</span>
                        </div>

                       {
                           !back && (
                               <>
                                   <hr/>
                                   <p>Actions</p>
                                   <div>
                                       {
                                           other ? (
                                               <div className={`${styles.buttons} ${button.feed ? styles.active : styles.disabled}`} onClick={handleSave2}>
                                                    <RiFeedbackLine />
                                                    <span>Save Feedback</span>
                                                </div>
                                           ) : (
                                               cat === "computer" ? (
                                                  <>
                                                      <div className={`${styles.buttons} ${button.save ? styles.active : styles.disabled}`} onClick={handleSave}>
                                                            <IoSaveOutline />
                                                            <span>Save Annotations Locally</span>
                                                      </div>
                                                  </>
                                               ) : (
                                                   <>
                                                       <div className={`${styles.buttons} ${button.save ? styles.active : styles.disabled}`} onClick={handleSave}>
                                                            <IoSaveOutline />
                                                            <span>Save Annotations</span>
                                                       </div>
                                                       <div className={`${styles.buttons} ${button.edit ? "" : styles.disabledOutline}`} onClick={handleShare}>
                                                            <IoSettingsOutline />
                                                            <span>Edit Access</span>
                                                        </div>
                                                       <div className={`${styles.buttons} ${button.share ? "" : styles.disabledOutline}`} onClick={handleShare}>
                                                            <IoShareSocialOutline />
                                                            <span>Share Annotations</span>
                                                       </div>
                                                   </>
                                               )
                                           )
                                       }
                                   </div>
                               </>
                           )
                       }

                   </div>

               </div>
            </div>
        </div>
    )
}
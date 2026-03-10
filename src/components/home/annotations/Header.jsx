import styles from "../../css/annotation.module.css";
import {BsLayoutSidebar} from "react-icons/bs";
import {GoZoomIn, GoZoomOut} from "react-icons/go";
import React, {useEffect, useState} from "react";
import {TbZoomReset} from "react-icons/tb";
import {IoSaveOutline, IoSettingsOutline, IoShareSocialOutline} from "react-icons/io5";
import axiosInstance from "../../utils/files/axiosInstance.js";
import {handleBack, handleMessage} from "../../utils/repeating.js";
import {RiFeedbackLine} from "react-icons/ri";
import {useNavigate, useParams} from "react-router-dom";

export default function Header({ setIsClosed, width, setZoom, fitImageToViewport, ZOOM_STEP, other, setShare, back,
                                   setLoader, setAnnotations, annotations, annotators, setMessage, cred, annotator, cat }){

    const [button, setButton] = useState({ save: false, edit: false, share: false, load: false, finalShare: false, feed: false })
     const navigate = useNavigate()
    const { fileId } = useParams();
    // const [annotator, setAnnotator] = useState({ owner: "", annoId: "" })

    useEffect(() => {
        if (other) {
            if(!!annotations.length && hasFeedback()) {
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

    async function handleSave() {
        // console.log(annotations)
       if (!!annotations.length && fileId) {
           setLoader(true)
           const obj = {
               annotations,
               imageId: fileId,
           }
           try {
               await axiosInstance.post('/save-annotations', obj)
               handleMessage("Image annotations have been saved", "success", setMessage)
               setTimeout(() => {
                   handleBack(navigate)
               }, 2000)
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
        const isAnnotatorValid = annotator.owner !== "" && annotator.annoId !== "";
        if (!!annotations.length && fileId && hasFeedback() && isAnnotatorValid) {
           setLoader(true)
           const obj = {
               annotations,
               imageId: fileId,
               annotator
           }
           try {
               await axiosInstance.post(`/save-feedback/`, obj)
                handleMessage("Annotation feedback has been saved", "success", setMessage)
               setTimeout(() => {
                   handleBack(navigate)
               }, 2000)
           }catch (err) {
               console.log(err)
               const error = err.response.data.error
               handleMessage(error, "error", setMessage)
           }finally {
               setLoader(false)
           }
       }
       else if (annotator === null) {
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

    const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, 5));
    const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, 0.1));
    const resetZoom = () => fitImageToViewport();

    return (
        <div className={styles.main}>
            <div className="flex items-center justify-left gap-2">
                {/*<div>*/}
                <BsLayoutSidebar className={`${styles.sidebarIcon} ${width <= 768 ? styles.visible : ''}`} onClick={() => setIsClosed(false)}/>
                {/*</div>*/}
                <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: "70% 1fr" }}>
                     <div className="flex justify-start items-center">
                         {
                             !back && (
                                 <>
                                     {
                                        other ? (
                                            <div
                                                style={{ padding: '5px 10px' }}
                                                 className={`flex justify-center items-center gap-2 rounded
                                                    ${!button.feed
                                                      ? "text-gray-500 cursor-not-allowed opacity-60" 
                                                      : "hover:bg-primary hover:text-white cursor-pointer"
                                                }`}
                                                onClick={button.feed ? handleSave2 : undefined}>
                                                    <RiFeedbackLine />
                                                    <span className="text-sm hidden lg:inline">Save Feedback</span>
                                            </div>
                                        ) : (
                                            <>
                                               <div
                                                    style={{ padding: '5px 10px' }}
                                                    className={`flex justify-center items-center gap-2 rounded border border-gray-300
                                                        ${!button.save 
                                                          ? "text-gray-500 cursor-not-allowed opacity-60" 
                                                          : "hover:bg-primary hover:text-white cursor-pointer"
                                                    }`}
                                                    onClick={button.save ? handleSave : undefined}>
                                                        <IoSaveOutline />
                                                        <span className="text-sm hidden lg:inline">Save Annotations</span>
                                               </div>
                                               <div
                                                    style={{ padding: '5px 10px' }}
                                                     className={`flex justify-center items-center gap-2 rounded
                                                        ${!button.share
                                                          ? "text-gray-500 cursor-not-allowed opacity-60" 
                                                          : "hover:bg-primary hover:text-white cursor-pointer"
                                                    }`}
                                                    onClick={button.share ? handleShare : undefined}>
                                                        <IoSettingsOutline />
                                                        <span className="text-sm hidden lg:inline">Edit Access</span>
                                               </div>
                                               <div
                                                    style={{ padding: '5px 10px' }}
                                                     className={`flex justify-center items-center gap-2 rounded
                                                        ${!button.share
                                                          ? "text-gray-500 cursor-not-allowed opacity-60" 
                                                          : "hover:bg-primary hover:text-white cursor-pointer"
                                                    }`}
                                                     onClick={button.share ? handleShare : undefined}>
                                                        <IoShareSocialOutline />
                                                        <span className="text-sm hidden lg:inline">Share Annotations</span>
                                                </div>
                                            </>
                                        )
                                    }
                                 </>
                             )
                         }
                    </div>
                     <div className="flex justify-end items-center">
                        <div style={{ padding: '5px 10px' }} className="px-5 flex justify-center items-center gap-2 hover:bg-primary rounded hover:text-white cursor-pointer" onClick={zoomOut}>
                            <GoZoomOut />
                            <span className="text-sm hidden lg:inline">Zoom out</span>
                        </div>
                        <div
                            style={{ padding: '5px 10px' }}
                            className="px-5 flex justify-center items-center gap-2 hover:bg-primary rounded hover:text-white cursor-pointer "
                            onClick={zoomIn}>
                                <GoZoomIn />
                                <span className="text-sm hidden lg:inline">Zoom in</span>
                        </div>
                        <div style={{ padding: '5px 10px' }} className="px-5 flex justify-center items-center gap-2 hover:bg-primary rounded hover:text-white cursor-pointer" onClick={resetZoom}>
                            <TbZoomReset />
                            <span className="text-sm hidden lg:inline">Reset Zoom</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
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
import { ArrowLeft } from 'lucide-react';

export default function Header({ setIsClosed, width, setZoom, fitImageToViewport, ZOOM_STEP, other, setShare, back, file,
                                   setLoader, setAnnotations, annotations, annotators, setMessage, cred, annotator, cat,
                                   setSync, onAction }){

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
               if (cat === "computer") {
                   // console.log(cred)
                   const response = await window.electronAPI.saveAnnotation(obj, cred)
                   if(!response.success){
                       handleMessage(response.error, "error", setMessage)
                       return
                   }
                   if (file.isOnline){
                       setSync(true)
                   }
               }
               else {
                   await axiosInstance.post('/save-annotations', obj)
               }
               handleMessage("Image annotations have been saved", "success", setMessage)
               setTimeout(() => {
                   handleBack(navigate)
               }, 1000)
               // handleBack(navigate)
           }catch (err) {
               console.log(file)
               console.log(err)
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
               let response
               if (cat === "computer") {
                   response = await window.electronAPI.saveFeedback(obj, cred)
                   if(!response.success) {
                       console.log(response.error)
                       handleMessage(response.error, "error", setMessage)
                       return
                   }
                   handleMessage(response.message, "success", setMessage)
                   setSync(true)
                   handleBack(navigate)
               }
               else {
                   response = await axiosInstance.post(`/save-feedback/`, obj)
                   handleMessage(response.data.message, "success", setMessage)
               }
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

    function handleAnnotate(){

    }

    const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, 5));
    const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, 0.1));
    const resetZoom = () => fitImageToViewport();

    // cat === "computer" ? (

    return (
        <div className="flex h-16 w-full min-w-0 items-center border-b border-slate-200 bg-white px-3 shadow-sm">

            {/* Sidebar toggle */}
            <div
                onClick={() => handleBack(navigate)}
                className="flex shrink-0 items-center justify-start gap-2 rounded border border-gray-300 mr-5 px-2 py-1 text-xs font-medium cursor-pointer hover:border-gray-500"
            >
                <ArrowLeft size={16}/>
                <span>Back</span>
                {/*<BsLayoutSidebar*/}
                {/*    className={`cursor-pointer text-xl text-slate-600 transition hover:text-blue-600 ${*/}
                {/*        width <= 768 ? styles.visible : ""*/}
                {/*    }`}*/}
                {/*    onClick={() => setIsClosed(false)}*/}
                {/*/>*/}
            </div>

            {/* Header actions */}
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">

                {/* Left actions */}
                <div className="flex min-w-0 items-center gap-2 overflow-hidden">

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
                                            {
                                                cat === "computer" ? (
                                                    <div
                                                            style={{ padding: '5px 10px' }}
                                                            className={`flex justify-center items-center gap-2 rounded border border-gray-300
                                                                ${!button.save
                                                                  ? "text-gray-500 cursor-not-allowed opacity-60"
                                                                  : "hover:bg-primary hover:text-white cursor-pointer"
                                                            }`}
                                                            onClick={button.save ? handleSave : undefined}>
                                                                <IoSaveOutline />
                                                                <span className="text-sm hidden lg:inline">Save Annotations Locally</span>
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
                             </>
                         )
                     }

                </div>

                {/* Right actions: zoom */}
                <div className="flex shrink-0 items-center gap-1">
                    {/*{*/}
                    {/*    annotations.length > 0 && (*/}
                    {/*       <div*/}
                    {/*            style={{ padding: '5px 10px' }}*/}
                    {/*            className={`flex justify-center items-center gap-2 rounded border border-gray-300 hover:bg-primary hover:text-white cursor-pointer*/}
                    {/*                `}*/}
                    {/*            onClick={onAction}>*/}
                    {/*                <IoSaveOutline />*/}
                    {/*                <span className="text-sm hidden lg:inline">Export Annotated Image</span>*/}
                    {/*       </div>*/}
                    {/*    )*/}
                    {/*}*/}
                    <button
                        type="button"
                        onClick={zoomOut}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-primary"
                    >
                        <GoZoomOut className="text-lg" />
                        <span className="hidden lg:inline">Zoom out</span>
                    </button>

                    <button
                        type="button"
                        onClick={zoomIn}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-primary"
                    >
                        <GoZoomIn className="text-lg" />
                        <span className="hidden lg:inline">Zoom in</span>
                    </button>

                    <button
                        type="button"
                        onClick={resetZoom}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-primary"
                    >
                        <TbZoomReset className="text-lg" />
                        <span className="hidden lg:inline">Reset</span>
                    </button>

                </div>
            </div>
        </div>
    )
}
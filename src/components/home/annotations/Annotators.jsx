import styles from "./css/image.module.css";
import {FaRegUser} from "react-icons/fa6";
import {handleMessage} from "../../utils/repeating.js";
import axiosInstance from "../../utils/files/axiosInstance.js";
import {LuUser} from "react-icons/lu";
import {useState} from "react";

export default function Annotators({ annotators, setAnnotations, cred, setLoader, setMessage, setMsg, setAccess, setOther, setAnnotator, setFeed, setBack, cat }){

    const [feedback, setFeedback] = useState(null)
    const [selected, setSelected] = useState(null)

    async function handleLoad(item, bool) {
        setLoader(true)
        try {
            let response
            if (cat === "computer"){
                response = await window.electronAPI.getMyAnnotations(item._id, cred)
                if (!response.success) {
                     handleMessage(response.error, "error", setMessage)
                    return
                }
                // console.log(response)
            }
            else {
                response = await axiosInstance.get(`/annotations/${item._id}`)
            }
            const dat = response.data
            const data = dat.file
            // console.log(data)
            setAccess({ shared_with: data.shared_with, shared_with_team: data.shared_with_team })
            setAnnotations(data.annotations)
            // console.log(response.data.annotations)
            if (item.annotator.email === cred.email){
                setMsg("Loaded my annotations")
            }
            else {
                setAnnotator({ owner: item.annotator._id, annoId: item._id})
                setMsg(`Loaded ${item.annotator.firstName}'s annotations`)
            }

            // console.log(dat.feedback)
            const feed = dat.feedback
            if (feed && !!feed.length) {
                setFeedback(feed)
            }

            setOther(bool)
            setFeed(false)
            setBack(false)
            setSelected(item._id)
        }catch (err) {
           console.log(err)
           const error = err.response.data.error
           handleMessage(error, "error", setMessage)
       }finally {
           setLoader(false)
       }
    }

    async function handleLoad2(item, bool) {
         setLoader(true)
         try {
             let response
             if (cat === "computer") {
                 response = await window.electronAPI.getMyFeedback(item.feedbackId)
                 if(!response.success){
                     console.log(response.error)
                     handleMessage(response.error, "error", setMessage)
                     return
                 }
                 setAnnotations(response.data.annotations)
             }
             else {
                 response = await axiosInstance.get(`/annotations-feedback/${item.feedbackId}`)
                 const dat = response.data
                const data = dat.file
                // console.log(data)
                setAccess({ shared_with: data.shared_with, shared_with_team: data.shared_with_team })
                setAnnotations(data.annotations)
             }
             setMsg("Loaded my feedback")

            setOther(bool)
            setFeed(false)
            setSelected(item._id)
        }catch (err) {
           console.log(err)
           const error = err.response.data.error
           handleMessage(error, "error", setMessage)
       }finally {
           setLoader(false)
       }
    }

    async function handleLoadFeedback(fb) {
        setLoader(true)
        try {
             let response
            if (cat === "computer"){
                response = await window.electronAPI.getAnnotatorFeedback(fb._id, cred)
                if (!response.success) {
                     handleMessage(response.error, "error", setMessage)
                    return
                }
                // console.log(response)
            }
            else {
                response = await axiosInstance.get(`/feedback/${fb._id}`)
            }

            setAnnotations(response.data.annotations)
            setFeed(true)
            setMsg(`Loaded ${fb.owner.firstName}'s feedback`)
            setBack(true)
            setSelected(fb._id)
        }catch (err) {
           console.log(err)
           const error = err.response.data.error
           handleMessage(error, "error", setMessage)
       }finally {
           setLoader(false)
       }
    }

    const myAnnotation = annotators.find(
      item => item.annotator.email === cred?.email
    );

    return (
        <div className={styles.imgInfo}>
            <h1>Annotations</h1>

            {
                myAnnotation && (
                    <div>
                        <div className={`${styles.buttons} ${styles.active}`} onClick={() => handleLoad(myAnnotation, false)}>
                            <LuUser />
                            <span>Load My Annotations</span>
                        </div>

                        <div className={styles.divider}>

                        </div>

                        {
                            feedback && (
                                <>
                                    <div className={styles.feed}>
                                         <p>Feedback for your annotations</p>
                                         <div>
                                             <ul>
                                                 {
                                                     feedback.map(fb => (
                                                         <li key={fb._id}>
                                                             <div className={`${styles.annotatorDiv2} ${selected === fb._id ? styles.active : ""}`}>
                                                                   <div className={styles.annotator}>
                                                                       <h2>{fb.owner.firstName} {fb.owner.lastName}</h2>
                                                                       <p>{fb.owner.email}</p>
                                                                   </div>
                                                                   <div>
                                                                       <div className={`${styles.load}`} onClick={() => handleLoadFeedback(fb)}>
                                                                            <span>Load</span>
                                                                       </div>
                                                                   </div>
                                                             </div>
                                                         </li>
                                                     ))
                                                 }
                                             </ul>
                                         </div>
                                    </div>
                                    <div className={styles.divider}></div>
                                </>
                            )
                        }

                    </div>
                )
            }
            
           <div>
               <p style={{ paddingLeft: '10px' }}>Another Annotators</p>
               <ul>
                   {
                        annotators
                            .filter(item => item.annotator._id !== cred?._id)
                            .map(item => (
                                <li key={item._id}>
                                    <div className={`${styles.annoDiv} ${selected === item._id ? styles.active : ""}`}>
                                        <div className={styles.annotatorDiv}>
                                           <div className={styles.annotator}>
                                               <h2>{item.annotator.firstName} {item.annotator.lastName}</h2>
                                               <p>{item.annotator.email}</p>
                                           </div>
                                           <div>
                                               {
                                                   !item.feedbackId && (
                                                        <div className={`${styles.load}`} onClick={() => handleLoad(item, true)}>
                                                            <span>Load</span>
                                                        </div>
                                                   )

                                               }
                                           </div>
                                       </div>
                                        {
                                            item.feedbackId && (
                                               <div className={styles.annoBtns}>
                                                    <div className={`${styles.load2}`} onClick={() => handleLoad(item, true)}>
                                                        <span>Load Annotations</span>
                                                    </div>
                                                    <div className={`${styles.load3}`} onClick={() => handleLoad2(item, true)}>
                                                        <span>My Feedback</span>
                                                    </div>
                                               </div>
                                            )
                                        }

                                    </div>
                               </li>
                            ))
                    }
               </ul>
           </div>
       </div>
    )
}
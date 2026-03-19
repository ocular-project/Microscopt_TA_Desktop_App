import styles from "./css/image.module.css";
import {IoCloseCircleOutline, IoShareSocialOutline} from "react-icons/io5";
import Users from "../body/autoComplete/Users.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import Teams from "./Teams.jsx";
import React, {useState} from "react";
import {handleLoad2ing, handleLoadFeedbacking, handleLoading} from "../../utils/files/RepeatingFiles.jsx";

export default function AnnotatorShare({ feedback, cat, setFeedback,loader, annotators, setPop, setLoader, cred, setSelected, selected, setAccess, setAnnotations, setOther, setFeed, setBack, setMessage, setMsg, setAnnotator }){

    function handleClose() {
        setPop(false)
    }

    async function handleLoad(item, bool) {
        handleClose()
        await handleLoading(cat, item, bool, setLoader, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg, setAnnotator, setFeedback)
    }

    async function handleLoad2(item, bool) {
        handleClose()
         await handleLoad2ing(cat, item, bool, setLoader, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg, setAnnotator)
    }

    async function handleLoadFeedback(fb) {
        handleClose()
        await handleLoadFeedbacking(cat, fb, setLoader, setAnnotator, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg)
    }

    const myAnnotation = annotators.find(
      item => item.annotator.email === cred?.email
    );

    const otherAnnotations =  annotators.filter(item => item.annotator._id !== cred?._id)

    return (
        <div className={styles.main3}>
           <div className={styles.main4}>
               <div className={`${styles.loader} ${loader ? styles.active : ""}`}></div>
               <div className={styles.closeDiv} onClick={handleClose}>
                   <h1 className={styles.closeH1}>Image Annotations</h1>
                   <IoCloseCircleOutline className={styles.close} />
               </div>
               <p className={styles.select}>The loaded image has been annotated and below are the annotators</p>
               <div className={styles.emailDiv} style={{ padding: '10px 20px', marginTop: '20px' }}>
                    <ul>
                        {
                            myAnnotation && (
                                <li key={myAnnotation._id}>
                                    <div className={styles.annoDiv}>
                                        <div className={styles.annotatorDiv}>
                                           <div className={styles.annotator}>
                                               <h2>My Annotations</h2>
                                           </div>
                                           <div>
                                               <div className={`${styles.loadx}`} onClick={() => handleLoad(myAnnotation, false)}>
                                                    <span>Load My Annotations</span>
                                                </div>
                                           </div>
                                       </div>
                                    </div>
                                </li>
                            )
                        }
                        {
                            otherAnnotations.map(item => (
                                <li key={item._id}>
                                    <div className={`${styles.annoDiv} ${selected === item._id ? styles.active : ""}`}>
                                        <div className={styles.annotatorDiv}>
                                           <div className={styles.annotator}>
                                               <h2>{item.annotator.firstName} {item.annotator.lastName}</h2>
                                               <p>{item.annotator.email}</p>
                                           </div>
                                           <div>
                                               {
                                                   !item.feedbackId ? (
                                                        <div className={`${styles.loadx}`} onClick={() => handleLoad(item, true)}>
                                                            <span>Load Annotations</span>
                                                        </div>
                                                   ) : (
                                                       <div className={styles.annoBtns}>
                                                            <div className={`${styles.load2x}`} onClick={() => handleLoad(item, true)}>
                                                                <span>Load Annotations</span>
                                                            </div>
                                                            <div className={`${styles.load3x}`} onClick={() => handleLoad2(item, true)}>
                                                                <span>Load My Feedback</span>
                                                            </div>
                                                       </div>
                                                   )

                                               }
                                           </div>
                                       </div>
                                    </div>
                               </li>
                            ))
                        }

                    </ul>
               </div>
           </div>
        </div>
    )
}
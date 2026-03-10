import styles from "./css/image.module.css";
import {IoCloseCircleOutline, IoShareSocialOutline} from "react-icons/io5";
import Users from "../body/autoComplete/Users.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import Teams from "./Teams.jsx";
import React, {useState} from "react";
import {handleLoad2ing, handleLoadFeedbacking, handleLoading} from "../../utils/files/RepeatingFiles.jsx";

export default function AnnotatorFeedback({ feedback, setFeedback,loader, annotators, setPop2, setLoader, cred, setSelected, selected, setAccess, setAnnotations, setOther, setFeed, setBack, setMessage, setMsg, setAnnotator, cat }){

    function handleClose() {
        setPop2(false)
    }

    async function handleLoadFeedback(fb) {
        handleClose()
        await handleLoadFeedbacking(cat, fb, setLoader, setAnnotator, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg)
    }

    return (
        <div className={styles.main3}>
           <div className={styles.main4}>
               <div className={`${styles.loader} ${loader ? styles.active : ""}`}></div>
               <div className={styles.closeDiv} onClick={handleClose}>
                   <h1 className={styles.closeH1}>Image Annotations' Feedback</h1>
                   <IoCloseCircleOutline className={styles.close} />
               </div>
               <p className={styles.select}>There is feedback to your annotations</p>
               <div className={styles.emailDiv} style={{ padding: '10px 20px', marginTop: '20px' }}>
                    <ul>
                        {
                            feedback.map(fb => (
                                <li key={fb._id}>
                                    <div className={`${styles.annoDiv} ${selected === fb._id ? styles.active : ""}`}>
                                        <div className={styles.annotatorDiv}>
                                           <div className={styles.annotator}>
                                                <h2>{fb.owner.firstName} {fb.owner.lastName}</h2>
                                                <p>{fb.owner.email}</p>
                                           </div>
                                           <div>
                                               <div className={`${styles.loadx}`} onClick={() => handleLoadFeedback(fb, false)}>
                                                    <span>Load Feedback</span>
                                                </div>
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
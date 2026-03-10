import styles from "./css/image.module.css";
import {FaRegUser} from "react-icons/fa6";
import {handleMessage} from "../../utils/repeating.js";
import axiosInstance from "../../utils/files/axiosInstance.js";
import {LuUser} from "react-icons/lu";
import {useState} from "react";
import {handleLoad2ing, handleLoadFeedbacking, handleLoading} from "../../utils/files/RepeatingFiles.jsx";

export default function Annotators({ annotators, setAnnotations, cred, setLoader, setMessage, setMsg, setAccess, setOther,
                                       setAnnotator, setFeed, setBack, isOpen, setIsOpen, handleChange, setFeedback,
                                       feedback, setSelected, selected, cat }){

    // const [feedback, setFeedback] = useState(null)
    // const [selected, setSelected] = useState(null)

    async function handleLoad(item, bool) {
        await handleLoading(cat, item, bool, setLoader, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg, setAnnotator, setFeedback);
    }

    async function handleLoad2(item, bool) {
        await handleLoad2ing(cat, item, bool, setLoader, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg, setAnnotator)
    }

    async function handleLoadFeedback(fb) {
        await handleLoadFeedbacking(cat, fb, setLoader, setAnnotator, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg)
    }

    const myAnnotation = annotators.find(
      item => item.annotator.email === cred?.email
    );

    return (
        <div className={styles.imgInfo}>
            <div className={styles.header} onClick={() => handleChange("annotations", !isOpen.annotations)}>
               <h3 className={styles.title}>Annotations</h3>
               <span className={`${isOpen.annotations ? styles.open : ''} ${styles.icon}`}>▼</span>
           </div>
            <div className={`${isOpen.annotations ? styles.open : ''} ${styles.content}`}>
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
                   <p style={{ paddingLeft: '0' }}>Another Annotators</p>
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
       </div>

    )
}
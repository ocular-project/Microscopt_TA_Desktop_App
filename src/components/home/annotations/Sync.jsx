import styles from "./css/image.module.css";
import {IoCloseCircleOutline} from "react-icons/io5";
import React, {useState} from "react";
import {RxFilePlus} from "react-icons/rx";
import {handleUploading} from "../../utils/files/RepeatingFiles.jsx";
import {useNavigate} from "react-router-dom";

export default function Sync({ setSync, setMessage, fileId }){

    const [loader, setLoader] = useState(false)
    const navigate = useNavigate()

    function handleClose () {
        setSync(false)
    }

    async function handleSave() {
        await handleUploading(setLoader, fileId, setMessage, navigate)
        setSync(false)
    }

    return (
        <div className={styles.main3}>
           <div className={styles.main4}>
               <div className={`${styles.loader} ${loader ? styles.active : ""}`}></div>
               <div className={styles.closeDiv} onClick={handleClose}>
                   <h1 className={styles.closeH1}>Data Synchronisation</h1>
                   <IoCloseCircleOutline className={styles.close} />
               </div>
               <p className={styles.select}>Would you like to send your latest changes to the online system?</p>
               <p className={styles.select2}>You will need internet for this</p>
               <div className={styles.buttonsFlex}>
                   <div className={`${styles.buttons} ${styles.active}`}
                        onClick={() => handleSave()}
                   >
                        <span>Send Changes</span>
                   </div>
                   <div className={`${styles.buttons}`} onClick={handleClose}>
                            <span>Cancel</span>
                   </div>
               </div>
           </div>

        </div>
    )
}
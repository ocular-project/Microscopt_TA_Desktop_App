import styles from "../css/buttons.module.css"
import {faChevronDown, faFloppyDisk, faShare, faShareNodes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useEffect, useRef, useState} from "react";
import LoadBtn from "../home/body/annotation/LoadBtn.jsx";

export default function Button({ text, status, onClick, area, onLoad, info, setCanEdit, cred }){

    return (
        <>
            {
                status === "active" ? (
                     <div className={`${styles.main} ${styles.active} ${area ? styles.area : ""}`} onClick={onClick}>
                        {text}
                     </div>
                ) : status === "remove" ? (
                     <div className={`${styles.remove}`} onClick={onClick}>
                        {text}
                     </div>
                ) : status === "inactive" ? (
                    <div className={`${styles.main} ${area ? styles.area : ""}`} onClick={onClick}>
                        {text}
                     </div>
                ) : status === "cancel" ? (
                    <div className={`${styles.main} ${styles.cancel} ${area ? styles.area : ""}`} onClick={onClick}>
                        {text}
                     </div>
                ) : status === "deactive" ? (
                    <div className={`${styles.main} ${styles.deactive} ${area ? styles.area : ""}`} onClick={onClick}>
                        {text}
                     </div>
                ) : status === "save" ? (
                    <div className={`${styles.save}`} onClick={onClick}>
                        <FontAwesomeIcon icon={faFloppyDisk} className={styles.saveIcon} />
                        {text}
                     </div>
                ) : status === "share" ? (
                    <div className={`${styles.save}`} onClick={onClick}>
                        <FontAwesomeIcon icon={faShareNodes} className={styles.saveIcon} />
                        {text}
                     </div>
                ) : status === "load" ? (
                    <LoadBtn status={status} info={info} onLoad={(text, id) => onLoad(text, id)} text={text} setCanEdit={setCanEdit} cred={cred}/>
                ) : (
                     <div className={`${styles.main} ${styles.link} ${area ? styles.area : ""}`} onClick={onClick}>
                        {text}
                     </div>
                )
            }
        </>

    )
}
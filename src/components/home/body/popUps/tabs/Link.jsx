import styles from "../../myComputer/css/move.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight, faFolder} from "@fortawesome/free-solid-svg-icons";
import {sendData} from "../../../../utils/repeating";
import {useState} from "react";
import {faImage} from "@fortawesome/free-regular-svg-icons";

export default function Link({ file, index, setLoader, setFiles, setError, path }){

    async function handleNext() {
        const obj = {
            name: "",
            parentId: file._id,
            folderId: file._id,
            folderPath: path
        }
        await sendData(setError, setLoader, setFiles, obj)
    }

    async function handleMove() {

    }

    return(
        <>
            {
                file.type === "folder" ? (
                    <div className={styles.listDiv}>
                        <div className={styles.listDiv1}>

                             <FontAwesomeIcon icon={faFolder} style={{ color: '#949aa4' }}/>
                             <p>{file.name}</p>
                        </div>
                        <div className={styles.listDiv2}>
                            <button onClick={handleMove}>Move Here</button>
                            <div className={styles.linkBackDiv} onClick={handleNext}>
                                <FontAwesomeIcon icon={faChevronRight} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.listDivX}>
                        <div className={styles.listDiv1}>
                             <FontAwesomeIcon icon={faImage} style={{ color: '#949aa4' }}/>
                             <p>{file.name}</p>
                        </div>
                    </div>
                )
            }
        </>

    )
}
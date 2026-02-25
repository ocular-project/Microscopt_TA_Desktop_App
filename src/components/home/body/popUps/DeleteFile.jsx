import styles from "../../css/popup.module.css";
import {useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import css from "../../../css/general.module.css";
import Button from "../../../utils/Button.jsx";
import {handleMessage} from "../../../utils/repeating.js";
import {refreshQuota} from "../../../utils/files/RepeatingFiles.jsx";
import axiosInstance from "../../../utils/files/axiosInstance.js";

export default function DeleteFile({ setLoader, setMessage, setFolders, setScreen, setIsPop, cat, file, setQuota }){

    const [error, setError] = useState(null)

    function handleCancel() {
        setIsPop(false)
    }

    async function handleDelete() {
        setLoader(true)
        setError(null)
        try {
            if (cat === "computer"){
                const response = await window.electronAPI.deleteFile(file._id)
                if (!response.success){
                    console.log(response.error)
                    setError(response.error)
                    return
                }
                setFolders(prev => prev.filter(f => f._id !== file._id))
                handleMessage(response.message, "success", setMessage)
                handleCancel()
            }
            else {
                await axiosInstance.delete(`folders/${file._id}`)
                setFolders(prev => prev.filter(f => f._id !== file._id))
                // setMessage({show: true, message: "Folder/ File delete successfully", status: "success"})
                handleMessage("Folder/ File delete successfully", "success", setMessage)
                await refreshQuota(setQuota, setMessage, setLoader)
                handleCancel()
            }
        }
        catch (err) {
            // console.log(err.response)
            const error = err.response?.data?.error || 'An error occurred'
            setError(error)
        }finally {
            setLoader(false)
        }
    }

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    {
                        file.type === 'file' ? (
                            <>
                                <h1>Deleting File: {file.name}</h1>
                                <p>All annotations attached to this file will be deleted</p>
                            </>
                        ) : (
                            <>
                                <h1>Deleting Folder: {file.name}</h1>
                                <p>All images in this folder, image annotations attached to this file will be deleted</p>
                            </>
                        )
                    }
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>

            <hr/>

             <p style={{ fontSize: '12px' }}>Are you sure you want to delete this {file.type}?</p>

             {
                error && <div className={css.error}>{error}</div>
             }

            <hr/>

            <div className={styles.buttons}>
                <Button text="No" status="cancel" onClick={handleCancel}/>
                <Button text="Yes" status="active" onClick={handleDelete} />
            </div>
        </div>
    )
}
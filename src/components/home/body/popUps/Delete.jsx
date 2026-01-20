import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import Input from "../../../utils/Input";
import css from "../../../css/general.module.css";
import Button from "../../../utils/Button";
import {useState} from "react";
import axioss from "../../../utils/files/axios";
import {handleMessage} from "../../../utils/repeating";

export default function Delete({ file, setFolders, setLoader, setMessage, folders, setIsPop, setFile, setCheckedIds, checkedIds }){

    const [error, setError] = useState(null)

    function handleCancel() {
        setIsPop(false)
        setFile({})
        setCheckedIds([])
    }

    async function handleDelete() {
        const path = localStorage.getItem("path")

        if (path) {
            setLoader(true)
            setError(null)
            try {
                await axioss.delete('folder', {
                    params: {
                        folderId: file._id,
                        folderPath: path
                    }
                })
                // console.log(response.data.folders)
                setFolders(prev => prev.filter(folder => folder._id !== file._id))
                handleMessage("Folder/ File delete successfully", "success", setMessage)
                // setMessage({show: true, message: "Folder/ File delete successfully", status: "success"})
                handleCancel()
            }
            catch (err) {
                // console.log(err.response)
                const error = err.response?.data?.error || 'An error occurred'
                setError(error)
            }finally {
                setLoader(false)
            }
        }
        else {
             handleMessage("Primary folder path not set", "error", setMessage)
            // setMessage({show: true, message: "Primary folder path not set", status: "error"})
            handleCancel()
        }
    }

    async function handleNewDelete() {
        const path = localStorage.getItem("path")

        let mobile_id = folders.find(folder => folder.name === "From-mobile-app")

        let newIds
        if (mobile_id) {
            newIds = checkedIds.filter(id => id !== mobile_id._id)
        }
        else {
            newIds = checkedIds
        }

        if (path) {
            setLoader(true)
            const body = {
                folderPath: path,
                folderList: checkedIds
            }
            try {
                const response = await axioss.post('folders/delete', body)
                // console.log(response.data.folders)
                const data = response.data
                if (data.failures.length === 0) {
                   setFolders(prev => prev.filter(folder => !newIds.includes(folder._id)));
                   handleMessage("All selected folders/ files were deleted successfully", "success", setMessage)
                   // setMessage({show: true, message: "All selected folders/ files were deleted successfully", status: "success"})
                }
                else {

                    const result = folders
                          .filter(obj => data.failures.includes(obj._id))
                          .map(obj => obj.name)
                          .join(', ');

                   const rest = newIds.filter(item => !data.failures.includes(item))
                   setFolders(prev => prev.filter(folder => !rest.includes(folder._id)));
                   // setMessage({show: true, message: `These folders weren't deleted - ${result}`, status: "success"})
                   handleMessage(`These folders weren't deleted - ${result}`, "success", setMessage)
                }

                if (data.defaultFolder) {
                    handleMessage("Folder content for this folder 'From-mobile-app' has been delete but this folder can't be deleted ", "warning", setMessage)
                }
                // else {
                //    const rest = checkedIds.filter(item => !failures.includes(item))
                //    setFolders(prev => prev.filter(folder => !rest.includes(folder._id)));
                //    setMessage({show: true, message: "Some of the selected folders/ files were not deleted", status: "success"})
                // }

            }
            catch (err) {
                // console.log(err.response)
                const error = err.response?.data?.error || 'An error occurred'
                setError(error)
            }finally {
                setLoader(false)
                handleCancel()
            }
        }
        else {
            handleMessage("Primary folder path not set", "error", setMessage)
            handleCancel()
        }
    }

    if (checkedIds.length === 0) {
       return (
             <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.headerDiv1}>
                        <h1>Deleting a {file.type}</h1>
                        <p>All images, annotations and sub folders will be deleted</p>
                    </div>
                    <div className={styles.mainSpan} onClick={handleCancel}>
                        <FontAwesomeIcon icon={faXmark} />
                    </div>
                </div>

                <hr/>

                 <p style={{ fontSize: '12px' }}>Are you sure you want to delete this {file.type} ({file.originalName})?</p>

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

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    <h1>Deleting Folders/ Files</h1>
                    <p>All images, annotations and sub folders will be deleted</p>
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>

            <hr/>

             <p style={{ fontSize: '12px' }}>Are you sure you want to delete all the selected folders?</p>

             {
                error && <div className={css.error}>{error}</div>
             }

            <hr/>

            <div className={styles.buttons}>
                <Button text="No" status="cancel" onClick={handleCancel}/>
                <Button text="Yes" status="active" onClick={handleNewDelete} />
            </div>


        </div>
    )
}
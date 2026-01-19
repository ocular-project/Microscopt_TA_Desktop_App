import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import Input from "../../../utils/Input";
import css from "../../../css/general.module.css";
import Button from "../../../utils/Button";
import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import axioss from "../../../utils/files/axios";
import axiosInstance from "../../../utils/files/axiosInstance.js";

export default function Rename({ setIsPop, setLoader, rename, setRename, setFolders, setMessage, cat }) {

     const [error, setError] = useState(null)

     const handleCancel = () => {
        setRename({name: "", parentId: "", folderId: "", folderPath: ""})
        setIsPop(false)
    }

    async function handleSave () {
        setError(null)
        setLoader(true)
        try {
            const obj = {
                name: rename.name,
                folderId: rename.folderId
            }

            let response
            if (cat === "computer") {
                response = await window.electronAPI.renameFolder(obj)
                if (!response.success){
                    setError(response.error);
                    return
                }
                setFolders(prev =>
                    prev.map(folder =>
                        folder._id === rename.folderId
                            ? { ...folder, name: response.data }
                            : folder
                    )
                )
            }
            else {
                await axiosInstance.put('folder/rename', obj)
                setFolders(prev =>
                    prev.map(folder =>
                        folder._id === rename.folderId
                            ? { ...folder, name: rename.name }
                            : folder
                    )
                )
            }

            handleCancel()
        }catch (err) {
            console.log(err.response)
            const error = err.response
            if (error.status === 400){
                setError(err.response.data.error);
            }
            else {
                setError(err.response?.data?.error || 'An error occurred');
            }
        }finally {
            setLoader(false)
        }
    }

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    <h1>Rename</h1>
                    {/*<p>Organise your files by creating a new folder.</p>*/}
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>

            <hr/>

            <Input title="" category="input" value={rename?.name}
                   onChange={(obj) => setRename({...rename, name: obj})}
            />

             {
                error && <div className={css.error}>{error}</div>
             }

            <hr/>

            <div className={styles.buttons}>
                <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                <Button text="Save" status="active" onClick={handleSave} />
            </div>


        </div>
    )
}
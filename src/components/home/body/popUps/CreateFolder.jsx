import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Button from "../../../utils/Button.jsx";
import styles from "../../css/popup.module.css"
import Input from "../../../utils/Input.jsx";
import css from "../../../css/general.module.css";
import {useEffect, useState} from "react";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import {useParams} from "react-router-dom";
import axioss from "../../../utils/files/axios";
import {getPath, handleMessage} from "../../../utils/repeating";

export default function CreateFolder({ setIsPop, setLoader, folder, setFolder, setFolders, setMessage, cat, config }) {

    const [error, setError] = useState(null)
    const { folderId } = useParams();

    useEffect(() => {
        setFolder({...folder, parentId: folderId || ""})
    }, [folderId]);

    const handleCancel = () => {
        setFolder({...folder, name: ""})
        setIsPop(false)
    }

    const handleCreate = async () => {
        if (!folder.name) {
            setError("Please provide a folder name")
        }
        else {
            setError(null)
            setLoader(true)
            try {
                let response
                if (cat === "computer") {
                    response = await window.electronAPI.createFolder(folder);
                    if (!response.success) {
                        setError(response.error);
                        return
                    }
                }else {
                    response = await axiosInstance.post('folders', folder)
                }
                console.log(response.data)
                setFolders(prev => [response.data, ...prev])
                setFolder({name: "", parentId: ""})
                setIsPop(false)
                // setMessage({show: true, message: "Folder created successfully", status: "success"})
                handleMessage("Folder created successfully", "success", setMessage)
            }catch (err) {
                console.log(err.response)
                const error = err.response
                if (error.status === 400){
                    if (cat === "computer") {
                        setError(err.response.data.error);
                    }
                    else {
                        setError(err.response.data.error[0].msg);
                    }

                }
                else {
                    setError(err.response?.data?.error || 'An error occurred');
                }

            }finally {
                setLoader(false)
            }
        }
    }

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    <h1>Creating a folder</h1>
                    <p>Organise your files by creating a new folder.</p>
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>

            <hr/>

            <Input title="Folder name" category="input" value={folder.name}
                   onChange={(obj) => setFolder({...folder, name: obj})}
            />

             {
                error && <div className={css.error}>{error}</div>
             }

            <hr/>

            <div className={styles.buttons}>
                <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                <Button text="Create Folder" status="active" onClick={handleCreate} />
            </div>


        </div>
    )
}
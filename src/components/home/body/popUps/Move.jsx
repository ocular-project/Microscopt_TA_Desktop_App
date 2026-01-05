import {useEffect, useState} from "react";
import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import Input from "../../../utils/Input";
import css from "../../../css/general.module.css";
import Button from "../../../utils/Button";
import People from "./tabs/People";
import Team from "./tabs/Team";
import Computer from "./tabs/Computer";
import Shared from "./tabs/Shared";
import axioss from "../../../utils/files/axios";
import {moveData, sendData} from "../../../utils/repeating";

export default function Move({ setIsPop, setLoader, rename, setRename, setFolders, setMessage, cat }) {

     const [error, setError] = useState(null)
     const [tab, setTab] = useState(1)
     const [files, setFiles] = useState({})
     const [path, setPath] = useState(null)

    useEffect(() => {
        const json = localStorage.getItem("path")
        setPath(json)
    }, []);

     const handleCancel = () => {
        setRename({name: "", parentId: "", folderId: "", folderPath: ""})
        setIsPop(false)
    }

    const handleMove = async () => {
        const obj = {
            folderPath: path,
            folderId: rename.folderId,
            moveId: files?.folder?._id || ""
        }
        await moveData(setError, setLoader, setFolders, obj, setIsPop, setMessage)
    }

    async function fetchData() {
        await sendData(setError, setLoader, setFiles, rename)
    }

    useEffect(() => {
        fetchData()
    }, []);

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    <h1>Move {rename.name}</h1>
                    <p>Transfer your folder or file with ease</p>
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>

            <hr/>

            <div className={styles.tabDiv}>
                <div className={`${styles.tabDivInfo} ${tab === 1 ? styles.active : ""}`} onClick={() => setTab(1)}>
                    My Computer
                </div>
                <div className={`${styles.tabDivInfo} ${tab === 2 ? styles.active : ""}`} onClick={() => setTab(2)}>
                    Shared Files
                </div>
            </div>

            <div style={{ margin: '20px 0' }}>
                {
                    tab === 1 ? (
                        <Computer files={files} setFiles={setFiles} setLoader={setLoader} setError={setError}
                                  path={path} rename={rename} setMessage={setMessage}
                        />
                    ) : (
                         <Shared />
                    )
                }
            </div>

             {
                error && <div className={css.error}>{error}</div>
             }

            <hr/>

            <div className={styles.buttons}>
                <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                {
                    rename.parentId === files?.folder?._id ? (
                        <Button text="Move Here" status="deactive" onClick={handleMove} />
                    ) : (
                        <Button text="Move Here" status="active" onClick={handleMove} />
                    )
                }

            </div>


        </div>
    )
}
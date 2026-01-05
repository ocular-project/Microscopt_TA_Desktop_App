import Button from "../../../utils/Button";
import styles from "../../../css/buttons.module.css"
import {useRef, useState} from "react";
import dbApi from "../../../utils/files/dbApi";
import axioss from "../../../utils/files/axios";
import {useParams} from "react-router-dom";
import {handleMessage} from "../../../utils/repeating";

export default function ButtonLinks({ setLoader, setScreen, setIsPop, setMessage, setFolders, setCheckedIds, checkedIds }){

    const fileInputRef = useRef(null);
    const { folderId } = useParams();

    async function handleAppClick () {
        const path = await window.electronAPI.getPath();
        // const path = localStorage.getItem("path")
        if (path){
            setScreen(prev => ({...prev, folderCreate: true}))
            setIsPop(true)
        }
        else {
             setScreen(prev => ({...prev, pathCreate: true}))
            setIsPop(true)
        }
    }

    async function handleFileChange() {
       try {
           const result = await dbApi.dialog.openFile({
                properties: ['openFile', 'multiSelections'],
                filters: [
                  { name: 'Images', extensions: ['jpg', 'png', 'gif', 'jpeg', 'bmp', 'webp'] }
                ]
           })

           if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0]
                const stats = await dbApi.fs.stat(filePath);

                // Calculate file size in MB with 2 decimal places
                const fileSizeInBytes = stats.size;
                const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
                const size = `${fileSizeInMB} MB`


                const path = localStorage.getItem("path")
                if (path) {
                    const data = {
                        filePath,
                        parentId: "",
                        folderPath: path,
                        size
                    }
                    setLoader(true)
                    try {
                        const response = await axioss.post('file', data)
                        setFolders(prev => [response.data, ...prev])
                        setMessage([{show: true, message: "Folder uploaded successfully", status: "success"}])
                    }catch (err) {
                        setMessage([{
                            show: true,
                            message: `Error loading an image file ${err}`,
                            status: "error"
                        }]);
                    }finally {
                        setLoader(false)
                    }
                }else {
                    setMessage([{
                        show: true,
                        message: "Primary folder not configured",
                        status: "error"
                    }]);
                }
           }
       }catch (err) {
           setMessage([{
                show: true,
                message: `Error loading an image file ${err}`,
                status: "error"
           }]);
       }
    }

    const [count, setCount] = useState(0)

    async function handleRefresh () {
        const path = localStorage.getItem("path")
        setLoader(true)
        try {
            const response = await axioss.get('folders', {
                params: {
                    parentId: folderId,
                    folderPath: path
                }
            })
            // console.log(response.data.folders)
            setFolders(response.data.folders)
        }catch (err) {
            // console.log(err.response)
            const error = err.response?.data?.error || 'An error occurred'
            handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
        }
    }

    async function handleDelete () {
        setScreen(prev => ({...prev, delete: true}))
        setIsPop(true)
    }

    async function handleMove () {

    }

    return (
        <>
            {
                !folderId && checkedIds.length === 0 && (
                    <div className={styles.main} onClick={handleFileChange}>
                        Load Image
                    </div>
                )
            }
            {
                checkedIds.length > 0 ? (
                    <>
                        <Button text="Move Selected" status="active" onClick={handleMove} />
                        <div className={styles.main} onClick={handleDelete}>
                            Delete Selected
                        </div>
                    </>
                ) : (
                    <>
                        <Button text="Create Folder" status="active" onClick={handleAppClick} />
                        <div className={styles.main} onClick={handleRefresh}>
                            Refresh
                        </div>
                    </>
                )
            }

        </>
    )
}
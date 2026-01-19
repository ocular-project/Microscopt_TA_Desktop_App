import Button from "../../../utils/Button";
import styles from "../../../css/buttons.module.css"
import {useRef, useState} from "react";
import dbApi from "../../../utils/files/dbApi";
import axioss from "../../../utils/files/axios";
import {useNavigate, useParams} from "react-router-dom";
import {getPath, handleMessage} from "../../../utils/repeating";

export default function ButtonLinks({ setLoader, setScreen, setIsPop, setMessage, setFolders, setCheckedIds, checkedIds }){

    const fileInputRef = useRef(null);
    const { folderId } = useParams();
    const currentPath = location.pathname;
    const navigate = useNavigate();

    async function handleAppClick () {
        const path = await getPath();
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
           const result = await window.electronAPI.selectImages(folderId || "")

           setLoader(true)

           if (result.success) {
               if(!!result.data.length) {
                   console.log(result.data)
                 setFolders(prev => [...result.data, ...prev])
                 setMessage([{show: true, message: `${result.data.length} images uploaded successfully`, status: "success"}])
               }
               else {
                   setMessage([{show: true, message: "No image was uploaded", status: "error"}])
               }
           }
           else {
               setMessage([{
                    show: true,
                    message: result.error,
                    status: "error"
                }]);
           }

           // if (!result.canceled && result.filePaths.length > 0) {
           //      const filePath = result.filePaths[0]
           //      const stats = await dbApi.fs.stat(filePath);
           //
           //      // Calculate file size in MB with 2 decimal places
           //      const fileSizeInBytes = stats.size;
           //      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
           //      const size = `${fileSizeInMB} MB`
           //
           //
           //      const path = localStorage.getItem("path")
           //      if (path) {
           //          const data = {
           //              filePath,
           //              parentId: "",
           //              folderPath: path,
           //              size
           //          }
           //          setLoader(true)
           //          try {
           //              const response = await axioss.post('file', data)
           //              setFolders(prev => [response.data, ...prev])
           //              setMessage([{show: true, message: "Folder uploaded successfully", status: "success"}])
           //          }catch (err) {
           //              setMessage([{
           //                  show: true,
           //                  message: `Error loading an image file ${err}`,
           //                  status: "error"
           //              }]);
           //          }finally {
           //              setLoader(false)
           //          }
           //      }else {
           //          setMessage([{
           //              show: true,
           //              message: "Primary folder not configured",
           //              status: "error"
           //          }]);
           //      }
           // }
       }catch (err) {
           setMessage([{
                show: true,
                message: `Error loading an image file ${err}`,
                status: "error"
           }]);
       }finally
        {
            setLoader(false)
        }
    }

    const [count, setCount] = useState(0)

    async function handleRefresh () {
        const path = await getPath();
        if (path) {
            setLoader(true)
            try {
                const response = await window.electronAPI.getFoldersAndFiles(folderId || "");
                if (!response.success) {
                     handleMessage(response.error, "error", setMessage)
                     return
                }
                setFolders(response.data.folders)
            }catch (err) {
            // console.log(err.response)
            const error = err.response?.data?.error || 'An error occurred'
            handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
        }
        }
        else {
           setScreen(prev => ({...prev, pathCreate: true}))
           setIsPop(true)
        }
    }

    async function handleDelete () {
        setScreen(prev => ({...prev, delete: true}))
        setIsPop(true)
    }

    async function handleMove () {

    }

    async function loadImage() {
        const path = await getPath();
        if (path){
            try {
                const response = await window.electronAPI.selectImage()
                setLoader(true)
                let data;
                if (response.success){
                    data = response.data
                    // console.log(response.data)
                    // setFolders(prev => [response.data, ...prev])
                    setFolders(prev => [
                      data,
                      ...(Array.isArray(prev) ? prev : [])
                    ]);
                    openImage(data)
                }
                else {
                   // console.log(response)
                   setMessage([{
                        show: true,
                        message: response.error,
                        status: "error"
                    }]);
                   if (response.data){
                       data = response.data
                       openImage(data)
                   }
               }
            }
            catch (err) {
                setMessage([{
            show: true,
            message: `Error loading an image file ${err}`,
            status: "error"
            }]);
            }
            finally {
                setLoader(false)
            }
        }
        else {
            setScreen(prev => ({...prev, pathCreate: true}))
            setIsPop(true)
        }
    }

    function openImage(folder){
        localStorage.setItem("folder", currentPath)
        navigate(`/annotation/${folder._id}`)
    }

    return (
        <>
            {
                !folderId && checkedIds.length === 0 && (
                    // <div className={styles.main} onClick={handleFileChange}>
                    //     Load Image
                    // </div>
                    <div className={styles.main} onClick={loadImage}>
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
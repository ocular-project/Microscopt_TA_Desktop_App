import Button from "../../../utils/Button";
import styles from "../../../css/buttons.module.css"
import {useEffect, useRef, useState} from "react";
import dbApi from "../../../utils/files/dbApi";
import axioss from "../../../utils/files/axios";
import {useNavigate, useParams} from "react-router-dom";
import {getPath, handleMessage} from "../../../utils/repeating";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import {refreshQuota} from "../../../utils/files/RepeatingFiles.jsx";

export default function ButtonLinks({ setLoader, setScreen, setIsPop, setMessage, setFolders
                                        , setCheckedIds, checkedIds, config, links, cat, setQuota }){

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
                const response = await window.electronAPI.getFoldersAndFiles(folderId || null);
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
        // setScreen(prev => ({...prev, delete: true}))
        // setIsPop(true)
    }

    async function handleMove () {

    }

    async function handleCopy () {
        setLoader(true)
        // console.log(checkedIds)
       try {
           const response = await window.electronAPI.transferFiles(checkedIds, "copy")
           if (!response.success){
               handleMessage(`Error: ${response.error}`, "error", setMessage)
               return
           }
           const data = response.data
           // console.log(data)
           const formData = new FormData();
           for (const image of data.images) {
               const buffer = image.buffer
               const blob = new Blob([buffer], { type: `image/${image.extension}` })
               formData.append('files', blob, image.name);
           }
           formData.append("folders", JSON.stringify(data.folders))
           formData.append("annotations", JSON.stringify(data.annotations))

           // console.log([...formData.entries()]);

           const resp = await axiosInstance.post("desktop/files", formData)
           // // console.log(resp.data)
           handleMessage(resp.data.message, "success", setMessage)
           console.log(resp.data.files)
           const resp2 = await window.electronAPI.updateFiles(resp.data.files)
           if (!resp2.success){
               console.log(resp2.error)
               handleMessage(resp2.error, "warning", setMessage)
               return
           }
           await refreshQuota(setQuota, setMessage, setLoader)
           await handleRefresh()
           // handleMessage("Folder/ File delete successfully", "success", setMessage)
           // const data = response.data
           // const buffer = data.buffer
           // // console.log(data)
           // const blob = new Blob([buffer], { type: data.mineType })
           //
           // // console.log(blob)
           //
           // const formData = new FormData();
           // formData.append('file', blob, data.name);
           // // console.log(formData.get('file'))
           //
           // const resp = await axiosInstance.post("desktop/files", formData)
           // handleMessage(resp.data.message, "success", setMessage)

       }
       catch (err) {
            if (err.response?.data?.error) {
                console.log(err.response.data.error)
                handleMessage(err.response.data.error, "error", setMessage);
                return;
            }
             console.log(err)
            handleMessage(`Error: ${err.message || err}`, "error", setMessage);
        }
       finally
       {
            setLoader(false)
           setCheckedIds([])
       }
    }

    async function loadImage() {
        const path = await getPath();
        if (path){
            try {
                const response = await window.electronAPI.selectImage()
                setLoader(true)
                let data;
                if (response.success){
                    await handleRefresh()
                    // data = response.data
                    // // console.log(response.data)
                    // // setFolders(prev => [response.data, ...prev])
                    // setFolders(prev => [
                    //   data,
                    //   ...(Array.isArray(prev) ? prev : [])
                    // ]);
                    // openImage(data)
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
        console.log(folder)
        const obj = {
            folderId: "",
            path: "/"
        }
        localStorage.setItem("folder", JSON.stringify(obj))
        // navigate(`/annotation/${folder._id}`)
        navigate(`/annotation/${cat}/${folder._id}`)
    }

    function handleDelete () {

    }

    const isAllowed = links && !!links.find(item => item.name === "my_drive" || item.name === "shared_files")

    return (
        <>
            {
                !folderId && checkedIds.length === 0 && (
                    // <div className={styles.main} onClick={handleFileChange}>
                    //     Load Image
                    // </div>
                    <div className={styles.main} onClick={loadImage}>
                        Load Image(s)
                    </div>
                )
            }
            {
                checkedIds.length > 0 ? (
                    <>
                        <Button text="Upload to My Drive" status="active" onClick={handleCopy} />
                        {/*<Button text="Move to My Drive" status="active" onClick={handleMove} />*/}
                        {/*<div className={styles.main} onClick={handleDelete}>*/}
                        {/*    Delete Selected*/}
                        {/*</div>*/}
                    </>
                ) : (
                    <>
                        {/*{*/}
                        {/*    !isAllowed && (*/}
                        {/*        <Button text="Create Folder" status="active" onClick={handleAppClick} />*/}
                        {/*    )*/}
                        {/*}*/}
                        <div className={styles.main} onClick={handleRefresh}>
                            Refresh
                        </div>
                    </>
                )
            }

        </>
    )
}
import axioss from "./files/axios";
import axiosInstance from "./files/axiosInstance.js";

export function checkElectron (isElectron) {
     if (!isElectron) {
        console.error('Not running in Electron');
        return { success: false, error: 'Not running in Electron' };
     }
}

export function handleError (error) {
    console.error('Error :', error);
    return { success: false, error: error.error };
}

export function handlePageError (setError, error) {
    console.error('Error :', error);
    setError(error.error)
}

export function handleMessage (msg, status, setMessage) {
    const message = {show: true, message: msg, status}
    setMessage(prev => ([message, ...prev]))
}

export async function sendData (setError, setLoader, setFiles, rename) {
    setError(null)
    setLoader(true)
    try {
        const response = await axioss.post('folder/location', rename)
        setFiles(response.data)
        // console.log(rename)
        // console.log(response.data)
    }catch (err) {
        console.log(err.response)
        const error = err.response
        setError(err.response.data.error);

    }finally {
        setLoader(false)
    }
}

export async function moveData (setError, setLoader, setFolders, rename, setIsPop, setMessage) {
    setError(null)
    setLoader(true)
    try {
        const response = await axioss.post('folder/location/move', rename)
        setFolders(prev => prev.filter(folder => folder._id !== rename.folderId))
        setIsPop(false)
        handleMessage(response.data.message, "success", setMessage)
    }catch (err) {
        console.log(err.response)
        const error = err.response
        setError(err.response.data.error);

    }finally {
        setLoader(false)
    }
}

export function handleBack(navigate) {
    let folder = localStorage.getItem("folder")
   // console.log(folder)
   if (folder) {
       localStorage.removeItem("folder");
       navigate(`${folder}`)
       // folder = JSON.parse(folder)
       // localStorage.removeItem("folder");
       // if (folder.path !== ""){
       //     if (folder.path === "sharedFiles") {
       //         navigate(`/${folder.path}`)
       //     }
       //     else {
       //         navigate(`/${folder.path}/${folder.folderId}`)
       //     }
       // }
       // else {
       //     navigate(`/${folder.folderId}`)
       // }
   }
   else {
       localStorage.removeItem("folder");
       navigate("/")
   }
}

export async function getPath() {
     return await window.electronAPI.getPath();
}

export async function sendToDrive(folder, setMessage, setLoader){
   setLoader(true)
   try {
       const response = await window.electronAPI.transferFile(folder._id, "copy")
       if (!response.success){
           handleMessage(`Error: ${response.error}`, "error", setMessage)
           return
       }
       // handleMessage("Folder/ File delete successfully", "success", setMessage)
       const data = response.data
       const buffer = data.buffer
       // console.log(data)
       const blob = new Blob([buffer], { type: data.mineType })

       // console.log(blob)

       const formData = new FormData();
       formData.append('file', blob, data.name);
       // console.log(formData.get('file'))

       const resp = await axiosInstance.post("desktop/files", formData)
       handleMessage(resp.data.message, "success", setMessage)

   }
   catch (err) {
        console.log(err)
        if (err.response?.data?.error) {
            handleMessage(err.response.data.error, "error", setMessage);
            return;
        }

        handleMessage(`Error: ${err.message || err}`, "error", setMessage);
    }
   finally
   {
        setLoader(false)
   }
}
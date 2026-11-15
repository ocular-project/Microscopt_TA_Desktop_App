import axiosInstance from "../../../utils/files/axiosInstance.js";
import {handleMessage} from "../../../utils/repeating.js";

export async function uploadImage(item, folderLookUp, imageLookUp) {

    const itemId = item.imageId
    const folder = folderLookUp.get(itemId)
    const image = imageLookUp.get(itemId)

    try {
        const formData = new FormData();

        const buffer = image.buffer
        const blob = new Blob([buffer], { type: `image/${image.extension}` })

        formData.append('file', blob, image.name);
        formData.append("folder", JSON.stringify(folder))

        const resp = await axiosInstance.post("desktop/fileUpload", formData)

        return {
            success:true,
            message: resp.data.message
        }

    }
    catch (error) {
        // console.error(error);

        const message = handleCatchError(error)

        // console.log(message)

        return {
            success: false,
            error: message
        };
    }
}

export async function uploadAnnotations(item, annoLookUp) {
    const itemId = item.imageId
    const annotations = annoLookUp.get(itemId)

    // console.log(annotations)

    try {
        const resp = await axiosInstance.post("desktop/annotationsUpload", annotations)

        // console.log(resp)

        return {
            success:true,
            message: resp.data.message
        }

    }
    catch (error) {
        // console.error(error);

        const message = handleCatchError(error)

        console.log(message)

        return {
            success: false,
            error: message
        };
    }
}

function handleCatchError (error) {
    const status = error.response?.status || 500;

    let message;

    switch (status) {
        case 400:
            message = error.response?.data?.error || "Invalid upload request.";
            break;

        case 500:
            message = "Something went wrong on the server. Please try again later.";
            break;

        default:
            message = error.response?.data?.error || error.message || "Image upload failed.";
    }

    return message
}

export async function handleRefresh (setLoader, handleMessage, setMessage, setFolders, folderId) {

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
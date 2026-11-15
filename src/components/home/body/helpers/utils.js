import axiosInstance from "../../../utils/files/axiosInstance.js";

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

        const resp = await axiosInstance.post("desktop/file", formData)

        return {
            success:true,
            message: resp.data.message
        }

    }catch (error) {
        // console.error(error);

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

        // console.log(message)

        return {
            success: false,
            error: message,
            status
        };
    }
}
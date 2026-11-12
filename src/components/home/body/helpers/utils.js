export function uploadImage(item, folderLookUp, imageLookUp) {
    const itemId = item.id
    const folder = folderLookUp.get(itemId)
    const image = imageLookUp.get(itemId)

    try {

    }catch (error) {
        const formData = new FormData();
        
        const buffer = image.buffer
        const blob = new Blob([buffer], { type: `image/${image.extension}` })
        formData.append('files', blob, image.name);
        formData.append("folders", JSON.stringify(data.folders))
    }
}
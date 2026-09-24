export const selectImage = async (setImage, setIsSourceModalOpen, setError) => {
    try {
        const selectedImageObj = await window.electronAPI.openImage();

        if (selectedImageObj) {
            console.log(selectedImageObj)
            setImage(selectedImageObj)
            setIsSourceModalOpen(false)
        }
        else {
            setError("Path is null")
        }
    } catch (error) {
        console.error('Failed to select folder:', error);
        setError("Failed to open pc file browser")
    }
}

export const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return `${(bytes / 1024).toFixed(1)} KB`;
};
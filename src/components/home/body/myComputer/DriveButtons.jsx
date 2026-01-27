import Button from "../../../utils/Button.jsx";
import styles from "../../../css/buttons.module.css";
import {handleMessage} from "../../../utils/repeating.js";
import axiosInstance from "../../../utils/files/axiosInstance.js";

export default function DriveButtons({ setCheckedIds, checkedIds, setLoader, setMessage }){

    async function handleDownload() {
        const files= checkedIds.map(check => check.id)
        if (files.length === 1) {
            console.log(files[0])
            await handleDownloadSingle(files[0])
            return
        }
        try {
            const response = await axiosInstance.post('desktop/download_multiple', { files }, { responseType: 'blob' })
            const blob = new Blob([response.data], { type: 'application/zip' })
            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'ocular_MTA_files.zip')
            document.body.appendChild(link)
            link.click()
            link.remove()

            window.URL.revokeObjectURL(url)
        }
        catch (error) {
            handleMessage(`Error: ${error.response?.data?.error || error}`, "error", setMessage);
        }
        finally {
            setCheckedIds([])
        }
    }

    async function handleDownloadSingle (fileId) {
        setLoader(true)
        try {
            // const response = await axiosInstance.get(
            // `/desktop/download_single/${fileId}`,
            //     {
            //         responseType: 'blob',
            //         withCredentials: true, // important for session cookies
            //     }
            // );
            //
            // const disposition = response.headers['content-disposition'];
            // let filename = 'download';
            //
            // if (disposition) {
            //     const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/);
            //     if (match && match[1]) {
            //         filename = decodeURIComponent(match[1]);
            //     }
            // }
            //
            // const blob = new Blob([response.data], {
            //     type: response.headers['content-type'],
            // });
            //
            // const url = window.URL.createObjectURL(blob);
            //
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = filename; // browser will use filename from server
            // document.body.appendChild(a);
            // a.click();
            // a.remove();
            //
            // window.URL.revokeObjectURL(url);
            const response = await window.electronAPI.downloadFile(`http://localhost:3001/api/desktop/download_single/${fileId}`)
            if (!response.success) {
                handleMessage(response.error, "error", setMessage);
                return
            }
             handleMessage(`${response.filename} has been downloaded successfully`, "success", setMessage);
        }
        catch (error) {
            // console.log(error)
            console.error('Download failed:', error.message);
            // if (error.response?.data?.error) {
            //     handleMessage(`Error: ${error.response?.data?.error || error}`, "error", setMessage);
            //     return
            // }
            // handleMessage(error, "error", setMessage);
        }
        finally {
            setCheckedIds([])
            setLoader(false)
        }
    }

    function handleMove() {

    }

    function handleDeselect() {

    }

    return (
        <>
            <Button text="Download to My Computer" status="active" onClick={handleDownload} />
            {/*<Button text="Move to My Computer" status="active" onClick={handleMove} />*/}
            <div className={styles.main} onClick={handleDeselect}>
                Deselect All
            </div>
        </>
    )
}
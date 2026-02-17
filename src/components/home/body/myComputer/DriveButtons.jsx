import Button from "../../../utils/Button.jsx";
import styles from "../../../css/buttons.module.css";
import {handleMessage} from "../../../utils/repeating.js";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import {useNavigate} from "react-router-dom";

export default function DriveButtons({ setCheckedIds, checkedIds, setLoader, setMessage, cat }){

    const navigate = useNavigate();

    async function handleDownload() {
        const files= checkedIds.map(check => check.id)
        // if (files.length === 1) {
        //     console.log(files[0])
        //     await handleDownloadSingle(files[0])
        //     return
        // }
        setLoader(true)
        try {
            const response = await axiosInstance.post('desktop/download_multiple', { files }, { responseType: 'blob' })
            // const blob = new Blob([response.data], { type: 'application/zip' })
            // const url = window.URL.createObjectURL(blob)
            //
            // const link = document.createElement('a')
            // link.href = url
            // link.setAttribute('download', 'ocular_MTA_files.zip')
            // document.body.appendChild(link)
            // link.click()
            // link.remove()
            //
            // window.URL.revokeObjectURL(url)
            const buffer = await response.data.arrayBuffer()
            console.log(cat)
            const result = await window.electronAPI.saveZip(buffer, cat)
            if (result.success) {
                handleMessage(result.message, "success", setMessage);
                navigate(`/${result.folderId}`)
            }else {
                console.log(result.error)
                handleMessage(result.error, "error", setMessage);
            }
        }
        catch (error) {
            console.log(error)
            handleMessage(`Error: ${error.response?.data?.error || error}`, "error", setMessage);
        }
        finally {
            setCheckedIds([])
            setLoader(false)
        }
    }


    async function handleDownloadSingle (fileId) {
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
            handleMessage(error.message, "error", setMessage);
        }
        finally {
            setCheckedIds([])
            setLoader(false)
        }
    }

    async function handleMove() {
        const files= checkedIds.map(check => check.id)
        // if (files.length === 1) {
        //     console.log(files[0])
        //     await handleDownloadSingle(files[0])
        //     return
        // }
        setLoader(true)
        try {
            const response = await axiosInstance.get(`desktop/download_annotations/${files[0]}`)
            const resp = await window.electronAPI.downloadImageAnnotations(response.data)
            // console.log(response.data)
            if (resp.success) {
                handleMessage(resp.message, "success", setMessage);
            }
            else {
                handleMessage(resp.error, "error", setMessage);
            }
        }
        catch (error) {
            console.log(error)
            handleMessage(`Error: ${error.response?.data?.error || error}`, "error", setMessage);
        }
        finally {
            setCheckedIds([])
            setLoader(false)
        }
    }

    function handleDeselect() {
        setCheckedIds([])
    }

    return (
        <>
            <Button text="Download to My Computer" status="active" onClick={handleDownload} />
            {/*<Button text="Download Annotations" status="active" onClick={handleMove} />*/}
            {/*<div className={styles.main} onClick={handleDeselect}>*/}
            {/*    Deselect All*/}
            {/*</div>*/}
        </>
    )
}
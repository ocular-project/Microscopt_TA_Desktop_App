import Button from "../../utils/Button.jsx";
import styles from "../css/links.module.css"
import css from "../../css/general.module.css";
import {useNavigate, useParams} from "react-router-dom";
import {useEffect, useRef, useState} from 'react';
import axiosInstance from "../../utils/files/axiosInstance.js";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import ButtonLinks from "./myComputer/ButtonLinks";
import {handleMessage} from "../../utils/repeating";
import DriveButtons from "./myComputer/DriveButtons.jsx";

export default function Links({ setScreen, setIsPop, cat, loader, setLoader, links, setFolders, setMessage, setCheckedIds, checkedIds, config }){

    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    const { folderId } = useParams();
    const files = ["folder", "computer"]
    const currentPath = location.pathname;
    const [vis, setVis] = useState(false)
    const uploadRef = useRef(null);
    const currentHash = window.location.hash;
    const path = currentHash.replace(/^#/, '');


    const handleClick = () => {
        setScreen(prev => ({...prev, folderCreate: true}))
        setIsPop(true)
    }

    const handleTeamClick = () => {
        setScreen(prev => ({...prev, teamCreate: true}))
        setIsPop(true)
    }

    const handleLinkClick = (link, index) => {
        if (index < links.length - 1) {
            if (cat === "computer") {
                navigate(`/${link._id}`);
            }
            else if (cat === "folder") {
                navigate(`/collaboration/${link._id}`);
            }
            else {
                navigate(`/sharedFiles/${link._id}`);
            }

        }
    }

    const handleHomeClick = () => {
        if (cat === "computer") {
            navigate('/', { replace: true });
        }
        else if (cat === "folder") {
            navigate('/collaboration', { replace: true });
        }
        else {
            navigate('/sharedFiles', { replace: true });
        }
    }

    const handleFileChange = async (event) => {
        const newImages = Array.from(event.target.files);
        // console.log(newImages)

        if (!newImages.length) {
            // setMessage([{show: true, message: "Please select images(s) to upload", status: "warning"}])
            handleMessage("Please select images(s) to upload", "warning", setMessage)
            return
        }

        setLoader(true)
        setVis(false)

        const uploadFiles = []
        let hasError = false

        for (let i=0; i < newImages.length; i++) {
            const file = newImages[i]

            // setMessage([{show: true, message: `Uploading image ${i+1} of ${newImages.length}`, status: 'info'}])
             handleMessage(`Uploading image ${i+1} of ${newImages.length}`, "info", setMessage)
            const formData = new FormData();
            formData.append('file', file);  // Changed from 'files' to 'file'

            if (folderId) {
                formData.append('parentId', folderId);
            }
            try {
                const response = await axiosInstance.post('uploadFile', formData);
                // console.log(response.data)
                uploadFiles.push(response.data);
            } catch (err) {
                console.log(err.response);
                const error = err.response?.data?.error || 'An error occurred';
                handleMessage(`Error uploading ${file.name}: ${error}`, "error", setMessage)
                // setMessage([{
                //     show: true,
                //     message: `Error uploading ${file.name}: ${error}`,
                //     status: "error"
                // }]);
                hasError = true;
                break; // Optional: stop on first error
            }
        }

        if (uploadFiles.length > 0) {
            setFolders(prev => [...uploadFiles, ...prev])
            const successMessage = hasError ?
                `Successfully uploaded ${uploadFiles.length} of ${newImages.length} images` :
                `Successfully uploaded ${uploadFiles.length} files`

            // setMessage([{show: true, message: successMessage, status: "success"}]);
            handleMessage(successMessage, "success", setMessage)

        }
        setLoader(false)

    }

    const handleFileChange2 = async (event) => {
        const files = event.target.files;
        const formData = new FormData();
        const folderName = event.target.files[0].webkitRelativePath.split('/')[0];

        const imageFiles = [];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        Array.from(files).forEach(file => {
            if (allowedTypes.includes(file.type)) {
                imageFiles.push(file);
            }
        });

        if (imageFiles.length === 0) {
            handleMessage("No images found in the folder", "error", setMessage)
            // setMessage([{show: true, message: "No images found in the folder", status: "error"}])
            return;
        }

        imageFiles.forEach(file => {
            formData.append('files', file);
        });

        formData.append('folderName', folderName);

        if (folderId) {
            formData.append('parentId', folderId)
        }

        setLoader(true)
        setVis(false)
        // setMessage([{show: true, message: `Uploading ${imageFiles.length} images`, status: "info"}])
        handleMessage(`Uploading ${imageFiles.length} images`, "info", setMessage)
        try{
            const response = await axiosInstance.post('upload-folder', formData)
            // console.log(response.data)
            setFolders(prev => [response.data, ...prev])
             handleMessage("Folder uploaded successfully", "success", setMessage)
            // setMessage([{show: true, message: "Folder uploaded successfully", status: "success"}])
        }catch (err) {
            console.log(err.response)
            const error = err.response?.data?.error || 'An error occurred'
             handleMessage(error, "error", setMessage)
            // setMessage([{show: true, message:  error, status: "error"}])
        }finally {
            setLoader(false)
        }

    }

    useEffect(() => {
         const handleClickOutside = (event) => {
            if (
                uploadRef.current && !uploadRef.current.contains(event.target)
            ) {
                setVis(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleVis = (event) => {
        event.stopPropagation();
        setVis(prev => !prev);
    }

    const handleRefresh = () => {

    }

    return (
        <div className={styles.section}>
            <div className={`${css.loader} ${loader ? css.active : ""}`}></div>
            <div className={styles.sectionDiv}>
                <div className={styles.sectionDiv1}>
                    {
                        links && links.length > 0 ? (
                            <ul>
                                <li>
                                    <div className={styles.linkDiv}>
                                        <div onClick={handleHomeClick}>
                                            {
                                                cat === "computer" ? (
                                                    <>My Computer</>
                                                ) : cat === "folder" ? (
                                                    <>My Drive</>
                                                ) : cat === "shared" ? (
                                                     <>
                                                        Shared files
                                                    </>
                                                ) : cat === "device" ? (
                                                     <>
                                                        Devices
                                                     </>
                                                ) : (
                                                    <>
                                                        Teams
                                                    </>
                                                )
                                            }
                                        </div>
                                        {links.length > 0 && <span> &gt; </span>}
                                    </div>
                                </li>
                                {
                                    links.map((link, index) => (
                                        <li key={link._id}>
                                            <div className={styles.linkDiv}>
                                                <div onClick={() => handleLinkClick(link, index)}>
                                                    {link.name}
                                                </div>
                                                {index < links.length - 1 && <span> &gt; </span>}
                                            </div>
                                        </li>
                                    ))
                                }
                            </ul>
                        ) : (
                            <ul>
                                <li>
                                   <div className={styles.linkDiv}>
                                        <div>
                                            {
                                                path.startsWith("/team") ? (
                                                    <>
                                                        Teams
                                                    </>
                                                ) : path.startsWith("/shared") ? (
                                                     <>
                                                        Shared files
                                                    </>
                                                ) : path.startsWith("/collaboration") ? (
                                                     <>
                                                        My drive
                                                     </>
                                                ) : path.startsWith("/device") ? (
                                                     <>
                                                        Devices
                                                    </>
                                                ) : (
                                                    <>
                                                        My Computer
                                                    </>
                                                )
                                            }
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        )
                    }
                </div>
                <div className={styles.sectionDiv2}>
                    {
                        cat === "folder" ? (
                            <>
                                {
                                    !!checkedIds.length ? (
                                        <DriveButtons checkedIds={checkedIds} setCheckedIds={setCheckedIds}
                                                      setMessage={setMessage} setLoader={setLoader} cat={cat}/>
                                    ) : (
                                        <>
                                            <div className={styles.dropDown} ref={uploadRef}>
                                                <div className={styles.dropText} onClick={(e) => handleVis(e)}>
                                                    <span className={styles.text}>Upload</span>
                                                    <span className={`${styles.icon} ${vis? styles.rotate : ""}`}><FontAwesomeIcon icon={faChevronDown} /></span>
                                                </div>
                                                <div className={`${styles.dropUl} ${vis? styles.active : ""}`}>
                                                    <ul>
                                                        <li onClick={() => folderInputRef.current.click()}>
                                                            <div style={{ position: 'relative'}}>
                                                                <input
                                                                    type="file"
                                                                    ref={folderInputRef}
                                                                    webkitdirectory=""
                                                                    directory=""
                                                                    onChange={handleFileChange2}
                                                                    style={{ display: 'none' }}
                                                                />
                                                                <span>Folder</span>
                                                            </div>
                                                        </li>
                                                        <li onClick={() => fileInputRef.current.click()}>
                                                            <div style={{ position: 'relative'}}>
                                                                <input
                                                                    type="file"
                                                                    ref={fileInputRef}
                                                                    accept="image/*"
                                                                    multiple
                                                                    onChange={handleFileChange}
                                                                    style={{ display: 'none' }}
                                                                />
                                                                <span>Image(s)</span>
                                                            </div>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <Button text="Create Folder" status="active" onClick={handleClick} />
                                        </>
                                    )
                                }

                            </>
                        ) : cat === "shared" ? (
                            !!checkedIds.length && (
                                <DriveButtons checkedIds={checkedIds} setCheckedIds={setCheckedIds}
                                              setMessage={setMessage} setLoader={setLoader} cat={cat}/>
                            )
                        ) : cat === "team" ? (
                            <Button text="Create Team" status="active" onClick={handleTeamClick} />
                        ) : cat === "computer" ? (
                            <ButtonLinks setLoader={setLoader} setScreen={setScreen} setIsPop={setIsPop}
                                         setMessage={setMessage} setFolders={setFolders} setCheckedIds={setCheckedIds}
                                         checkedIds={checkedIds} config={config} links={links} cat={cat}
                            />
                        // ) : cat === "device" ? (
                        //     <Button text="Refresh" status="active" onClick={handleRefresh} />
                        ) : null
                    }
                </div>
            </div>
        </div>

    )
}
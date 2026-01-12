import {useEffect, useRef, useState} from "react";
import styles from "../../../css/table.module.css";
import {formatDate} from "../../../utils/files/FormatDate.js";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEllipsisVertical, faXmark} from "@fortawesome/free-solid-svg-icons";
import {useNavigate} from "react-router-dom";
import {handleMessage} from "../../../utils/repeating.js";
import { config } from "../../../utils/files/config.js"

export default function Folders({ folders, setLoader, setMessage, setFolders, setScreen, setIsPop, setFile,
                                    setIsView, setRename }){

    const [selectedId, setSelectedId] = useState(null);
    const [selectedIconId, setSelectedIconId] = useState(null);
    const navigate = useNavigate();
    const tdRef = useRef(null)
    const popRef = useRef(null);
    const currentPath = location.pathname;


   const getPopupPosition = (index) => {
        // Adjust these numbers based on your needs
        if (index < 2) {
            return 'top';
        } else if (index > folders.length - 3) {
            return 'bottom';
        }
        return '';
    };

   const handleClick = (folder) => {
        setSelectedId(folder._id);
        setSelectedIconId(null)
    };

    const handleDoubleClick = async (folder) => {
        setSelectedId(null);
        setSelectedIconId(null)
        if (folder.type === 'file'){
             // const files = folders.filter(folder => folder.type === 'file')
             // setIsView({view: true, files: files, fileId:folder._id})

            // const obj = {
            //     folderId: currentPath === "/sharedFiles" ? "" : folder.parent,
            //     path: currentPath
            // }
            localStorage.setItem("folder", currentPath)
            navigate(`/annotation/${folder._id}`)
        }
        else {

            if (!currentPath.startsWith("/sharedFiles")){
                navigate(`/${folder._id}`);
            }else {
                navigate(`/sharedFiles/${folder._id}`);
            }
        }

    };

    const handleIconClick = (folder) => {
        if (selectedIconId){
             if (selectedIconId === folder._id) {
                 setSelectedIconId(null);
                 setSelectedId(null);
             }

            else {
                setSelectedIconId(null);
                setSelectedId(null);
                setSelectedIconId(folder._id);
                setSelectedId(folder._id);
            }
        }
        else {
             setSelectedIconId(folder._id);
             setSelectedId(folder._id);
        }
    }

    const handleDelete = async (folder) => {
        setLoader(true)
        try {
            await axiosInstance.delete(`folders/${folder._id}`)
            const updatedList = folders.filter(folderItem => folderItem !== folder)
            setFolders(updatedList)
            // setMessage({show: true, message: "Folder/ File delete successfully", status: "success"})
            handleMessage("Folder/ File delete successfully", "success", setMessage)
        }catch (err) {
            const error = err.response?.data?.error || 'An error occurred'
            // setMessage({show: true, message:  error, status: "error"})
            handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
            setSelectedId(null)
            setSelectedIconId(null)
        }
    }

   const getFileName = (name) => {
        const parts = name.split('.');
        return parts[0]; // Get name without extension
   };

   const getFileExtension = (name) => {
        const parts = name.split('.');
        return parts.length > 1 ? parts[1].toUpperCase() : ''; // Get extension or empty string
   };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

   const handleShare= async (folder) => {

       setFile(folder)
       setIsPop(true)
       setScreen(prev => ({...prev, share: true}))
    }

    function handleInfo (folder) {
       setIsPop(true)
       setScreen(prev => ({...prev, fileInfo: true, id: folder._id}))
    }

   useEffect(() => {
         const handleClickOutside = (event) => {
            if (
                tdRef.current && !tdRef.current.contains(event.target) &&
                popRef.current && !popRef.current.contains(event.target) // Prevent closing when clicking inside the popup
            ) {
                setSelectedIconId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
   }, []);

    function handleRename(folder) {
        setRename(prev => ({...prev, folderId: folder._id, name: folder.name}))
        setIsPop(true)
       setScreen(prev => ({...prev, rename: true}))
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    {
                        currentPath === "/" && (
                            <th>
                                File Location
                            </th>
                        )
                    }
                    <th>Type</th>
                    <th>Size</th>
                    <th>Created At</th>
                    <th>Last Modified</th>
                    <th className={styles.action}>Action</th>
                </tr>
            </thead>
            <tbody>
                {
                   folders.map((folder, index) => (
                       <tr
                           key={folder._id}
                           onClick={() => handleClick(folder)}
                           onDoubleClick={() => handleDoubleClick(folder)}
                           className={`${selectedId === folder._id ? styles.tr : ""}`}
                       >
                           <td>
                               <div className={styles.type}>
                                   <img src={`${folder.type === "file" ? "/images/image.png" : "/images/folder.png"}`} alt=""/>
                                   {getFileName(folder.name)}
                               </div>
                           </td>
                           {
                                currentPath === "/" && (
                                    <td style={{
                                        width: '20%',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'normal'
                                        }}
                                    >
                                        {folder.url}
                                    </td>
                                )
                            }
                           <td>
                               {
                                   folder.type === "folder" ? "Folder" : getFileExtension(folder.name)
                               }
                           </td>
                           <td>{folder.size}</td>
                           <td>{formatDate(folder.createdAt)}</td>
                           <td>{formatDate(folder.updatedAt)}</td>
                           <td className={`${styles.tdIcon}`}>
                                <div className={styles.action}>
                                    <div className={`${styles.iconDiv} ${selectedIconId === folder._id ? styles.active : ""}`}
                                         onClick={(e) => {
                                             e.stopPropagation()
                                             handleIconClick(folder)
                                         }}
                                    >
                                        {
                                            selectedIconId === folder._id ? (
                                                <FontAwesomeIcon icon={faXmark} />
                                            ) : (
                                                <FontAwesomeIcon icon={faEllipsisVertical} />
                                            )
                                        }
                                    </div>
                                    <div
                                        className={`
                                        ${styles.popAction} 
                                        ${selectedIconId === folder._id ? styles.active : ""} 
                                        ${styles[getPopupPosition(index)]}
                                    `}>
                                        <ul>
                                            {/* <li>*/}
                                            {/*    <div onClick={() => handleInfo(folder)}>*/}
                                            {/*        {*/}
                                            {/*            folder.type === "folder" ? "Folder information" : "File information"*/}
                                            {/*        }*/}
                                            {/*    </div>*/}
                                            {/*</li>li*/}
                                            <li>
                                                <div onClick={(e) => handleShare(folder)} >
                                                    Share / File Information
                                                </div>
                                            </li>
                                            {
                                                config() || folder?.owner.email === "me" && (
                                                    <>
                                                        <li>
                                                            <div onClick={(e) => handleRename(folder)} >
                                                                Rename
                                                            </div>
                                                        </li>
                                                        <li>
                                                            <div onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDelete(folder)
                                                            }}>
                                                                Delete
                                                            </div>
                                                        </li>
                                                    </>
                                                )
                                            }
                                        </ul>
                                    </div>
                                </div>
                           </td>
                       </tr>
                   ))
                }
            </tbody>
        </table>
    )
}
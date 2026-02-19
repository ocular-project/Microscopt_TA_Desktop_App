import {useEffect, useRef, useState} from "react";
import styles from "../../../css/table.module.css";
import {formatDate} from "../../../utils/files/FormatDate.js";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEllipsisVertical, faXmark} from "@fortawesome/free-solid-svg-icons";
import {useNavigate} from "react-router-dom";
import {handleMessage, sendToDrive} from "../../../utils/repeating.js";
import {IoMdCheckmark, IoMdClose} from "react-icons/io";
import {FaFolder} from "react-icons/fa";
import {IoImageOutline} from "react-icons/io5";

export default function Folders({ folders, setLoader, setMessage, setFolders, setScreen, setIsPop, setFile,
                                    setIsView, setRename, config, cat, setCheckedIds, checkedIds }){

    const [selectedId, setSelectedId] = useState(null);
    const [selectedIconId, setSelectedIconId] = useState(null);
    const navigate = useNavigate();
    const tdRef = useRef(null)
    const popRef = useRef(null);
    const currentPath = location.pathname;
    const [selectedAll, setSelectedAll] = useState(false);

    // useEffect(() => {
    //     console.log(folders)
    // }, []);

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

            const parent = folder.parent || ""
            let obj = {}
            if (cat === "computer") {
                obj = {
                    folderId: parent,
                    path: "/"
                }
            }
            else if (cat === "shared") {
                obj = {
                    folderId: parent,
                    path: "/sharedFiles"
                }
            }
            else {
                obj = {
                    folderId: parent,
                    path: "/collaboration"
                }
            }

            localStorage.setItem("folder", JSON.stringify(obj))
            navigate(`/annotation/${cat}/${folder._id}`)
        }
        else {
            console.log(cat)
            if (cat === "computer") {
                navigate(`/${folder._id}`);
            }
            else if (cat === "folder") {
                navigate(`/collaboration/${folder._id}`);
            }
            else {
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
        setFile(folder)
        setIsPop(true)
        setScreen(prev => ({...prev, deleteFile: true}))
        // setLoader(true)
        // try {
        //     await axiosInstance.delete(`folders/${folder._id}`)
        //     const updatedList = folders.filter(folderItem => folderItem !== folder)
        //     setFolders(updatedList)
        //     // setMessage({show: true, message: "Folder/ File delete successfully", status: "success"})
        //     handleMessage("Folder/ File delete successfully", "success", setMessage)
        // }catch (err) {
        //     const error = err.response?.data?.error || 'An error occurred'
        //     // setMessage({show: true, message:  error, status: "error"})
        //     handleMessage(error, "error", setMessage)
        // }finally {
        //     setLoader(false)
        //     setSelectedId(null)
        //     setSelectedIconId(null)
        // }
    }

   const getFileName = (name) => {
        const parts = name.split('.');
        return parts[0]; // Get name without extension
   };

   const getFileExtension = (name) => {
        const parts = name.split('.');
        return parts.length > 1 ? parts[parts.length -1].toUpperCase() : ''; // Get extension or empty string
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

    function handleMoveToDrive(folder){

    }

    async function handleCopyToDrive(folder){
            setLoader(true)
           const obj = {id: folder._id, type: folder.type}
           try {
                const response = await window.electronAPI.transferFiles([obj], "copy")
               if (!response.success){
                   handleMessage(`Error: ${response.error}`, "error", setMessage)
                   return
               }
               // handleMessage("Folder/ File delete successfully", "success", setMessage)
               const data = response.data
               const formData = new FormData();
               for (const da of data) {
                   const buffer = da.buffer
                   const blob = new Blob([buffer], { type: da.extension })
                   formData.append('files', blob, da.name);
               }

               const resp = await axiosInstance.post("desktop/files", formData)
               // console.log(resp.data)
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

    function handleSelected(folder) {
        // console.log(folder)
        if (folder.type === 'file') {
            setCheckedIds(prev => {
                const exists = prev.some(item => item.id === folder._id);
                if (exists) {
                    return prev.filter(item => item.id !== folder._id);
                }
                return [...prev, {id: folder._id, type: folder.type}]
            })
        }
        else {
            handleMessage("Only images can be uploaded", "error", setMessage)
        }
        // const typeExists = checkedIds.some(item => item.type === folder.type);
        // if (typeExists || !checkedIds.length) {
        //     setCheckedIds(prev => {
        //         const exists = prev.some(item => item.id === folder._id);
        //         if (exists) {
        //             return prev.filter(item => item.id !== folder._id);
        //         }
        //         return [...prev, {id: folder._id, type: folder.type}]
        //     })
        // }
        // else {
        //     handleMessage("You can only select either images or folder but not both", "error", setMessage)
        // }
    }

    function handleSelectAll() {
        const files = folders.filter(item => item.type === "file" && !item.isOnline).map(item => ({ id: item._id, type: item.type }))
        if (files.length === checkedIds.length) {
            // setSelectedAll(false)
            setCheckedIds([])
        }
        else {
            // setSelectedAll(true)
            setCheckedIds(files)
        }
    }

    useEffect(() => {
        const files = folders.filter(item => item.type === "file").map(item => ({ id: item._id, type: item.type }))
        if (files.length === checkedIds.length) {
            setSelectedAll(true)
        }else {
            setSelectedAll(false)
        }
    }, [checkedIds]);

    return (
        <>
            {
                !!checkedIds.length && (
                    <p className={styles.select} onClick={handleSelectAll}>{selectedAll ? 'Deselect All' : 'Select All'}</p>
                )
            }

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        {
                            cat === "computer" && (
                                <th>Synced with server</th>
                            )
                        }
                        {
                            (config && currentPath === "/") && (
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
                                       {
                                           folder.type === "file" && !folder.isOnline ? (
                                               <div className={`${styles.checking2} ${checkedIds.some(item => item.id === folder._id)? styles.active : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSelected(folder)
                                                    }}
                                                >
                                                    <IoMdCheckmark style={{ color: 'white' }}/>
                                               </div>
                                           ) : (
                                            <div className={`${styles.checking21}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSelected(folder)
                                                    }}
                                                >
                                                    <IoMdClose style={{ color: 'white' }}/>
                                               </div>
                                           )
                                       }
                                       {
                                           folder.type === "file" ? (
                                               <FaFolder style={{ color: '#F69220', fontSize: '18' }}/>
                                           ) : (
                                               <IoImageOutline style={{ color: '#F69220', fontSize: '18' }}/>
                                           )
                                       }
                                       {/*<img src={`${folder.type === "file" ? "/images/image.png" : "/images/folder.png"}`} alt=""/>*/}
                                       {getFileName(folder.name)}
                                   </div>
                               </td>
                               {
                                    cat === "computer" && (
                                        folder.type === "file" ? (
                                            <td>{folder.isOnline ? 'Yes' : 'No'}</td>
                                        ) : (
                                            <td></td>
                                        )

                                    )
                                }
                               {
                                    (config && currentPath === "/") && (
                                        <td style={{
                                            width: '20%',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'normal',
                                            // textAlign: `${folder.url ? 'left' : 'center'}`
                                            }}
                                        >
                                            {folder.url || "-"}
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
                                                {
                                                    cat !== "computer" && (
                                                        <li>
                                                            <div onClick={(e) => handleShare(folder)}>
                                                                Share / File Information
                                                            </div>
                                                        </li>
                                                    )
                                                }
                                                {
                                                    (config || folder?.owner?.email === "me") && (
                                                        <>
                                                            {/*{*/}
                                                            {/*    (config && currentPath === "/" && folder.type === "folder") && (*/}
                                                            {/*       <li>*/}
                                                            {/*            <div onClick={(e) => handleRename(folder)} >*/}
                                                            {/*                Rename*/}
                                                            {/*            </div>*/}
                                                            {/*       </li>*/}
                                                            {/*    )*/}
                                                            {/*}*/}
                                                            <li>
                                                                <div onClick={(e) => {
                                                                    // e.stopPropagation()
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
        </>
    )
}
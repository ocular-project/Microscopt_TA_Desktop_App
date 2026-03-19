import {faEllipsisVertical} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import styles from "../../css/table.module.css"
import {useEffect, useState} from "react";
import axiosInstance from "../../utils/files/axiosInstance.js";
import css from "../../css/general.module.css";
import { formatDate } from '../../utils/files/FormatDate.js'
import {useLocation, useParams} from "react-router-dom";
import Folders from "./tables/Folders.jsx";
import Teams from "./tables/Teams.jsx";
import { fetchTeamsData, refreshQuota } from "../../utils/files/RepeatingFiles.jsx";

export default function Table({ cat, setLoader, folders, setFolders, teams, setTeams, setLinks, setScreen, setIsPop,
                                  setFile, setMessage, setIsView, isView, setRename, config, checkedIds, setCheckedIds, quota, setQuota }){

    const [error, setError] = useState(null)
    const location = useLocation()
    const { folderId } = useParams();
    const files = ["folder", "shared", "computer"]

    const isNullOrEmpty = !folders || folders.length === 0
    const isNullOrEmptyTeam = !teams || teams.length === 0

    const fetchData = async () => {
        // console.log("currentPath")
        setLoader(true)
        try{
            let response;
            if (config) {
                response = await window.electronAPI.getFoldersAndFiles(folderId || null);
                if (!response.success) {
                     setError(response.error);
                     return
                }
                 setFolders(response.data.folders)
                 setLinks(response.data.path)
                // console.log(response.data.folders)
            }
            else {
                response = await axiosInstance.get('folders', {
                    params: {
                        parentId: folderId || "" // Will be undefined for root folders
                    }
                })
                 setFolders(response.data.folders)
                 setLinks(response.data.path)

                await refreshQuota(setQuota, setMessage, setLoader)
            }
            // console.log(response.data.folders)

        }catch (err) {
            // console.log(err.response)
            const error = err.response?.data?.error || 'An error occurred'
            setMessage({show: true, message:  error, status: "error"})
        }finally {
            setLoader(false)
        }
    }

    useEffect(() => {
        const excludedPaths = ['/teams', '/sharedFiles'];
        const currentPath = location.pathname;
        const isExcludedPath = excludedPaths.some(excludedPath =>
            currentPath.startsWith(excludedPath)
        );
        // console.log(currentPath)
        if (!isExcludedPath) {
            if (isView.view === false) {
                fetchData()
            }
        }

        else if(location.pathname.startsWith("/sharedFiles")){
            const fetchData2 = async () => {
                setLoader(true)
                const parentId = folderId === 'sharedFiles' ? null : folderId;
                try{
                    const response = await axiosInstance.get('shared-files', {
                        params: {
                            parentId: parentId // Will be undefined for root folders
                        }
                    })
                    // console.log(response)
                    // console.log(response.data)
                    setFolders(response.data.folders)
                    setLinks(response.data.path)

                    await refreshQuota(setQuota, setMessage, setLoader)

                }catch (err) {
                    // console.log(err.response)
                    const error = err.response?.data?.error || 'An error occurred'
                    setMessage({show: true, message:  error, status: "error"})
                }finally {
                    setLoader(false)
                }
            }

            fetchData2()
        }

    }, [folderId, isView]);

    useEffect(() => {
         if (location.pathname === "/teams") {
              fetchData2()
         }
    }, []);

    async function fetchData2() {
        await fetchTeamsData(setLoader, setTeams, setMessage, setQuota)
        await refreshQuota(setQuota, setMessage, setLoader)
    }

    return (
        <div className={styles.main}>
            {
                files.includes(cat) ? (
                    <div className={styles.main2}>
                        {
                            error ? (
                                <div className={css.error}></div>
                            ) : isNullOrEmpty ? (
                                <div className={css.error}>There are no folders or files</div>
                            ) : (
                                <Folders folders={folders} setLoader={setLoader} setMessage={setMessage} setFolders={setFolders}
                                         setScreen={setScreen} setIsPop={setIsPop} setFile={setFile} setIsView={setIsView}
                                         setRename={setRename} config={config} cat={cat} setCheckedIds={setCheckedIds}
                                         checkedIds={checkedIds} setQuota={setQuota}
                                />
                            )
                        }

                    </div>
                ) : (
                    <div className={styles.main2}>
                        {
                             error ? (
                                <div className={css.error}></div>
                            ) : isNullOrEmptyTeam ? (
                                <div className={css.error}>There are no teams</div>
                            ) : (
                                <Teams teams={teams} setLoader={setLoader} setMessage={setMessage} setTeams={setTeams} setScreen={setScreen} setIsPop={setIsPop}/>
                             )
                        }

                    </div>
                )
            }

        </div>
    )
}
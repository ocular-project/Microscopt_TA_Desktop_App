import Header from "./Header.jsx";
import Links from "./Links.jsx";
import TableInfo from "./TableInfo.jsx";
import Table from "./Table.jsx";
// import Tablex from "./myComputer/Table.jsx";
// import TableY from "./Devices/Table.jsx";
import styles from "../css/popup.module.css"
import {useEffect, useState} from "react";
import CreateFolder from "./popUps/CreateFolder.jsx";
import css from "../../css/general.module.css";
import TeamCreate from "./popUps/TeamCreate.jsx";
import Share from "./popUps/Share.jsx";
import Success from "./Success.jsx";
import ImageView from "./annotation/ImageView.jsx";
import TeamInfo from "./popUps/TeamInfo.jsx";
import FileInfo from "./popUps/FileInfo.jsx";
import Path from "./popUps/Path";
import Delete from "./popUps/Delete";
import Rename from "./popUps/Rename";
import {handleMessage} from "../../utils/repeating";
import Move from "./popUps/Move";
import DeleteFile from "./popUps/DeleteFile.jsx";

export default function Container({ cat, setIsView, isView, message, setMessage, config }){

    const [isPop, setIsPop] = useState(false)
    const [screen, setScreen] = useState({folderCreate: false, teamCreate: false, share: false,
        teamInfo: false, fileInfo: false, id: "", pathCreate: false, delete: false, rename: false, move: false, deleteFile: false})
    const [loader, setLoader] = useState(false)
    const [loader2, setLoader2] = useState(false)
    const [folder, setFolder] = useState({name: "", parentId: ""})
    const [rename, setRename] = useState({name: "", parentId: "", folderId: "", folderPath: ""})
    const [folders, setFolders] = useState([])
    const [teams, setTeams] = useState([])
    const [error, setError] = useState(null)
    const [links, setLinks] = useState([])
    const [file, setFile] = useState({})
    // const [message, setMessage] = useState([])
    const [checkedIds, setCheckedIds] = useState([]);

    const [devices, setDevices] = useState([])
    const [systemStatus, setSystemStatus] = useState({
        adb: null,
        scrcpy: null
    })

    useEffect(() => {
        if (!isPop) {
            setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, fileInfo: false,
                id: "", pathCreate: false, delete: false, rename: false, move: false, deleteFile: false});
            setFile({})
        }
    }, [isPop]);


    return (
        <>
            <Header cat={cat} />
            <Links setScreen={setScreen} setIsPop={setIsPop} cat={cat} setLoader={setLoader2}
                   loader={loader2} links={links} setFolders={setFolders} setMessage={setMessage}
                   setCheckedIds={setCheckedIds} checkedIds={checkedIds} config={config}
            />
            <TableInfo cat={cat} systemStatus={systemStatus} config={config}/>

            <Table cat={cat} setLoader={setLoader2} folders={folders} setFolders={setFolders}
                        setTeams={setTeams} teams={teams} setLinks={setLinks}
                        setScreen={setScreen} setIsPop={setIsPop} setFile={setFile} setMessage={setMessage}
                        setIsView={setIsView} isView={isView} setRename={setRename} config={config}
            />

            <div className={`${styles.popup} ${isPop ? styles.active : ""}`}>
                <div className={styles.popDiv}>
                     <div className={`${css.loader} ${loader ? css.active : ""}`}></div>
                    {
                        screen.pathCreate ? (
                           <Path setIsPop={setIsPop} setLoader={setLoader} setMessage={setMessage} config={config} />
                        ) : screen.folderCreate ? (
                           <CreateFolder setIsPop={setIsPop} setLoader={setLoader} folder={folder} setFolder={setFolder} setFolders={setFolders} setMessage={setMessage} cat={cat} config={config} />
                        ) : screen.teamCreate ? (
                            <TeamCreate setIsPop={setIsPop} setLoader={setLoader} setTeams={setTeams} setMessage={setMessage} setScreen={setScreen}/>
                        ) : screen.teamInfo ? (
                            <TeamInfo setIsPop={setIsPop} setLoader={setLoader} setMessage={setMessage} setScreen={setScreen} screen={screen} setTeams={setTeams}/>
                        ) : screen.fileInfo ? (
                            <FileInfo setIsPop={setIsPop} setLoader={setLoader} setMessage={setMessage} setScreen={setScreen} screen={screen}/>
                        ) : screen.delete ? (
                            <Delete setIsPop={setIsPop} setLoader={setLoader} setMessage={setMessage} setScreen={setScreen}
                                    screen={screen} file={file} setFolders={setFolders} folders={folders} setFile={setFile}
                                    setCheckedIds={setCheckedIds} checkedIds={checkedIds} config={config} />
                        ) : screen.rename ? (
                           <Rename setIsPop={setIsPop} setLoader={setLoader} rename={rename} setRename={setRename} setFolders={setFolders} setMessage={setMessage} cat={cat} config={config} />
                        ) : screen.share ? (
                            <Share setIsPop={setIsPop} setLoader={setLoader} file={file} screen={screen} setFolders={setFolders} setScreen={setScreen}/>
                        ) : screen.move ? (
                           <Move setIsPop={setIsPop} setLoader={setLoader} rename={rename} setRename={setRename} setFolders={setFolders} setMessage={setMessage} cat={cat} />
                        ) : screen.deleteFile ? (
                            <DeleteFile setIsPop={setIsPop} setLoader={setLoader} setMessage={setMessage} setScreen={setScreen} setFolders={setFolders} cat={cat} file={file}/>
                        ) : null
                    }

                </div>
            </div>
            {/*<Success message={message} setMessage={setMessage}/>*/}
        </>
    )
}
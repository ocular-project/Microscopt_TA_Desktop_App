import Header from "./Header.jsx";
import Links from "./Links.jsx";
import TableInfo from "./TableInfo.jsx";
import Table from "./Table.jsx";
import TableUSB from "./USB/Table";
import Tablex from "./myComputer/Table.jsx";
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

export default function Container({ cat, setIsView, isView }){

    const [isPop, setIsPop] = useState(false)
    const [loader2, setLoader2] = useState(false)
    const [links, setLinks] = useState([])
    const [screen, setScreen] = useState({folderCreate: false, teamCreate: false, share: false, teamInfo: false, fileInfo: false, id: "", pathCreate: false})
    const [message, setMessage] = useState({show: false, message: "", status: ""})

    useEffect(() => {
        if (!isPop) {
            setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, fileInfo: false, id: "", pathCreate: false});
        }
    }, [isPop]);

    return (
        <>
            <Header cat={cat} />
            <Links setScreen={setScreen} setIsPop={setIsPop} cat={cat} setLoader={setLoader2}
                   loader={loader2} links={links} setMessage={setMessage} />

            <TableInfo cat={cat} />
            <TableUSB setLoader={setLoader2}/>

            <Success message={message} setMessage={setMessage}/>
        </>
    )
}
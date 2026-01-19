import styles from "../css/general.module.css"
import Sidebar from "./Sidebar.jsx";
import Header from "./body/Header.jsx";
import Container from "./body/Container.jsx";
// import ImageView from "./body/annotation/ImageView.jsx";
import {useEffect, useState} from "react";
import Success from "./body/Success.jsx";

export default function Folder(){

    const [isView, setIsView] = useState({view: false, files: [], fileId: ""})
    const [message, setMessage] = useState([])
    const [config, setConfig] = useState(false)

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer1}>
                <Sidebar cat="folder" config={config}/>
            </div>
            <div className={styles.innerContainer2}>
                <div className={styles.content}>
                    <Container cat="folder" setIsView={setIsView} isView={isView} message={message} setMessage={setMessage} config={config}/>
                </div>
            </div>
            {/*{*/}
            {/*    isView.view &&*/}
            {/*    <ImageView isView={isView} setIsView={setIsView} setMessage={setMessage}/>*/}
            {/*}*/}
             <Success message={message} setMessage={setMessage}/>
        </div>
    )
}
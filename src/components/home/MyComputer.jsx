import {useState} from "react";
import styles from "../css/general.module.css";
import Sidebar from "./Sidebar.jsx";
import Container from "./body/Container.jsx";
import Success from "./body/Success.jsx";

export default function MyComputer({ path, setPath }){

    const [isView, setIsView] = useState({view: false, files: [], fileId: ""})
    const [message, setMessage] = useState([])
    const [config, setConfig] = useState(true)

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer1}>
                <Sidebar cat="computer" config={config} />
            </div>
            <div className={styles.innerContainer2}>
                <div className={styles.content}>
                    <Container cat="computer" setPath={setPath} setIsView={setIsView} isView={isView} message={message} setMessage={setMessage} config={config} path={path}/>
                </div>
            </div>
             <Success message={message} setMessage={setMessage}/>
        </div>
    )
}
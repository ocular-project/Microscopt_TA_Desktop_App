import {useState} from "react";
import styles from "../css/general.module.css";
import Sidebar from "./Sidebar.jsx";
import Container from "./body/Container.jsx";
import Success from "./body/Success.jsx";

export default function MyComputer(){

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
                    <Container cat="computer" setIsView={setIsView} isView={isView} message={message} setMessage={setMessage} config={config}/>
                </div>
            </div>
             <Success message={message} setMessage={setMessage}/>
        </div>
    )
}
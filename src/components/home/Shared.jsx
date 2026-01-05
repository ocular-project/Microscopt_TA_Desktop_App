import styles from "../css/general.module.css";
import Sidebar from "./Sidebar.jsx";
import Container from "./body/Container.jsx";
import {useState} from "react";
import Success from "./body/Success.jsx";
// import ImageView from "./annotation/ImageView.jsx";

export default function Shared(){

    const [isView, setIsView] = useState({view: false, files: [], fileId: ""})
    const [message, setMessage] = useState([])

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer1}>
                <Sidebar cat="shared" />
            </div>
            <div className={styles.innerContainer2}>
                <div className={styles.content}>
                    <Container cat="shared" message={message} setMessage={setMessage} setIsView={setIsView} isView={isView} />
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
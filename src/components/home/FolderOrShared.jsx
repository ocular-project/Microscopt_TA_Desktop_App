import {useState} from "react";
import Success from "./body/Success.jsx";
import Container from "./body/Container.jsx";
import Sidebar from "./Sidebar.jsx";
import styles from "../css/general.module.css"

export default function FolderOrShared({ cat }) {
    const [isView, setIsView] = useState({ view: false, files: [], fileId: "" });
    const [message, setMessage] = useState([]);
    const [quota, setQuota] = useState(null);
    const [config, setConfig] = useState(false)

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer1}>
                <Sidebar cat={cat} quota={quota} />
            </div>

            <div className={styles.innerContainer2}>
                <div className={styles.content}>
                    <Container
                        cat={cat}
                        setIsView={setIsView}
                        isView={isView}
                        message={message}
                        setMessage={setMessage}
                        quota={quota}
                        setQuota={setQuota}
                        config={config}
                    />
                </div>
            </div>

            {/* Optional ImageView */}
            {/* isView.view && <ImageView isView={isView} setIsView={setIsView} setMessage={setMessage} /> */}

            <Success message={message} setMessage={setMessage} />
        </div>
    )
}
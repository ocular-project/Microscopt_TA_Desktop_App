import styles from "../css/general.module.css";
import Sidebar from "./Sidebar.jsx";
import Container from "./body/Container.jsx";

export default function Team(){
    return (
        <div className={styles.container}>
            <div className={styles.innerContainer1}>
                <Sidebar cat="team" />
            </div>
            <div className={styles.innerContainer2}>
                <div className={styles.content}>
                    <Container cat="team" />
                </div>
            </div>
        </div>
    )
}
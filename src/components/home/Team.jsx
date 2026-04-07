import styles from "../css/general.module.css";
import Sidebar from "./Sidebar.jsx";
import Container from "./body/Container.jsx";

export default function Team({ path, setPath }){
    return (
        <div className={styles.container}>
            <div className={styles.innerContainer1}>
                <Sidebar cat="team" />
            </div>
            <div className={styles.innerContainer2}>
                <div className={styles.content}>
                    <Container cat="team" path={path} setPath={setPath}/>
                </div>
            </div>
        </div>
    )
}
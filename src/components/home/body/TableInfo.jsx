import styles from"../../css/general.module.css"
import css from "../../css/general.module.css";

export default function TableInfo({ cat, systemStatus }){
    return (
        <>
            {
                cat === "device" ? (
                    systemStatus.adb && systemStatus.scrcpy ? (
                        <div className={styles.tableInfo}>
                            <h1>All connected mobile devices</h1>
                            <p>Overview of all connected devices</p>
                        </div>
                    ) : null
                ) : (
                    <div className={styles.tableInfo}>
                         {
                            cat === "computer" ? (
                                <>
                                    <h1>All folders and files</h1>
                                    <p>Overview of every folder/ file on your computer</p>
                                </>
                            ) : cat === "folder" ? (
                                <>
                                    <h1>All folders and files</h1>
                                    <p>Overview of every folder/ file you uploaded</p>
                                </>
                            ) : cat === "team" ? (
                                <>
                                    <h1>Teams</h1>
                                    <p>Overview of all teams you either created or you were invited to</p>
                                </>
                            ) : (
                                 <>
                                    <h1>All folders and files</h1>
                                    <p>Overview of every folder/ file shared with you</p>
                                </>
                            )
                         }
                    </div>
                )
            }
        </>

    )
}
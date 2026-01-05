import styles from "../../myComputer/css/move.module.css"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft} from "@fortawesome/free-solid-svg-icons";
import Link from "./Link";
import {sendData} from "../../../../utils/repeating";

export default function Computer({ files, setFiles, setLoader, setError, path, rename, setMessage }){

    async function handleBack() {
         const obj = {
            name: "",
            parentId: files.folder.parentId,
            folderId: rename.folderId,
            folderPath: path
        }
        await sendData(setError, setLoader, setFiles, obj)
    }

    if (files && Object.keys(files).length > 0) {
        return (
            <div>

                <div className={styles.current}>
                    <p className={styles.currentText}>Current location:</p>
                    <div className={styles.location}>
                         <img className={styles.img} src="/images/folder.png" alt=""/>
                        {
                            files.folder && Object.keys(files.folder).length > 0 ? (
                                <p>{files.folder.name}</p>
                            ) : (
                                <p>Home</p>
                            )
                        }
                    </div>
                </div>

                <div className={styles.linkBack}>
                    {
                        files.folder && Object.keys(files.folder).length > 0 && (
                            <div className={styles.linkBackDiv} onClick={handleBack}>
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </div>
                        )
                    }
                    {
                        files.folder && Object.keys(files.folder).length > 0 ? (
                            <p>{files.folder.name}</p>
                        ) : (
                            <p>Home</p>
                        )
                    }
                </div>

                <hr style={{ marginTop: '8px' }}/>

                <div className={styles.list}>
                    {
                        !!files.folders.length ? (
                            files.folders.map((file, index) => (
                                <Link key={index} file={file} index={index} setFiles={setFiles} setLoader={setLoader}
                                      setError={setError} path={path}
                                />
                            ))
                        ) : (
                            <div className={styles.empty}>
                                <p>This folder is empty</p>
                            </div>
                        )
                    }
                </div>

                {/*<div className={styles.links}>*/}
                {/*    <ul>*/}
                {/*        <li>home</li>*/}
                {/*        {*/}
                {/*            files.folder && Object.keys(files.folder).length > 0 && (*/}
                {/*                files.folder.parentPath.map((path, index) => (*/}
                {/*                    <li key={index}>*/}
                {/*                        {path.name}*/}
                {/*                    </li>*/}
                {/*                ))*/}
                {/*            )*/}
                {/*        }*/}
                {/*    </ul>*/}
                {/*</div>*/}

            </div>
        )
    }

    return (
        <div className={styles.empty}>
            <p>Please wait...</p>
        </div>
    )

}
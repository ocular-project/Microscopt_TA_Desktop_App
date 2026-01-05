import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import css from "../../../css/general.module.css";
import csss from "../myComputer/css/computer.module.css";
import Button from "../../../utils/Button";
import {useState} from "react";
import Input from "../myComputer/Input";

export default function Path({ setIsPop, setLoader, setMessage }){

    const [error, setError] = useState(null)
    const [path, setPath] = useState("")

     const handleCancel = () => {
        setIsPop(false)
    }

    async function handleSave () {
        setError(null)
        setLoader(true)
        try {
            const result = await window.electronAPI.savePath(path);

            if (result) {
                setPath("")
                setIsPop(false)
            }
            else {
                setError("Failed to save folder path")
            }
        } catch (error) {
            console.error('Failed to save folder path:', error);
            setError("Failed to save folder path")
        }finally {
            setLoader(false)
        }
    }

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    <h1>Selecting a folder</h1>
                    <p>Please choose the location where you want to save your folders and images.</p>
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>

            <hr/>

             <Input value={path} setError={setError} onchange={(val => setPath(val))} />

             {
                error && <div className={css.error}>{error}</div>
             }

            <hr/>

            <div className={styles.buttons}>
                <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                <Button text="Save Location" status="active" onClick={handleSave} />
            </div>

        </div>
    )
}
import styles from "./css/computer.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useRef} from "react";

export default function Input({ value, onchange, setError }){

    const handleSelectFolder = async () => {
        try {
            const selectedPath = await window.electronAPI.selectFolder();

            if (selectedPath) {
                onchange(selectedPath)
            }
            else {
                setError("Path is null")
            }
        } catch (error) {
            console.error('Failed to select folder:', error);
            setError("Failed to select path")
        }
    };

    return (
        <div className={styles.main}>
            <input type="text" className={styles.input} readOnly value={value}/>
            <div className={styles.inputDiv} onClick={handleSelectFolder}>
                <span>Browse</span>
            </div>
        </div>
    )
}
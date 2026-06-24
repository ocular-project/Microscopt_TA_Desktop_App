import { AiOutlineExclamationCircle } from "react-icons/ai";
import styles from "./helper.module.css"

export default function Warning1(){
    return (
        <div className={styles.main}>
            <AiOutlineExclamationCircle className={styles.icon} />
            <div className={styles.divText}>
                <h4>Quick manual entry</h4>
                <p>Press the TAB key after each email to add multiple people at once.</p>
            </div>
        </div>
    )
}
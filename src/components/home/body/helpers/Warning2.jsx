import { AiOutlineExclamationCircle } from "react-icons/ai";
import styles from "./helper.module.css"

export default function Warning2(){
    return (
        <div className={styles.main}>
            <AiOutlineExclamationCircle className={styles.icon} />
            <div className={styles.divText}>
                <h4>Bulk upload requirements</h4>
                <p>Ensure your file has columns named "First Name", "Last Name" and "Email"</p>
            </div>
        </div>
    )
}
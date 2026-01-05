import { AiOutlineExclamationCircle } from "react-icons/ai";
import styles from "./helper.module.css"

export default function Warning(){
    return (
        <div className={styles.main}>
            <AiOutlineExclamationCircle className={styles.icon} />
            <div className={styles.divText}>
                <h4>How to add more email addresses</h4>
                <p>After entering your email, press the <strong>TAB</strong> key to enter another email</p>
            </div>
        </div>
    )
}
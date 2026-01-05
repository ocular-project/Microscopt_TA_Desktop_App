import styles from "../css/input.module.css"
import {faEye, faEyeSlash} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useState} from "react";

export default function Input({ title, category, value, onChange }){

    const[eye, setEye] = useState(false)

    const handleChange = () => {
        setEye(!eye)
    }

     const handleChange2 = (e) => {
        const val = e.target.value
        onChange(val)
    }

    return (
        <div className={styles.main}>
            <p>{title}</p>
            {
                category === "input" ? (
                    <input className={styles.input} type="text" value={value} onChange={handleChange2}/>
                ) : category === "textarea" ? (
                    <textarea className={styles.textarea} value={value} onChange={handleChange2}/>
                ) : (
                    <div className={styles.inputDiv}>
                        <input type={eye ? "text" : "password"} value={value} onChange={handleChange2}/>
                        <span onClick={handleChange}>
                            {
                                eye ? (
                                    <FontAwesomeIcon icon={faEye} />
                                ) : (
                                    <FontAwesomeIcon icon={faEyeSlash} />
                                )
                            }

                        </span>
                    </div>
                )
            }

        </div>
    )
}
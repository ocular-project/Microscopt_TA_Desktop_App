import styles from "./css/account.module.css";
import css from "../css/general.module.css";
import Input from "../utils/Input.jsx";
import {config} from "../utils/files/config.js";
import Button from "../utils/Button.jsx";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {validateEmail} from "../utils/functions.jsx";
import axiosInstance from "../utils/files/axiosInstance.js";

export default function Forgot(){

    const [error, setError] = useState(null)
    const [loader, setLoader] = useState(false)
    const navigate = useNavigate();
    const [email, setEmail] = useState("")
    const [msg, setMsg] = useState(null)

    async function handleSubmit() {
        setError(null)
        setMsg(null)
        if (email === ""){
            setError("Please provide an email address")
            return
        }
        if (!validateEmail(email)) {
            setError("Please provide a valid email")
            return
        }

        setLoader(true)
        const obj = {
            email
        }
        try {
            const response = await axiosInstance.post('forgot-password', obj)
            setMsg(response.data.message)
        }catch (err){
            console.log(err.response)
            setError(err.response?.data?.error || 'An error occurred');
        }finally {
            setLoader(false)
        }
    }

    return (
        <div className={styles.main}>
            <div className={styles.section}>
                <div className={`${css.loader} ${loader ? css.active : ""}`}></div>

                <div className={styles.sectionText}>
                    <h1>Forgot Password</h1>
                    <p>Please provide your email address</p>
                </div>

                {
                    msg && (
                        <div className={styles.msg}>
                            {msg}
                        </div>
                    )
                }


                <div className={styles.inputs}>
                    <Input title="Email" category="input" value={email}
                           onChange={(obj) => setEmail(obj)}/>
                </div>

                <div className={styles.lower}>
                    <div></div>
                    <div style={{ textDecoration: 'underline' }} onClick={() => navigate('/login')}>
                        Sign In
                    </div>
                </div>

                {
                    error && <div className={css.error}>{error}</div>
                }

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button text="Submit" status="active" area={true} onClick={handleSubmit}/>
                </div>
            </div>
        </div>
    )
}
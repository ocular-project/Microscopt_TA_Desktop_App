import styles from "./css/account.module.css";
import css from "../css/general.module.css";
import Input from "../utils/Input.jsx";
import Button from "../utils/Button.jsx";
import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {validateEmail} from "../utils/functions.jsx";
import axiosInstance from "../utils/files/axiosInstance.js";

export default function Reset(){

    const [cred, setCred] = useState({password: "", confirm: ""})
    const [error, setError] = useState(null)
    const [loader, setLoader] = useState(false)
    const navigate = useNavigate();
    const { userId } = useParams();

    async function handleSubmit () {
        setError(null)
        const hasEmptyFields = Object.values(cred).some(value => value.trim() === "");
        if (hasEmptyFields) {
            setError("Please fill in all fields")
            return
        }
        if (cred.password !== cred.confirm) {
           setError("Passwords don't match")
            return
        }

        if (!userId) {
            setError("User Id not provided")
            return
        }

        setLoader(true)
        const obj = {
            password: cred.password,
            id: userId
        }
        try {
            await axiosInstance.post('reset-password', obj)
            navigate('/login')
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
                    <h1>New Password</h1>
                    <p>Please provide your new Password</p>
                </div>

                <div className={styles.inputs}>
                    <Input title="Password" category="password" value={cred.password}
                           onChange={(obj) => setCred({...cred, password: obj})}/>
                    <Input title="Confirm Password" category="password" value={cred.confirm}
                           onChange={(obj) => setCred({...cred, confirm: obj})}/>
                </div>

                {
                    error && <div className={css.error}>{error}</div>
                }

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                    <Button text="Reset Password" status="active" area={true} onClick={handleSubmit}/>
                </div>
            </div>
        </div>
    )
}
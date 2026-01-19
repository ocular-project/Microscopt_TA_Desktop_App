import Input from "../utils/Input.jsx";
import css from "../css/general.module.css";
import Button from "../utils/Button.jsx";
import styles from "./css/account.module.css"
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import { validateEmail } from "../utils/functions.jsx"
import axiosInstance from "../utils/files/axiosInstance.js";
import {configg} from "../utils/files/config";

export default function Login(){

    const [error, setError] = useState(null)
    const [loader, setLoader] = useState(false)
    const navigate = useNavigate();
    const [cred, setCred] = useState({email: "", password: ""})

    const handleSingUp = () => {
        navigate("/sign_up")
    }

    const handleSubmit = async () => {
        const hasEmptyFields = Object.values(cred).some(value => value.trim() === "");
        if (hasEmptyFields) {
            setError("Please fill in all fields")
            return
        }

        if (!validateEmail(cred.email)) {
           setError("Please provide a valid email")
            return
        }

        setError(null)
        setLoader(true)

        try {
            const response = await axiosInstance.post('auth', cred)
            const data = response.data.user
            // console.log(data)

            if (data.firstName?.length > 0) {
                localStorage.setItem("credentials", JSON.stringify(data))
                navigate('/')
            }
            else {
                navigate('/update_profile')
            }

        }catch (err) {
            console.log(err)
            const error = err.response
            if (error?.status === 400){
                setError(err.response.data.error[0].msg);
            }
            else {
                setError(err.response?.data?.error || 'An error occurred');
            }
        }finally {
            setLoader(false)
        }
    }

    const handleClick = () => {
        navigate('/')
    }


    return (
        <div className={styles.main}>
            <div className={styles.section}>
                <div className={`${css.loader} ${loader ? css.active : ""}`}></div>

                <div className={styles.sectionText}>
                    <h1>Login</h1>
                    <p>Please provide your credentials to access your files</p>
                </div>


                <div className={styles.inputs}>
                    <Input title="Email" category="input" value={cred.email}
                           onChange={(obj) => setCred({...cred, email: obj})}/>
                    <Input title="Password" category="password" value={cred.password}
                           onChange={(obj) => setCred({...cred, password: obj})}/>
                </div>

                <div className={styles.lower}>
                    {
                        configg() ? (
                            <div onClick={handleClick}>
                                My Computer
                            </div>
                        ) : (
                            <div>

                            </div>
                        )
                    }
                    <div style={{ textDecoration: 'underline' }} onClick={() => navigate('/forgot_password')}>
                        Forgot Password
                    </div>
                </div>

                {
                    error && <div className={css.error}>{error}</div>
                }

                <div className={styles.buttons}>
                    <Button text="Sign Up" status="inactive" area={true} onClick={handleSingUp}/>
                    <Button text="Login" status="active" area={true} onClick={handleSubmit}/>
                </div>
            </div>
        </div>
    )
}
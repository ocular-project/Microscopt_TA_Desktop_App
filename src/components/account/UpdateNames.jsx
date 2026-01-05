import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import styles from "./css/account.module.css";
import css from "../css/general.module.css";
import Input from "../utils/Input.jsx";
import Button from "../utils/Button.jsx";
import {faCheck, faSquare} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {validateEmail} from "../utils/functions.jsx";
import axiosInstance from "../utils/files/axiosInstance.js";
import {getUserData} from "../utils/files/RepeatingFiles.jsx";

export default function UpdateNames(){
    const [error, setError] = useState(null)
    const [loader, setLoader] = useState(false)
    const [check, setCheck] = useState(false)
    const navigate = useNavigate();
    const [cred, setCred] = useState({firstName: "", lastName: ""})

    const handleLogin = () => {
        navigate("/login")
    }

    const handleUpdate = async () => {
        const hasEmptyFields = Object.values(cred).some(value => value.trim() === "");
        if (hasEmptyFields) {
            setError("Please fill in all fields")
            return
        }

        setError(null)
        const data = {
            firstName: cred.firstName,
            lastName: cred.lastName
        }
        setLoader(true)
        try{
            const response = await axiosInstance.put(`users`, data)
            const resp = response.data
            console.log(resp)
            localStorage.setItem("credentials", JSON.stringify(resp))
            navigate('/')
        }catch (err){
            console.log(err.response)
            const error = err.response
            if (error.status === 400){
                setError(err.response.data.error[0].msg);
            }
            else {
                setError(err.response?.data?.error || 'An error occurred');
            }
        }finally {
            setLoader(false)
        }

    }

    return (
        <div className={styles.main}>
            <div className={styles.section}>
                <div className={`${css.loader} ${loader ? css.active : ""}`}></div>

                <div className={styles.sectionText}>
                    <h1>Complete Profile</h1>
                    <p>Please provide your first and last name</p>
                </div>

                <div>
                    <div className={styles.divider}>
                        <Input title="First name" category="input" value={cred.firstName}
                           onChange={(obj) => setCred({...cred, firstName: obj})}/>
                        <Input title="Last name" category="input" value={cred.lastName}
                           onChange={(obj) => setCred({...cred, lastName: obj})}/>
                    </div>

                </div>

                {
                    error && <div className={css.error}>{error}</div>
                }

                <div className={styles.buttons} style={{ marginTop: '50px' }}>
                    <Button text="Login" status="inactive" area={true} onClick={handleLogin}/>
                    <Button text="Update profile" status="active" area={true} onClick={handleUpdate}/>
                </div>
            </div>
        </div>
    )
}
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import styles from "./css/account.module.css";
import css from "../css/general.module.css";
import Input from "../utils/Input.jsx";
import Button from "../utils/Button.jsx";
import {faCheck, faSquare} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {validateEmail} from "../utils/functions.jsx";
import axiosInstance from "../utils/files/axiosInstance.js";

export default function SignUp(){
    const [error, setError] = useState(null)
    const [loader, setLoader] = useState(false)
    const [check, setCheck] = useState(false)
    const navigate = useNavigate();
    const [cred, setCred] = useState({email: "", password: "",
        confirm: "", firstName: "", lastName: ""})

    const handleLogin = () => {
        navigate("/login")
    }

    const handleCheck = () => {
        setCheck(!check)
    }

    const handleSignUp = async () => {
        const hasEmptyFields = Object.values(cred).some(value => value.trim() === "");
        if (hasEmptyFields) {
            setError("Please fill in all fields")
            return
        }
        if (!validateEmail(cred.email)) {
           setError("Please provide a valid email")
            return
        }
        if (cred.password !== cred.confirm) {
           setError("Passwords don't match")
            return
        }
        // if (!check) {
        //     setError("Please accept the terms and conditions")
        //     return
        // }

        setError(null)
        const data = {
            email: cred.email,
            password: cred.password,
            firstName: cred.firstName,
            lastName: cred.lastName
        }
        setLoader(true)
        try{
            await axiosInstance.post('users/create', data)
            navigate('/login')
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
                    <h1>Sign Up</h1>
                    <p>Please create an account with us</p>
                </div>


                <div>
                    <div className={styles.divider}>
                        <Input title="First name" category="input" value={cred.firstName}
                           onChange={(obj) => setCred({...cred, firstName: obj})}/>
                        <Input title="Last name" category="input" value={cred.lastName}
                           onChange={(obj) => setCred({...cred, lastName: obj})}/>
                    </div>
                     <Input title="Email" category="input" value={cred.email}
                           onChange={(obj) => setCred({...cred, email: obj})}/>
                    <Input title="Password" category="password" value={cred.password}
                           onChange={(obj) => setCred({...cred, password: obj})}/>
                     <Input title="Confirm Password" category="password" value={cred.confirm}
                           onChange={(obj) => setCred({...cred, confirm: obj})}/>
                </div>

                <div className={styles.check}>
                {/*   <span className={`${styles.checkSpan} ${check ? styles.active : ""}`} onClick={handleCheck}>*/}
                {/*        <FontAwesomeIcon icon={faCheck} className={styles.checkSpanIcon} />*/}
                {/*   </span>*/}
                {/*   <p>*/}
                {/*       By checking this box you are accepting the <span>Terms and Conditions</span>*/}
                {/*   </p>*/}
                </div>

                {
                    error && <div className={css.error}>{error}</div>
                }

                <div className={styles.buttons} style={{ marginTop: '50px' }}>
                    <Button text="Login" status="inactive" area={true} onClick={handleLogin}/>
                    <Button text="Sign Up" status="active" area={true} onClick={handleSignUp}/>
                </div>
            </div>
        </div>
    )
}
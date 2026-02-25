import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import styles from "../css/header.module.css"
import {useEffect, useRef, useState} from "react";
import css from "../../css/general.module.css";
import axiosInstance from "../../utils/files/axiosInstance.js";
import {useNavigate} from "react-router-dom";
import {getUserData} from "../../utils/files/RepeatingFiles.jsx";

export default function Header({ cat }){

    const files = ["folder", "shared", "computer"]
    const [cred, setCred] = useState({})
    const [vis, setVis] = useState(false)
    const mainRightRef = useRef(null)
    const navigate = useNavigate();
    const [loader, setLoader] = useState(true)

    const getFirstLetters = (first, last) => {
        const fs = first ? first.charAt(0).toUpperCase() : "-";
        const ls = last ? last.charAt(0).toUpperCase() : "-";

        return `${fs}${ls}`;
    };


    const handleClickOutSide = (event) => {
        if (mainRightRef.current && !mainRightRef.current.contains(event.target)){
            setVis(false)
        }
    }


    useEffect(() => {
        setCred(getUserData("credentials"));
        // console.log("data: ", getUserData("credentials"))
        document.addEventListener("mousedown", handleClickOutSide)
        return () => {
            document.addEventListener("mousedown", handleClickOutSide)
        }

    }, []);

    const handleLogout = async () => {
        try {
            await axiosInstance.post('auth/logout')

        }catch (err) {
            console.log(err)
        }finally {
            if (localStorage.getItem("credentials")) {
                localStorage.removeItem("credentials");
            }
            navigate("/login")
        }
    }

     const handleLogin = async () => {
        navigate("/login")
     }

     const handleSignup = async () => {
        navigate("/sign_up")
     }

    return (
        <div className={styles.main}>
            <div className={styles.mainLeft}>
                {
                     files.includes(cat) ? (
                         <div className={styles.mainLeftDiv}>
                              <div className={styles.leftSpan}>
                                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                              </div>
                              <input type="text" placeholder="Search for file or folder"/>
                         </div>
                     ) : null
                }

            </div>
            <div className={styles.mainRight} ref={mainRightRef}>
                <span onClick={() => setVis(!vis)} className={`${vis ? styles.active : ""}`}>{ getFirstLetters(cred?.firstName, cred?.lastName) }</span>
                <div className={`${styles.mainList} ${vis ? styles.active : ""}`} >

                    {
                        cred.firstName ? (
                            <>
                                <div className={styles.divHeader}>
                                    <p>{cred?.firstName} {cred?.lastName}</p>
                                    <p>{cred?.email}</p>
                                </div>


                                <ul>
                                    <li>
                                        <div onClick={handleLogout}>
                                            Logout
                                        </div>
                                    </li>
                                    <li>
                                        <div>
                                            Delete account
                                        </div>
                                    </li>
                                </ul>
                            </>
                        ) : (
                            <ul style={{ width: '150px' }}>
                                <li>
                                    <div onClick={handleLogin}>
                                        Login
                                    </div>
                                </li>
                                <li>
                                    <div onClick={handleSignup}>
                                        Create account
                                    </div>
                                </li>
                            </ul>
                        )
                    }



                </div>
            </div>
        </div>
    )
}
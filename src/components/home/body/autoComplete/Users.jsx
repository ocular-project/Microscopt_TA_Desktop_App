import styles from './css/autoDiv.module.css'
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useEffect, useRef, useState} from "react";
import {validateEmail} from "../../../utils/functions.jsx";

export default function Users({ en, users, heading, selectedUsers, setSelectedUsers, file, updateEmailList = () => {} }){

    // const [team, setTeam] = useState({name: "", emails: []})
    const [value, setValue] = useState(null)
    const [matchingUsers, setMatchingUsers] = useState([])
    const inputRef = useRef(null)

    const handleBlur = () => {
        // console.log('clikedd')
        if (value) {
            // console.log(value)
            const email = value.trim()
            // console.log(users)
            const emailExists = users.some(user => user.email === email);
            // console.log(emailExists)
            if (validateEmail(email) && !emailExists){
                const us = {
                    _id: "",
                    firstName: "",
                    lastName: "",
                    email: email
                }
                handleEmailClick(us)
            }
        }
    }

    const handleChange = (e) => {
        const inputValue = e.target.value
        setValue(inputValue)

        if (inputValue){
            const lowerInput = inputValue.toLowerCase()

             const filtered = users.filter(user =>
                 user._id !== file?.owner?._id &&
                !selectedUsers.some(selected => selected._id === user._id) && (
                    (user.email && user.email.split('@')[0].toLowerCase().includes(lowerInput)) ||
                    (user.firstName && user.firstName.toLowerCase().includes(lowerInput)) ||
                    (user.lastName && user.lastName.toLowerCase().includes(lowerInput))
                 )
            )

            // console.log(filtered)
            setMatchingUsers(filtered)
        }
        else {
            setMatchingUsers([])
        }
    }

    const handleEmailClick = (user) => {
        setSelectedUsers(prev => [...prev, user])
        setMatchingUsers([])
        setValue("")
        inputRef.current.focus()

        const email = user.email
        updateEmailList(email)
    }

    const handleDelete = (userX) => {
        const updatedList = selectedUsers.filter(user => user._id !== userX._id)
        setSelectedUsers(updatedList)

        const email = userX.email
        updateEmailList(email)
    }

    const getFirstLetter = (first) => {
        const fs = first ? first.charAt(0).toUpperCase() : "-";
        return `${fs}`;
    };

    return (
       <div className={styles.main}>
           <p>{heading}</p>
           <div className={styles.input}>
               {
                   selectedUsers.length > 0 && (
                       <span className={styles.inputSpan1}>
                           <ul>
                               {
                                   selectedUsers
                                       .map(user => (
                                       <li key={user._id}>
                                           <div className={styles.inputSpanDiv}>
                                               {
                                                   user.firstName? (
                                                       <span>{user.firstName} {user.lastName}</span>
                                                   ) : (
                                                       <span>{user.email}</span>
                                                   )
                                               }

                                               <div className={styles.inputSpanDivIcon} onClick={() => handleDelete(user)}>
                                                   <FontAwesomeIcon icon={faXmark} />
                                               </div>
                                           </div>
                                       </li>
                                   ))
                               }
                           </ul>
                       </span>
                   )
               }
               <span className={styles.inputSpan2}>
                   <input type="text" placeholder={en} value={value || ""}
                          onChange={handleChange}
                          ref={inputRef}
                          onBlur={handleBlur}/>
               </span>
           </div>
            {
                matchingUsers.length > 0 && (
                    <div className={styles.list}>
                        <ul>
                            {
                                matchingUsers.map(user => (
                                    <li key={user._id} onClick={() => handleEmailClick(user)}>
                                        <div className={styles.userDiv}>
                                            <div className={styles.userDiv1}>
                                                {user.firstName? getFirstLetter(user.firstName) : getFirstLetter(user.email)}
                                            </div>
                                            <div className={styles.userDiv2}>
                                                {
                                                    user.firstName? (
                                                        <div>{user.firstName} {user.lastName}</div>
                                                    ) : (
                                                        <div>{user.email}</div>
                                                    )
                                                }
                                                <div>{user.email}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                )
            }
        </div>
    )
}
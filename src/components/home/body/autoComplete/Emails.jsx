import styles from './css/autoDiv.module.css'
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {useRef, useState} from "react";
import {validateEmail} from "../../../utils/functions.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export default function Emails({ emails, people, setPeople, cat, en }){

    const inputRef = useRef(null)
    const [value, setValue] = useState(null)
    const [matchingEmails, setMatchingEmails] = useState([])

     const handleChange = (e) => {
        const inputValue = e.target.value
        setValue(inputValue)

        if (inputValue){
            console.log(emails)
             const filteredData = emails
                 .filter(email => !people.includes(email))
                 .filter(email => {
                     const username = email.split('@')[0]
                     return username.toLowerCase().includes(inputValue.toLowerCase())
                 }
             )
            setMatchingEmails(filteredData)
        }
        else {
            setMatchingEmails([])
        }

    }

    const handleEmailClick = (clickedEmail) => {
        setPeople([...people, clickedEmail])
        // setSelectedEmails([...selectedEmails, clickedEmail])
        setMatchingEmails([])
        setValue("")
        inputRef.current.focus()
    }

    const handleDelete = (deleteEmail) => {
        const updatedList = people.filter(email => email !== deleteEmail)
        setPeople(updatedList)
    }

    const handleBlur = () => {
        if (value) {
            const email = value.trim()
            if (validateEmail(email) && !people.includes(email)){
                handleEmailClick(email)
            }
        }
    }

    return (
        <div className={styles.main}>
            <p>{cat}</p>
            <div className={styles.input}>
                <span className={styles.inputSpan1}>
                     {
                           people.length > 0 && (
                               <ul>
                                   {
                                       people.map(email => (
                                           <li key={email}>
                                               <div className={styles.inputSpanDiv}>
                                                   <span>{email}</span>
                                                   <div className={styles.inputSpanDivIcon} onClick={() => handleDelete(email)}>
                                                       <FontAwesomeIcon icon={faXmark} />
                                                   </div>
                                               </div>
                                           </li>
                                       ))
                                   }
                               </ul>
                           )
                     }
                </span>
                 <span className={styles.inputSpan2}>
                   <input type="text" placeholder={en} value={value || ""}
                          onChange={handleChange}
                          ref={inputRef}
                          onBlur={handleBlur}/>
                 </span>
            </div>
            {
                matchingEmails.length > 0 && (
                    <div className={styles.list}>
                        <ul>
                            {
                                matchingEmails.map(email => (
                                    <li key={email} onClick={() => handleEmailClick(email)}>
                                        {email}
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
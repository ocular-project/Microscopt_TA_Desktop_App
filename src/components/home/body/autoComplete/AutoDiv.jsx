import styles from './css/autoDiv.module.css'
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useRef, useState} from "react";
import {validateEmail} from "../../../utils/functions.jsx";

export default function AutoDiv({ setTeam, team }){

    const emails = ["mchodrine@gmail.com", "mutebichodrine@gmail.com", "sharonNJ@gmail.com"]
    const [value, setValue] = useState(null)
    const [matchingEmails, setMatchingEmails] = useState([])
    const [selectedEmails, setSelectedEmails] = useState([])
    const inputRef = useRef(null)

    const handleChange = (e) => {
        const inputValue = e.target.value
        setValue(inputValue)

        if (inputValue){
             const filteredData = emails
                 .filter(email => !team.emails.includes(email))
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
        setTeam({
            ...team,
            emails: [...team.emails, clickedEmail]
        })
        // setSelectedEmails([...selectedEmails, clickedEmail])
        setMatchingEmails([])
        setValue("")
        inputRef.current.focus()
    }

    const handleDelete = (deleteEmail) => {
        const updatedList = team.emails.filter(email => email !== deleteEmail)
        setTeam({
            ...team,
            emails: updatedList
        })
    }

    const handleBlur = () => {
        if (value) {
            const email = value.trim()
            if (validateEmail(email) && !selectedEmails.includes(email)){
                handleEmailClick(email)
            }
        }
    }

    return (
        <div className={styles.main}>
           <p>Add Team members</p>
           <div className={styles.input}>
               <span className={styles.inputSpan1}>
                   {
                       team.emails.length > 0 && (
                           <ul>
                               {
                                   team.emails.map(email => (
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
                   <input type="text" placeholder="Enter email" value={value || ""}
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
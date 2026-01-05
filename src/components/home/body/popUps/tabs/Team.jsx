import Emails from "../../autoComplete/Emails.jsx";
import styles from "../../autoComplete/css/autoDiv.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";
import {getFirstLetter, getUserData} from "../../../../utils/files/RepeatingFiles.jsx";
import Access from "../Access.jsx";
import Access2 from "../Access2.jsx";
import Users from "../../autoComplete/Users.jsx";

export default function Team({ teams, selectedTeams, setSelectedTeams, team, category, file, cred, setTeam, setLoader, setError }){

    const inputRef = useRef(null)
    const [value, setValue] = useState(null)
    const [matchingUsers, setMatchingUsers] = useState([])

    function handleDelete(index) {
        const updatedList = selectedTeams.filter((team, i) => !i === index)
        setSelectedTeams(updatedList)
    }

    function handleTeamClick(team) {
        setSelectedTeams(prev => ([...prev, team]))
        setMatchingUsers([])
        setValue("")
        inputRef.current.focus()
    }

    function handleChange (e) {
        const inputValue = e.target.value
        setValue(inputValue)

         if (inputValue) {
             const lowerInput = inputValue.toLowerCase()
             const filteredData = teams.filter(team => team.toLowerCase().includes(lowerInput))
             setMatchingUsers(filteredData)
         }
         else {
             setMatchingUsers([])
         }
    }

    function handleBlur () {
         setValue("")
    }

    return (
        <div>

            <div className={styles.main}>
                       <p>Add team</p>
                       <div className={styles.input}>
                           {
                               selectedTeams.length > 0 && (
                                   <span className={styles.inputSpan1}>

                                       <ul>
                                           {
                                               selectedTeams.map((team, i) => (
                                                   <li key={i}>
                                                       <div className={styles.inputSpanDiv}>
                                                           <span>{team}</span>
                                                           <div className={styles.inputSpanDivIcon} onClick={() => handleDelete(i)}>
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
                               <input type="text" placeholder="Enter team name" value={value || ""}
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
                                            matchingUsers.map((team, i) => (
                                                <li key={i} onClick={() => handleTeamClick(team)}>
                                                    <div className={styles.userDiv}>
                                                        <div className={styles.userDiv1}>
                                                            {getFirstLetter(team)}
                                                        </div>
                                                        <div className={styles.userDiv2}>
                                                            <div>{team}</div>
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

            <Access2 shared={team} setShared={setTeam} category={category} cred={cred} file={file} setLoader={setLoader} setError={setError} setTeam={setTeam} />
        </div>
    )
}
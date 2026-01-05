import styles from "../body/autoComplete/css/autoDiv.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";
import {validateEmail} from "../../utils/functions.jsx";
import {getFirstLetter} from "../../utils/files/RepeatingFiles.jsx";

export default function Teams({ en, teams, selectedTeams, setSelectedTeams, file, heading, updateTeamList = () => {} }){
    
    const [value, setValue] = useState(null)
    const [matchingTeams, setMatchingTeams] = useState([])
    const inputRef = useRef(null)

    useEffect(() => {
        console.log(teams)
    }, [teams]);

    const handleBlur = () => {
        setValue("")
    }
    
    const handleTeamClick = (team) => {
        setSelectedTeams(prev => ([...prev, team]))
        setMatchingTeams([])
        setValue("")
        inputRef.current.focus()

        updateTeamList(team)
    }

    const handleChange = (e) => {
        const inputValue = e.target.value
        setValue(inputValue)

         if (inputValue) {
             const lowerInput = inputValue.toLowerCase()
             const filteredData = teams.filter(team =>
                 !selectedTeams.some(selected => selected === team) &&
                 (team.toLowerCase().includes(lowerInput))
             )
             // const dt = filteredData.map(item => item.name)
             setMatchingTeams(filteredData)
         }
         else {
             setMatchingTeams([])
         }
    }
    
    const handleDelete = (name) => {
        const updatedList = selectedTeams.filter(team => team !== name)
        setSelectedTeams(updatedList)
        updateTeamList(name)
    }
    
    return (
       <div className={styles.main}>
           <p>{heading}</p>
           <div className={styles.input}>
               {
                   selectedTeams.length > 0 && (
                        <span className={styles.inputSpan1}>
                           <ul>
                               {
                                   selectedTeams.map((team, i) => (
                                       <li key={i}>
                                           <div className={styles.inputSpanDiv}>
                                               {
                                                   <span>{team}</span>
                                               }

                                               <div className={styles.inputSpanDivIcon} onClick={() => handleDelete(team)}>
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
                matchingTeams.length > 0 && (
                    <div className={styles.list}>
                        <ul>
                            {
                                matchingTeams.map((team,i) => (
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
    )
}
import {useEffect, useState} from "react";
import styles from "../../../css/table.module.css";
import {formatDate} from "../../../utils/files/FormatDate.js";
import {faEllipsisVertical} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import {getUserData} from "../../../utils/files/RepeatingFiles.jsx";
import {handleMessage} from "../../../utils/repeating.js";

export default function Teams({ teams, setLoader, setMessage, setTeams, setScreen, setIsPop }){

    const [cred, setCred] = useState({})
    const [selectedId, setSelectedId] = useState(null);
    const [selectedIconId, setSelectedIconId] = useState(null);

    const getPopupPosition = (index) => {
        // Adjust these numbers based on your needs
        if (index < 2) {
            return 'top';
        } else if (index > teams.length - 3) {
            return 'bottom';
        }
        return '';
    };

     const handleClick = (team) => {
        setSelectedId(team._id);
        setSelectedIconId(null)
    };

    const handleDoubleClick = (team) => {
        setSelectedId(null);
    };

    const handleIconClick = (team) => {
        setSelectedIconId(team._id);
        setSelectedId(team._id);
    }

    const handleDelete = async (team) => {
        setLoader(true)
        try {
            await axiosInstance.delete(`teams/${team._id}`)
            const updatedList = teams.filter(teamItem => teamItem !== team)
            setTeams(updatedList)
            // setMessage({show: true, message: "Team delete successfully", status: "success"})
            handleMessage("Team delete successfully", "success", setMessage)
        }catch (err) {
            console.log(err.response)
            const error = err.response?.data?.error || 'An error occurred'
            // setMessage({show: true, message:  error, status: "error"})
            handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
            setSelectedId(null)
            setSelectedIconId(null)
        }
    }

    function handleInfo(team) {
        setIsPop(true)
        setScreen(prev => ({...prev, teamInfo: true, id: team._id}))
        setSelectedId(null)
        setSelectedIconId(null)
    }

     useEffect(() => {
        setCred(getUserData("credentials"));
    }, []);

    return (
       <table>
           <thead>
                <tr>
                    <th>Name</th>
                    <th>Creator</th>
                    <th>Members</th>
                    <th>Updated</th>
                    <th className={styles.thIcon}>Action</th>
                </tr>
            </thead>
           <tbody>
            {
                teams.map((team, index) => (
                    <tr
                        key={team._id}
                        onClick={() => handleClick(team)}
                        onDoubleClick={() => handleDoubleClick(team)}
                        className={`${selectedId === team._id ? styles.tr : ""}`}
                    >
                        <td>{team.name}</td>
                        {
                            cred?.email === team.owner.email || team.owner.email === "me" ? (
                                <td>Me</td>
                            ) : (
                                <td>{team.owner.firstName} {team.owner.lastName}</td>
                            )
                        }

                        <td>{team.totalMembers} members</td>
                        <td>{formatDate(team.updatedAt)}</td>
                        <td className={`${styles.tdIcon}`} >
                            <div className={styles.action}>
                                <div className={`${styles.iconDiv} ${selectedIconId === team._id ? styles.active : ""}`}
                                     onClick={(e) => {
                                         e.stopPropagation()
                                         handleIconClick(team)
                                     }}
                                >
                                    <FontAwesomeIcon icon={faEllipsisVertical} />
                                </div>
                                <div className={`
                                    ${styles.popAction} 
                                    ${selectedIconId === team._id ? styles.active : ""} 
                                    ${styles[getPopupPosition(index)]}
                                `}>
                                    <ul>
                                        {
                                            team.owner.email === cred.email && (
                                                <li>
                                                    <div onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(team)
                                                    }}>
                                                        Delete team
                                                    </div>
                                                </li>
                                            )
                                        }

                                        <li>
                                            <div onClick={(e) => {
                                                e.stopPropagation()
                                                handleInfo(team)
                                            }}>
                                                More about the team
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </td>
                    </tr>
                ))
            }
            </tbody>
       </table>
    )
}
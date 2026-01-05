import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown, faXmark} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import css from "../../../css/general.module.css";
import Users from "../autoComplete/Users.jsx";
import Button from "../../../utils/Button.jsx";
import {getUserData} from "../../../utils/files/RepeatingFiles.jsx";
import Access from "./Access.jsx";

export default function TeamInfo({ setScreen, setIsPop, setLoader, setMessage, screen, setTeams}){

    const [team, setTeam] = useState({})
    const [error, setError] = useState(null)
    const [users, setUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [update, setUpdate] = useState({emails: [], members: []})
    const list = ['Tutor', 'Annotator', 'Remove member']
    const [vis, setVis] = useState("")
    const roleRef = useRef()
    const [cred, setCred] = useState({})

    const handleCancel = () => {
        setIsPop(false)
        setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});
    }

    useEffect(() => {
         const handleClickOutside = (event) => {
            if (
                roleRef.current && !roleRef.current.contains(event.target)
            ) {
                setVis("");
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoader(true)
            setError(null)
            setCred(getUserData("credentials"));
            try {
                const response = await axiosInstance.get(`teams/${screen.id}`)
                const data = response.data
                console.log(data)
                setTeam(data)

                const response2 = await axiosInstance.get('users')
                const data2 = response2.data

                const teamsUserIds = data.members.map(member => member.user._id.toString())
                const filteredUsers = data2.filter(user => !teamsUserIds.includes(user._id.toString()))
                setUsers(filteredUsers)

            } catch (err) {
                console.log(err.response? err.response : err);
                setError(err.response?.data?.error || 'An app error occurred');
            } finally {
                setLoader(false);
            }
        }

        fetchData()
    }, []);

    async function handleUpdate () {
        setError(null)

        if (update.emails.length === 0 && update.members.length === 0) {
            setIsPop(false)
            setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});
            setMessage({show: true, message: "Nothing was updated", status: "warning"})
            return
        }

        setLoader(true)
        console.log(update)
        try {
           const response = await axiosInstance.put(`teams/${screen.id}`, update)
           const data = response.data.team
            setTeams(prev =>
               prev.map(tem =>
                   tem._id === data._id ? data : tem
           ))
           setIsPop(false)
           setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});

        }catch (err) {
            console.log(err.response? err.response : err);
            setError(err.response?.data?.error || 'An error occurred');

        }
        finally {
            setLoader(false)
        }

    }

     useEffect(() => {
        const emails = selectedUsers.map(user => user.email)
        setUpdate(prev => ({
            ...prev,
            emails
        }));
     }, [selectedUsers]);

    useEffect(() => {
        setUpdate(prev => ({
            ...prev,
            members: team.members
        }));
    }, [team]);

    const getFirstLetter = (first) => {
        const fs = first ? first.charAt(0).toUpperCase() : "-";
        return `${fs}`;
    };

    function handleVis(_id, index, event) {
        event.stopPropagation()
        setVis(prev => {
            return prev === _id ? "" : _id;
        });
    }

    const getPopupPosition = (team, index) => {
        // Adjust these numbers based on your needs
        if (index === 0) {
            return 'top';
        } else {
            return 'bottom';
        }
    };

    function handleClick2 (_id, li, event) {
        event.stopPropagation()
        if (li === "Remove member") {
            setTeam(prev => {
                const updatedMembers = prev.members.filter(member => member._id !== _id )
                return {
                    ...prev,
                    members: updatedMembers
                }
            })
            setVis("")
            return
        }
        setTeam(prev => {
            const members = prev.members.map(member =>
                member._id === _id
                    ? {...member, annotationRole: li}
                    : member
            )
            return {
                ...prev,
                members
            }
        })
        setVis("")
    }

    return (
        <div className={styles.main}>
            {
                cred?._id === team.owner?._id ? (
                    <>
                        <div className={styles.header}>
                            <div className={styles.headerDiv1}>
                                <h1>Team information ({team? team.name : ""})</h1>
                                <p>Update this team's information.</p>
                            </div>
                            <div className={styles.mainSpan} onClick={handleCancel}>
                                <FontAwesomeIcon icon={faXmark} />
                            </div>
                        </div>

                         <hr/>

                        {
                            team.name? (
                                <div>
                                    <div>
                                        <Users users={users} en="Enter email or name" heading="Add members" setSelectedUsers={setSelectedUsers} selectedUsers={selectedUsers} />
                                    </div>
                                    <div className={styles.team}>
                                        <p>Team members</p>
                                        <div className={styles.teamDiv}>
                                            <ul>
                                                {
                                                    team.members.map((member, index) => (
                                                        <li key={member._id}>
                                                            <div className={styles.userDiv}>
                                                                <div className={styles.userDivX}>
                                                                    <div className={styles.userDiv1}>
                                                                        {member.user.firstName? getFirstLetter(member.user.firstName) : getFirstLetter(member.user.email)}
                                                                    </div>
                                                                    <div className={styles.userDiv2}>
                                                                    {
                                                                        member.user.firstName? (
                                                                            <div>{member.user.firstName} {member.user.lastName}</div>
                                                                        ) : (
                                                                            <div>{member.user.email}</div>
                                                                        )
                                                                    }
                                                                    <div>{member.user.email}</div>
                                                                </div>
                                                                </div>

                                                                {
                                                                    team.owner.email === member.user.email ? (
                                                                        <div className={styles.userDivX2}>
                                                                            <div className={styles.roleDiv} ref={roleRef}>
                                                                                <div className={styles.role2} style={{ cursor: 'none' }}>
                                                                                    <span>{member.annotationRole}/ owner</span>
                                                                                    <span style={{ visibility: 'hidden' }}><FontAwesomeIcon icon={faChevronDown} /></span>
                                                                                </div>

                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={styles.userDivX2}>
                                                                            <div className={styles.roleDiv} ref={roleRef}>
                                                                                <div className={styles.role} onClick={(e) => handleVis(member._id, index, e)}>
                                                                                    <span>{member.annotationRole}</span>
                                                                                    <span style={{ transform: vis===member._id ? 'rotate(180deg)' : '' }}><FontAwesomeIcon icon={faChevronDown} /></span>
                                                                                </div>
                                                                                <div className={`${styles.roleList} ${vis === member._id ? styles.active : ""} ${styles[getPopupPosition(team, index)]}`} >
                                                                                    <ul>
                                                                                        {
                                                                                            list.map((li, i) => (
                                                                                                <li key={i} onClick={(e) => handleClick2(member._id, li, e)}>
                                                                                                    {li}
                                                                                                </li>
                                                                                            ))
                                                                                        }
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                }

                                                            </div>
                                                        </li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        }

                        {
                            error && <div className={css.error}>{error}</div>
                        }

                        <div className={styles.buttons}>
                <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                <Button text="Updat team info" status="active" onClick={handleUpdate} />
            </div>
                    </>
                ) : (
                    <>

                        <div className={styles.header}>
                            <div className={styles.headerDiv1}>
                                <h1>Team information</h1>
                                <p>{team? team.name : ""}</p>
                            </div>
                            <div className={styles.mainSpan} onClick={handleCancel}>
                                <FontAwesomeIcon icon={faXmark} />
                            </div>
                        </div>

                         <hr/>

                        <>
                        </>
                        {
                            team.name? (
                                <div>
                                    <Access shared={team.members} cred={cred} />
                                </div>
                            ) : null
                        }

                        {
                            error && <div className={css.error}>{error}</div>
                        }

                        <div className={styles.buttons}>

                        </div>
                    </>
                )
            }

        </div>
    )
}
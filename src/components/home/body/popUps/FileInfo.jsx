import {useEffect, useState} from "react";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {getUserData} from "../../../utils/files/RepeatingFiles.jsx";
import People from "./tabs/People.jsx";
import Team from "./tabs/Team.jsx";
import css from "../../../css/general.module.css";
import Button from "../../../utils/Button.jsx";

export default function FileInfo({ setIsPop, setLoader, setMessage, setScreen, screen }){

    const [error, setError] = useState(null)
    const [folder, setFolder] = useState({})
    const [tab, setTab] = useState(1)
    const [cred, setCred] = useState({})
    const [share, setShare] = useState({people: [], group: [], fileId: "", teams: [], users: []})
    const [users, setUsers] = useState([])
    const [teams, setTeams] = useState([])
    const [shared, setShared] = useState([])
    const [team, setTeam] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [selectedTeams, setSelectedTeams] = useState([])

    useEffect(() => {
        const emails = selectedUsers.map(user => user.email)
        setShare({...share, people: emails})
    }, [selectedUsers]);

    useEffect(() => {
        setShare({...share, group: selectedTeams})
    }, [selectedTeams]);

    useEffect(() => {
        setShare({...share, teams: team})
    }, [team]);

    useEffect(() => {
        setShare({...share, users: shared})
    }, [shared]);

     const handleCancel = () => {
        setIsPop(false)
        setSelectedUsers([])
        setSelectedTeams([])
        setScreen(prev => ({...prev, share: false}));
    }

    const handleShare = async () => {

        setError(null)

        setLoader(true)
        try {
            await axiosInstance.post('folders/share2', share)
            setSelectedUsers([])
            setSelectedTeams([])
            setShare({people: [], group: [], fileId: "", teams: [], users: []})
            setIsPop(false)
            setScreen(prev => ({...prev, fileInfo: false,  id: ""}));
        }catch (err) {
            console.log(err)
            setError(err.response?.data?.error || 'An error occurred');
        }finally {
            setLoader(false)
        }

    }

    const fetchData = async () => {
        setError(null)
        setLoader(true);
        setTeam([])
        setShare({...share, fileId: screen.id})
        setCred(getUserData("credentials"));

        try {
            const response = await axiosInstance.get('teams');
            // console.log(response.data);
            const data = response.data

            const response3 = await axiosInstance.get(`fileShare/${screen.id}`)
            const data3 = response3.data
            setFolder(data3)
            console.log(data3)
            setShared(data3.shared_with)
            setTeam(data3.shared_with_team)
            // console.log(data3.shared_with)

            const response2 = await axiosInstance.get('users')
            const data2 = response2.data

            const sharedWithUserIds = data3.shared_with.map(item => item.user._id)
            const filteredUsers = data2.filter(user => !sharedWithUserIds.includes(user._id))
            setUsers(filteredUsers);
            // console.log(response2.data)

            const sharedWithTeamIds = data3.shared_with_team.map(item => item.team._id)
            const filteredTeams = data.filter(team => !sharedWithTeamIds.includes(team._id))
            const names = filteredTeams.map(file => file.name);
            setTeams(names);

        } catch (err) {
            console.log(err);
            setError(err.response?.data?.error || 'An error occurred');
        } finally {
            setLoader(false);
        }
    }

    useEffect( () => {
        if (screen.fileInfo){
            fetchData()
        }
    }, [screen]);

    return (
        <>
            {
                folder && folder.name && (
                    <div className={styles.main}>
                        <div className={styles.header}>
                            <div className={styles.headerDiv1}>
                                <div className={styles.headerDiv1X}>
                                    <div className={styles.headerDiv11}>
                                        <img src={`${folder.type === "file" ? "/images/image.png" : "/images/folder.png"}`} alt=""/>
                                    </div>
                                    <div>
                                        <h1>{folder.name}</h1>
                                         {
                                            cred?._id === folder.owner._id ? (
                                                <p>Owner: Me</p>
                                            ) : (
                                                <p>Owner: {folder.owner.firstName} {folder.owner.lastName}</p>
                                            )
                                        }
                                    </div>
                                </div>

                            </div>
                            <div className={styles.mainSpan} onClick={handleCancel}>
                                <FontAwesomeIcon icon={faXmark} />
                            </div>
                        </div>

                        <hr/>

                        <div className={styles.tabDiv}>
                            <div className={`${styles.tabDivInfo} ${tab === 1 ? styles.active : ""}`} onClick={() => setTab(1)}>
                                People
                            </div>
                            <div className={`${styles.tabDivInfo} ${tab === 2 ? styles.active : ""}`} onClick={() => setTab(2)}>
                                Teams
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            {
                                tab === 1 ? (
                                    <People users={users} setUsers={setUsers} setSelectedUsers={setSelectedUsers} selectedUsers={selectedUsers}
                                            shared={shared} setShared={setShared} category={true} file={folder} cred={cred}/>
                                ) : (
                                    <Team teams={teams} setSelectedTeams={setSelectedTeams} selectedTeams={selectedTeams} team={team} setTeam={setTeam} category={true} file={folder} cred={cred}/>
                                )
                            }
                        </div>

                        {
                        error && <div className={css.error}>{error}</div>
                     }

                    <hr/>

                    <div className={styles.buttons}>
                        {
                            cred?._id === folder?.owner._id && (
                                <>
                                    <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                                    <Button text="Update" status="active" onClick={handleShare} />
                                </>
                            )
                        }

                    </div>

                    </div>
                )
            }
        </>

    )
}
import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import css from "../../../css/general.module.css";
import Button from "../../../utils/Button.jsx";
import {useEffect, useState} from "react";
import Emails from "../autoComplete/Emails.jsx";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import People from "./tabs/People.jsx";
import Team from "./tabs/Team.jsx";
import {getUserData} from "../../../utils/files/RepeatingFiles.jsx";

export default function Share({ setIsPop, file, setLoader, screen, setFolders, setScreen }){

    const [error, setError] = useState(null)
    const [tab, setTab] = useState(1)
    const [share, setShare] = useState({people: [], group: [], fileId: ""})
    const [users, setUsers] = useState([])
    const [teams, setTeams] = useState([])
    const [shared, setShared] = useState([])
    const [folder, setFolder] = useState({})
    const [team, setTeam] = useState([])
    const [cred, setCred] = useState({})
    const [selectedUsers, setSelectedUsers] = useState([])
    const [selectedTeams, setSelectedTeams] = useState([])

    useEffect(() => {
        const emails = selectedUsers.map(user => user.email)
        setShare({...share, people: emails})
    }, [selectedUsers]);

    useEffect(() => {
        setShare({...share, group: selectedTeams})
    }, [selectedTeams]);

    const handleCancel = () => {
        setIsPop(false)
        setSelectedUsers([])
        setSelectedTeams([])
        setScreen(prev => ({...prev, share: false}));
    }

    const handleShare = async () => {

        setError(null)

        if (!share.group.length && !share.people.length){
            setError(`Please provide either the team or people to have access to this ${file.type}`)
            return
        }

        setLoader(true)
        try {
            const response = await axiosInstance.post('folders/share', share)
            setSelectedUsers([])
            setFolders(prev => {
                const updatedList = prev.map(folder => {
                if (folder._id === file._id) {
                    return response.data;
                }
                return folder;
            });
                return [
                    ...updatedList.filter(folder => folder._id === file._id),
                    ...updatedList.filter(folder => folder._id !== file._id)
                ];
            })
            setShare({people: [], group: [], fileId: ""})
            setIsPop(false)
            setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});
        }catch (err) {
            console.log(err.response)
            const error = err.response
            if (error.status === 401){
                setError(err.response.data.error[0].msg);
            }
            else {
                setError(err.response?.data?.error || 'An error occurred');
            }

        }finally {
            setLoader(false)
        }

    }

    const fetchData = async () => {
        setError(null)
        setLoader(true);
        setTeam([])
        setShare({...share, fileId: file._id})
        setCred(getUserData("credentials"));
        try {
            const response = await axiosInstance.get('teams');
            // console.log(response.data);
            const data = response.data

            const response3 = await axiosInstance.get(`fileShare/${file._id}`)
            const data3 = response3.data
            setFolder(data3)
            setShared(data3.shared_with)
            setTeam(data3.shared_with_team)
            // console.log(data3)

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
        if (screen.share){
            fetchData()
        }
    }, [screen]);

    return (
        <div className={styles.main}>
            {
                teams && users && (
                   <>
                    <div className={styles.header}>
                        <div className={styles.headerDiv1}>
                            <h1>Sharing a {file.type} - {file.name}</h1>
                            <p>You can share this {file.type} with either an individual or a team.</p>
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
                                Object.keys(file).length > 0 && (
                                    <People users={users} setUsers={setUsers} setSelectedUsers={setSelectedUsers}
                                        selectedUsers={selectedUsers} shared={shared} file={folder} cred={cred}
                                            setShared={setShared} setLoader={setLoader} setError={setError}/>
                                )
                            ) : (
                                <Team teams={teams} setSelectedTeams={setSelectedTeams} selectedTeams={selectedTeams}
                                      cred={cred} file={folder} team={team} setLoader={setLoader} setError={setError}
                                      setTeam={setTeam}
                                />
                            )
                        }
                    </div>


                     {
                        error && <div className={css.error}>{error}</div>
                     }

                    <hr/>

                    <div className={styles.buttons}>
                        <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                        <Button text="Share" status="active" onClick={handleShare} />
                    </div>
                </>
                )
            }
        </div>
    )
}
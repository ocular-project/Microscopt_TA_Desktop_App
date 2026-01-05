import {useEffect, useState} from "react";
import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../utils/Button.jsx";
import Input from "../../../utils/Input.jsx";
import css from "../../../css/general.module.css";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import AutoDiv from "../autoComplete/AutoDiv.jsx";
import Users from "../autoComplete/Users.jsx";
import Warning from "../helpers/Warning.jsx";

export default function TeamCreate({ setIsPop, setLoader, setTeams, setMessage, setScreen }){

    const [error, setError] = useState(null)
    const [users, setUsers] = useState([])
    const [team, setTeam] = useState({name: "", users: []})
    const [selectedUsers, setSelectedUsers] = useState([])

    const handleCancel = () => {
        setTeam({name: "", users: []})
        setIsPop(false)
        setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});
    }

    const handleCreate = async () => {
        setError(null)
        if (team.name.length === 0 || team.users.length === 0) {
            setError("Please fill in all the fields")
        }
        else {

            setLoader(true)
            try
            {
                const response = await axiosInstance.post('teams', team)
                console.log(response.data)
                setTeam({name: "", users: []})
                setIsPop(false)
                setTeams(prev => [response.data, ...prev])
                setMessage({show: true, message: "Team created successfully", status: "success"})
                setScreen({folderCreate: false, teamCreate: false, share: false, teamInfo: false, id: ""});
            }
            catch (err) {
                console.log(err.response)
                const error = err.response
                if (error.status === 400){
                    setError(err.response.data.error[0].msg);
                }
                else {
                    setError(err.response?.data?.error || 'An error occurred');
                }

            }
            finally {
                setLoader(false)
            }
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoader(true)
            setError(null)
            try {
                const response2 = await axiosInstance.get('users')
                const data = response2.data
                setUsers(data)
                // console.log(data)

            } catch (err) {
                console.log(err.response);
                setError(err.response?.data?.error || 'An error occurred');
            } finally {
                setLoader(false);
            }
        }

        fetchData()
    }, []);

    useEffect(() => {
        const emails = selectedUsers.map(user => user.email)
        setTeam({...team, users: emails})
    }, [selectedUsers]);

return (
        <div className={styles.main}>

            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    <h1>Creating a team</h1>
                    <p>Bring people together by creating a team to collaborate.</p>
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>

             <hr/>

             <Input title="Team name" category="input"
                    value={team.name}
                    onChange={(obj) => setTeam({...team, name: obj})} />

             {/*<AutoDiv setTeam={setTeam} team={team} />*/}
             <Users users={users} en="Enter email or name" heading="Team members" setSelectedUsers={setSelectedUsers} selectedUsers={selectedUsers} />

             <Warning />

             {
                error && <div className={css.error}>{error}</div>
             }


             <hr/>

            <div className={styles.buttons}>
                <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                <Button text="Create Team" status="active" onClick={handleCreate} />
            </div>
        </div>
    )
}
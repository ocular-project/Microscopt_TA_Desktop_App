import styles from "../../css/popup.module.css";
import {getFirstLetter, getUserData} from "../../../utils/files/RepeatingFiles.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";
import Button from "../../../utils/Button.jsx";
import axiosInstance from "../../../utils/files/axiosInstance.js";

export default function Access2({ shared, cred, file, category, setShared, setLoader, setTeam, setError }){

    function handleDelete(team) {
        const updatedList = shared.filter(user => user._id !== team._id)
        setShared(updatedList)
    }

    async function handleRemove(_id) {
        setLoader(true)
        setError(null)
        const obj = {
            memberId: "",
            teamId: _id,
            fileId: file._id
        }
        try {
            const response = await axiosInstance.post('folders/share_delete', obj)
            const data = response.data
            setTeam(data)
        }catch (err) {
            console.log(err.response)
            const error = err.response
            setError(error?.data?.error || 'An error occurred');
        }finally {
            setLoader(false)
        }
    }

    return (
        <div className={styles.team}>
                <p>Teams with access</p>
                <div className={styles.teamDiv}>
                    <ul>
                        {
                            shared.map((member, index) => (
                                <li key={member._id}>
                                     <div className={styles.userDiv} style={{
                                        padding: '10px 10px 10px 10px',
                                        borderRadius: '5px'
                                    }}>
                                        <div className={styles.userDivX}>
                                            <div className={styles.userDiv1}>
                                                {getFirstLetter(member.team.name)}
                                            </div>
                                            <div className={styles.userDiv2}>
                                            <div>{member.team.name}</div>
                                            {
                                               cred._id === member.team.owner._id ? (
                                                   <div>Owner: Me</div>
                                               ) : (
                                                   <div>Owner: {member.team.owner.firstName} {member.team.owner.lastName}</div>
                                               )
                                            }

                                        </div>
                                        </div>
                                         {
                                             cred?._id === file?.owner._id && (
                                                 <div className={styles.userDivX2}>
                                                     <Button text="Remove Team" status="remove" onClick={() => handleRemove(member.team._id)} />
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
    )
}
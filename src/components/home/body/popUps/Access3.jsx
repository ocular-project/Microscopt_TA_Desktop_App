import styles from "../../css/popup.module.css";
import {getFirstLetter, getUserData} from "../../../utils/files/RepeatingFiles.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";
import Button from "../../../utils/Button.jsx";
import axiosInstance from "../../../utils/files/axiosInstance.js";

export default function Access3({ shared, category, cred, setShared, file, setLoader, setError }){

    const roleRef = useRef()
    const [vis, setVis] = useState("")
    const list = ['Tutor', 'Annotator', 'Remove member']

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

    function handleClick2(_id, li, event) {
        event.stopPropagation()
        if (li === "Remove member") {
            const updatedList = shared.filter(user => user._id !== _id)
            setShared(updatedList)
            setVis("")
            return
        }
        setShared(prev => {
            return prev.map(member =>
                member._id === _id
                    ? {...member, annotationRole: li}
                    : member
            )
        })
        setVis("")
    }

    async function handleRemove(_id) {
        setLoader(true)
        setError(null)
        const obj = {
            memberId: _id,
            teamId: "",
            fileId: file._id
        }
        try {
            const response = await axiosInstance.post('folders/share_delete', obj)
            const data = response.data
            setShared(data)
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
                <p>People with access</p>
                <div className={styles.teamDiv}>
                    <ul>
                        <li key={file?.owner?._id}>
                            <div className={styles.userDiv} style={{
                                backgroundColor: '#FEF3E7',
                                padding: '10px 10px 10px 10px',
                                borderRadius: '5px'
                            }}>
                                <div className={styles.userDivX}>
                                    <div className={styles.userDiv1} style={{ backgroundColor: 'white' }}>
                                        {file?.owner?.firstName? getFirstLetter(file?.owner?.firstName) : getFirstLetter(file?.owner?.email)}
                                    </div>
                                    <div className={styles.userDiv2}>
                                        <div>Me (Owner)</div>
                                        <div>{file?.owner?.email}</div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        {
                            shared.map((member, index) => (
                                <li key={member._id}>
                                    <div className={styles.userDiv} style={{
                                        backgroundColor: member.user.email === cred?.email ? '#FEF3E7' : '',
                                        padding: '10px 10px 10px 10px',
                                        borderRadius: '5px'
                                    }}>
                                        <div className={styles.userDivX}>
                                            <div className={styles.userDiv1} style={{ backgroundColor: member.user.email === cred?.email ? 'white' : '' }}>
                                                {member.user.firstName? getFirstLetter(member.user.firstName) : getFirstLetter(member.user.email)}
                                            </div>
                                            <div className={styles.userDiv2}>
                                                {
                                                    member.user.firstName? (
                                                        <div>{member.user.firstName} {member.user.lastName}</div>
                                                    ) : (
                                                        <div>{member.user.email.split('@')[0]}</div>
                                                    )
                                                }
                                                <div>{member.user.email}</div>
                                            </div>
                                        </div>
                                        <div className={styles.userDivX2}>
                                              <Button text="Remove Member" status="remove" onClick={() => handleRemove(member.user._id)} />
                                        </div>
                                    </div>
                                </li>
                            ))
                        }
                    </ul>
                </div>
            </div>
    )
}
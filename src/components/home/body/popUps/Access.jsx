import styles from "../../css/popup.module.css";
import {getFirstLetter, getUserData} from "../../../utils/files/RepeatingFiles.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";

export default function Access({ shared, category, cred, file }){

    const roleRef = useRef()

    return (
        <div className={styles.team}>
                <p>People with access</p>
                <div className={styles.teamDiv}>
                    <ul>
                        <li key={file?.owner?._id}>
                            <div className={styles.userDiv} style={{
                                backgroundColor: 'white',
                                padding: '10px 10px 10px 10px',
                                borderRadius: '5px'
                            }}>
                                <div className={styles.userDivX}>
                                    <div className={styles.userDiv1} style={{ backgroundColor: '#FEF3E7' }}>
                                        {file?.owner?.firstName? getFirstLetter(file?.owner?.firstName) : getFirstLetter(file?.owner?.email)}
                                    </div>
                                    <div className={styles.userDiv2}>
                                        <div>{file?.owner?.firstName} {file?.owner?.lastName} (Owner)</div>
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
                                                        <div>{member.user.email}</div>
                                                    )
                                                }
                                                <div>{member.user.email}</div>
                                            </div>
                                        </div>
                                        <div className={styles.userDivX2}>
                                            {/*<div className={styles.roleDiv} ref={roleRef}>*/}
                                            {/*    <div className={styles.role2} style={{ cursor: 'none' }}>*/}
                                            {/*        <span>{member.annotationRole}</span>*/}
                                            {/*        <span style={{ visibility: 'hidden' }}><FontAwesomeIcon icon={faChevronDown} /></span>*/}
                                            {/*    </div>*/}
                                            {/*</div>*/}
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
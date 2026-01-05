import styles from "../css/image.module.css";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {formatDate} from "../../../../utils/files/FormatDate.js";
import {useEffect, useState} from "react";

export default function People({ file, checkedIds, setCheckedIds, cred }){

    const [selectAll, setSelectAll] = useState(false)

    function handleClick (_id) {
        setCheckedIds((prev) => {
            if (prev.includes(_id)) {
                return prev.filter((item) => item !== _id);
            } else {
                return [...prev, _id];
            }
        });
    }

    useEffect(() => {
        if(selectAll) {
            setCheckedIds(
              file.shared_with
                .filter(folder => folder.user._id !== cred?._id) // exclude matching user
                .map(folder => folder.user._id)
            );
        } else {
            setCheckedIds([])
        }
        console.log(file)
    }, [selectAll]);

    useEffect(() => {
        if (checkedIds.length === 0) {
            setSelectAll(false)
        }
    }, [checkedIds]);

    return (
        <div>
            <p className={styles.para1}>Select on whoever should have access</p>

            {
                !!checkedIds.length && (
                    <div className={styles.selectAll}>
                        <div className={`${styles.select11} ${selectAll ? styles.active : ''}`} onClick={() => setSelectAll(!selectAll)}>
                            <FontAwesomeIcon icon={faCheck} />
                        </div>
                        <span>Select All</span>
                    </div>
                )
            }

            <hr/>

            <div>
                {
                    file?.shared_with
                        ?.filter(fi => fi.user.email !== cred?.email)
                        .map(fi => (
                            <div className={styles.selectDiv} key={fi.user._id}>
                                <div className={styles.select1}>
                                    <div className={`${styles.select11} ${checkedIds.includes(fi.user._id) ? styles.active : ''}`} onClick={() => handleClick(fi.user._id)}>
                                        <FontAwesomeIcon icon={faCheck} />
                                    </div>
                                </div>
                                <div className={styles.select2}>
                                    <h4>{fi.user.firstName} {fi.user.lastName}</h4>
                                    <p>{fi.user.email}</p>
                                </div>
                            </div>
                    ))
                }

            </div>

        </div>
    )
}
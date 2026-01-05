import Users from "../../autoComplete/Users.jsx";
import {useEffect, useRef, useState} from "react";
import styles from "../../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {getFirstLetter, getUserData} from "../../../../utils/files/RepeatingFiles.jsx"
import Access from "../Access.jsx";
import Access3 from "../Access3.jsx";
import Warning from "../../helpers/Warning.jsx";

export default function People({ users, setUsers, setSelectedUsers, selectedUsers, shared, category, file, cred,
                                   setShared, setLoader, setError}){

    // useEffect(() => {
    //     // console.log(cred?._id)
    //     // console.log(file?.owner)
    //     // console.log(file?.owner?._id)
    //     // // if ()
    // }, [file]);

    return (
        <div>

            <Users users={users} en="Enter email or name" heading="Add individuals" setSelectedUsers={setSelectedUsers}
                   selectedUsers={selectedUsers} file={file} />

             <Warning />

            {
                cred?._id === file?.owner?._id ? (
                    <Access3 shared={shared} category={category} cred={cred} setShared={setShared} file={file}
                             setLoader={setLoader} setError={setError}/>
                ) : (
                    <Access shared={shared} category={category} cred={cred} file={file}/>
                )
            }


        </div>
    )
}
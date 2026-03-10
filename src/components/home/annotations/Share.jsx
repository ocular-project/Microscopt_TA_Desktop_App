import styles from "./css/image.module.css";
import {IoCloseCircleOutline, IoShareSocialOutline} from "react-icons/io5";
import Users from "../body/autoComplete/Users.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import React, {useEffect, useState} from "react";
import {handleBack, handleMessage} from "../../utils/repeating.js";
import axiosInstance from "../../utils/files/axiosInstance.js";
import {useNavigate} from "react-router-dom";
import Teams from "./Teams.jsx";

export default function Share({ setShare, share, setMessage, file, access, annotations, cred }){

     const [loader, setLoader] = useState(false)
     const [finalShare, setFinalShare] = useState(false)
     const [users, setUsers] = useState([])
     const [teams, setTeams] = useState([])
     const [selectedUsers, setSelectedUsers] = useState([])
     const [selectedTeams, setSelectedTeams] = useState([])
     const [tab, setTab] = useState(1)
     const [indi, setIndi] = useState(0)
     const [te, setTe] = useState(0)
     const [shared, setShared] = useState({people: [], team: [], annotations: []})
     const [selected, setSelected] = useState([])
     const [selected2, setSelected2] = useState([])
     const navigate = useNavigate()
    const [original1, setOriginal1] = useState(null)
    const [original2, setOriginal2] = useState(null)

    useEffect(() => {
        if (!access?.shared_with) return

        const emails = access.shared_with.map(user => user.email)
        setSelected([...emails])
        setOriginal1([...emails || []])
        setShared(prev => ({ ...prev, people: emails }));

    }, [access?.shared_with?.length]);

    useEffect(() => {
        if (!access?.shared_with_team) return

        // console.log(access.shared_with_team)
        const teams = access.shared_with_team.map(team => team.team.name)
        // console.log(teams)
        setSelected2([...teams])
        setOriginal2([...teams || []])
        setShared(prev => ({ ...prev, team: teams }));

    }, [access?.shared_with_team?.length]);

    function handleClose(){
        setShare(false)
    }

    async function fetchData() {
        setLoader(false)
        try {
            const response = await axiosInstance.get('users')
            const data = response.data
            // console.log(file)
            const filteredData = data.filter(item => !file.shared_with.some(em => em.user._id === item._id))
            setUsers(filteredData)

            const resp = await axiosInstance.get('teams')
            const dat = resp.data
            const filteredData2 = dat.filter(item => !file.shared_with_team.some(em => em.team._id === item._id))
            const dats = filteredData2.map(item => item.name)
            setTeams(dats)

        }catch (err) {
           console.log(err.response)
           const error = err.response.error
           handleMessage(error, "error", setMessage)
       }finally {
           setLoader(false)
       }
    }

    useEffect(() => {
        if(share) {
            fetchData()
        }
    }, [share]);

    // useEffect(() => {
    //     const total = selectedUsers.length
    //     if(!!total){
    //         // setIndi(total)
    //         // setFinalShare(true)
    //         const emails = selectedUsers.map(user => user.email)
    //         // setShared({...share, people: emails})
    //     }
    //     else {
    //         // setFinalShare(false)
    //         // setIndi(0)
    //         // setShared({...share, people: []})
    //     }
    // }, [selectedUsers]);

    function handleEmailSelect(email) {
        setSelected(prev =>
          prev.includes(email)
            ? prev.filter(item => item !== email) // remove
            : [...prev, email] // add
        );

        updateEmailList(email)
    }

    function handleTeamSelect(team) {
        setSelected2(prev =>
          prev.includes(team)
            ? prev.filter(item => item !== team) // remove
            : [...prev, team] // add
        );

        updateTeamList(team)
    }

    function updateTeamList (team) {
        setShared(prev => {
            const exists = prev.team.includes(team);
            return {
              ...prev,
              annotations: prev.annotations.length === 0
                ? annotations
                : prev.annotations,
              team: exists
                ? prev.team.filter(item => item !== team) // remove
                : [...prev.team, team] // add
            };
        })
    }

    function updateEmailList (email) {
        setShared(prev => {
            const exists = prev.people.includes(email);
            return {
              ...prev,
              annotations: prev.annotations.length === 0
                ? annotations
                : prev.annotations,
              people: exists
                ? prev.people.filter(item => item !== email) // remove
                : [...prev.people, email] // add
            };
        })
    }

    useEffect(() => {
        const total = shared.people.length
        const total2 = shared.team.length
        if(!!total){
            setIndi(total)
        }
        else {
            setIndi(0)
        }

        if(!!total2){
            setTe(total2)
        }
        else {
            setFinalShare(false)
            setTe(0)
        }

        if (!!total || !!total2){
            setFinalShare(true)
        }else {
            setFinalShare(false)
        }
    }, [shared]);

    function compareEmails () {
        return
    }

    async function handleShare() {
        console.log(file)
        setLoader(true)
        const originalSet1 = new Set(original1);
        const originalSet2 = new Set(original2);
        const newEmails = shared.people.filter(email => !originalSet1.has(email))
        const newTeams = shared.team.filter(team => !originalSet2.has(team))
        const obj = {
            shared,
            newEmails,
            newTeams
        }

        if (!newEmails.length && !newTeams.length){
            setLoader(false)
            handleMessage("Please add at least one team or one email in addition to the already selected individuals", "warning", setMessage)
            return
        }

        try {

            await axiosInstance.post(`/share-annotations/${file._id}`, obj)
            setShare(false)
            setOriginal1(null)
            setOriginal2(null)
            setShared({people: [], team: [], annotations: []})
            // handleBack(navigate)
        }catch (err) {
            console.log(err.response)
           const error = err.response.data.error
            console.log(error)
           handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
        }
    }


    return (
        <div className={styles.main3}>
           <div className={styles.main4}>
               <div className={`${styles.loader} ${loader ? styles.active : ""}`}></div>
               <div className={styles.closeDiv} onClick={handleClose}>
                   <h1 className={styles.closeH1}>Share Annotations</h1>
                   <IoCloseCircleOutline className={styles.close} />
               </div>
               <p className={styles.select}>Select who you want to share your annotations with</p>
               <div className={styles.tabDiv} style={{ marginTop: '20px' }}>
                   <div className={`${styles.tabDivInfo} ${tab === 1 ? styles.active : ""}`} onClick={() => setTab(1)}>
                       Individuals
                   </div>
                   <div className={`${styles.tabDivInfo} ${tab === 2 ? styles.active : ""}`} onClick={() => setTab(2)}>
                       Teams
                   </div>
               </div>

               <div className={styles.tabLoader}>
                   {
                       tab === 1 ? (
                           <>
                              <Users users={users} en="Enter email" heading="Add individuals" setSelectedUsers={setSelectedUsers}
                                  selectedUsers={selectedUsers} file={file} updateEmailList={updateEmailList} />

                               <p className={styles.select} style={{ margin: '10px 0' }}>Individuals with access to the image</p>
                               <div className={styles.emailDiv}>
                                   <ul>
                                       {
                                           file?.owner._id !== cred?._id && (
                                               <li>
                                                   <div className={styles.annotatorDiv}>
                                                       <div className={styles.annotator}>
                                                           <h2>{file.owner.firstName} {file.owner.lastName}</h2>
                                                           <p>{file.owner.email}</p>
                                                       </div>
                                                       <div className={styles.selector}>
                                                           <div className={`${styles.selectorDiv} ${selected.includes(file.owner.email) ? styles.active : ""}`} onClick={() => handleEmailSelect(file.owner.email)}>
                                                               <FontAwesomeIcon icon={faCheck} />
                                                           </div>
                                                           <span>{selected.includes(file.owner.email) ? "Deselect" : "Select"}</span>
                                                       </div>
                                                   </div>
                                               </li>
                                           )
                                       }
                                       {
                                           shared && !!file?.shared_with && file.shared_with
                                               .filter(item => item.user._id !== cred?._id)
                                               .map(item => (
                                                    <li key={item._id}>
                                                       <div className={styles.annotatorDiv}>
                                                           <div className={styles.annotator}>
                                                               <h2>
                                                                   {
                                                                       item.user.firstName ? (
                                                                           `${item.user.firstName} ${item.user.lastName}`
                                                                       ) : (
                                                                            `${item.user.email.split('@')[0]}`
                                                                       )
                                                                   }
                                                               </h2>
                                                               <p>{item.user.email}</p>
                                                           </div>
                                                           <div className={styles.selector}>
                                                               <div className={`${styles.selectorDiv} ${selected.includes(item.user.email) ? styles.active : ""}`} onClick={() => handleEmailSelect(item.user.email)}>
                                                                   <FontAwesomeIcon icon={faCheck} />
                                                               </div>
                                                               <span>{selected.includes(item.user.email) ? "Deselect" : "Select"}</span>
                                                           </div>
                                                       </div>
                                                    </li>
                                           ))
                                       }
                                   </ul>
                               </div>
                           </>
                       ) : (
                           <>
                               <Teams teams={teams} en="Enter team name" selectedTeams={selectedTeams}
                                   setSelectedTeams={setSelectedTeams} heading="Add teams" file={file} updateTeamList={updateTeamList} />

                               <p className={styles.select} style={{ margin: '10px 0' }}>Teams with access to the image</p>
                               <div className={styles.emailDiv}>
                                   <ul>
                                       {
                                           shared && !!file?.shared_with_team && file.shared_with_team.map(item => (
                                               <li key={item._id}>
                                                   <div className={styles.annotatorDiv}>
                                                       <div className={styles.annotator}>
                                                           <h2>{item.team.name}</h2>
                                                           {/*<p>members</p>*/}
                                                       </div>
                                                       <div className={styles.selector}>
                                                           <div className={`${styles.selectorDiv} ${selected2.includes(item.team.name) ? styles.active : ""}`} onClick={() => handleTeamSelect(item.team.name)}>
                                                               <FontAwesomeIcon icon={faCheck} />
                                                           </div>
                                                           <span>{selected2.includes(item.team.name) ? "Deselect" : "Select"}</span>
                                                       </div>
                                                   </div>
                                               </li>
                                           ))
                                       }
                                   </ul>
                               </div>
                           </>
                       )
                   }
                   <div className={styles.buttonsFlex}>
                       <div className={`${styles.buttons} ${finalShare ? styles.active : styles.disabled}`} onClick={handleShare}>
                            <IoShareSocialOutline />
                            <span>Share with {indi} {indi === 1 ? "individual" : "individuals"} and {te} {te === 1 ? "team" : "teams"}</span>
                       </div>
                       <div className={`${styles.buttons}`} onClick={handleClose}>
                            <span>Cancel</span>
                       </div>
                   </div>
               </div>

           </div>
        </div>
    )
}
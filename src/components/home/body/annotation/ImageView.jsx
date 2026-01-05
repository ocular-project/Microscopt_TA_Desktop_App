import styles from "./css/image.module.css"
import style from "../../css/popup.module.css"
import {faChevronLeft, faChevronRight, faUsers, faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useEffect, useState} from "react";
import Image from "./Image.jsx";
import Button from "../../../utils/Button.jsx";
import {useNavigate} from "react-router-dom";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import css from "../../../css/general.module.css";
import {getUserData} from "../../../utils/files/RepeatingFiles.jsx";
import {handleMessage} from "../../../utils/repeating.js";
import {faMessage, faPenToSquare, faUser} from "@fortawesome/free-regular-svg-icons";
import Annotations from "./tabs/Annotations.jsx";
import People from "./tabs/People.jsx";

export default function ImageView({ isView, setIsView, setMessage }){

    const [obj, setObj] = useState({name: "", url: "", annotated: false})
    const [tab, setTab] = useState(1)
    const [tabX, setTabX] = useState(1)
    const [update, setUpdate] = useState(false);
    const [annotations, setAnnotations] = useState([]);
    const [loader, setLoader] = useState(false)
    const navigate = useNavigate();
    const [btnText, setBtnText] = useState("Load annotations")
    const [data, setData] = useState(false)
    const [info, setInfo] = useState({})
    const [canEdit, setCanEdit] = useState(true)
    const [cred, setCred] = useState({})
    const [allow, setAllow] = useState(null)
    const [userId, setUserId] = useState(null)
    const [feedback, setFeedback] = useState([])
    const [vis, setVis] = useState(false)
    const [primary, setPrimary] = useState([])
    const [sec, setSec] = useState("")
    const [btn, setBtn] = useState("save")
    const [feed, setFeed] = useState([])
    const [file, setFile] = useState({})
    const [checkedIds, setCheckedIds] = useState([])

    async function fetchFeedback(_id) {
        const response = await axiosInstance.get('get-feedback', {
            params: {
                annotation: _id
            }
        })

        console.log(response.data)
        const data = response.data.data
        if (data.length === 0) {
            setBtn("save")
            setCanEdit(true)
        }
        else {
            setBtn("share")
            setFeed(data)
            setCanEdit(false)
        }

    }

    useEffect(() => {

        const fetchData = async () => {
             if (isView.fileId){
                const file = isView.files.find(file => file._id === isView.fileId)
                setObj({name: file.name, url: file.url, annotated: file.isAnnotated, owner: file.owner.email})

                 // console.log(file.isAnnotated)
                 const user = getUserData("credentials")
                 setCred(user);
                 // setAllow(null)

                if (file.isAnnotated) {
                     setLoader(true)
                     try {
                        const response = await axiosInstance.get('get-annotations', {
                            params: {
                                imageId: isView.fileId
                            }
                         })

                         const data = response.data
                         const pri = data.primary
                         const sec = data.secondary
                         if (Object.keys(pri).length !== 0) {
                             setPrimary(pri)
                             setAnnotations(pri.annotations)
                             setPrimary([pri, ...sec])

                             console.log(pri)
                             await fetchFeedback(pri._id)
                         }
                         else {
                             setPrimary(sec)
                         }

                     }catch (err) {
                         console.log(err)
                        const error = err.response?.data.error
                        // setMessage({show: true, message: error, status: "error"})
                         handleMessage(error, "error", setMessage)
                         if (error && error === "annotations.jsx not found") {
                             setCanEdit(true)
                         }
                     }finally {
                         setLoader(false)
                     }
                }
                // else {
                //      // setData(true)
                //      // setCanEdit(true)
                //      // setMessage({show: true, message: "You haven't annotated this image", status: "warning"})
                //     handleMessage("You haven't annotated this image", "warning", setMessage)
                // }
            }
        }

        fetchData()

    }, [isView.fileId]);
    //
    // const handleView = () =>{
    //     setIsView({view: false, files:[], fileId: ""})
    //     setObj({name: "", url: ""})
    // }
    //
    const getClassNameLeft = (id) => {
        if (isView.files.length > 1) {
            const index = isView.files.findIndex(file => file._id === id)
            if (index === 0) {
                return styles.leftIcon
            }
            else{
                return `${styles.leftIcon} ${styles.active}`
            }
        }
        else {
            return styles.leftIcon
        }
    }

     const getClassNameRight = (id) => {
        if (isView.files.length > 1) {
            const index = isView.files.findIndex(file => file._id === id)
            if (index === (isView.files.length -1)){
                 return styles.rightIcon
            }
            else {
                return `${styles.rightIcon} ${styles.active}`
            }

        }
        else {
            return styles.rightIcon
        }
    }

    const handleNext = (id) => {
        const index = isView.files.findIndex(file => file._id === id)
        const nextObj = index !== -1 && index < isView.files.length - 1 ? isView.files[index + 1] : null
        if (nextObj){
            setIsView({...isView, fileId: nextObj._id})
        }
    }

    const handlePrev = (id) => {
        const index = isView.files.findIndex(file => file._id === id)
        const prevObj = index > 0 ? isView.files[index - 1] : null
        if (prevObj){
            setIsView({...isView, fileId: prevObj._id})
        }

    }

    const handleSave = async () => {
        if (annotations.length === 0) {
            // setMessage({show: true, message: "Please annotate the image before you save", status: "error"})
             handleMessage("Please annotate the image before you save", "error", setMessage)
            return
        }
        setLoader(true)

        const jsonBody = {
            imageId: isView.fileId,
            annotatorId: cred._id,
            annotations: annotations,
            users: checkedIds
        }

        console.log(jsonBody)

        try {
            await axiosInstance.post('save-annotations', jsonBody)
            setIsView({view: false, files: [], fileId: ""})
            setAnnotations([])
            setCheckedIds([])
            setUpdate(false)
        }catch (err) {
            const error = err.response.data.error
            // setMessage({show: true, message: error, status: "error"})
            handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
        }
    }

    // const handleLoad = async (selectedText, id) => {
    //      if (obj.annotated) {
    //          setLoader(true)
    //
    //          if (selectedText === "My annotations.jsx with feedback") {
    //              setBtnText(selectedText)
    //              try {
    //                  const response = await axiosInstance.get('load-annotations-feedback', {
    //                     params: {
    //                         imageId: isView.fileId,
    //                     }
    //                  })
    //
    //                  // console.log(response.data.annotations)
    //                  // console.log(response.data.feedback)
    //                  setAnnotations(response.data.annotations)
    //                  setFeedback(response.data.feedback)
    //                  setCanEdit(false)
    //                  setAllow(null)
    //
    //              }catch (err) {
    //                 const error = err.response.data.error
    //                 // setMessage({show: true, message: error, status: "error"})
    //                  handleMessage(error, "error", setMessage)
    //              }finally {
    //                  setLoader(false)
    //              }
    //          }
    //          else {
    //              if (selectedText === "My annotations.jsx") {
    //                  setAllow("me")
    //                  setBtnText("My annotations.jsx")
    //              }else {
    //                  setBtnText(`${selectedText.firstName} ${selectedText.lastName}`)
    //              }
    //
    //              try {
    //                 const response = await axiosInstance.get('load-annotations', {
    //                     params: {
    //                         imageId: isView.fileId,
    //                         userKey: id
    //                     }
    //                  })
    //
    //                  const data = response.data
    //                  console.log("annotations.jsx loaded from server:", data);
    //
    //                  setAnnotations(data)
    //                  setFeedback([])
    //
    //                  if (cred?._id === id) {
    //                      // console.log("can edit")
    //                      setCanEdit(true)
    //                      setUserId("")
    //
    //                  }
    //                  else {
    //                       console.log("can not edit")
    //                       setCanEdit(false)
    //                       setUserId(id)
    //                  }
    //
    //
    //              }catch (err) {
    //                 const error = err.response.data.error
    //                 // setMessage({show: true, message: error, status: "error"})
    //                  handleMessage(error, "error", setMessage)
    //              }finally {
    //                  setLoader(false)
    //              }
    //          }
    //      }
    //      else {
    //          setCanEdit(true)
    //          // setMessage({show: true, message: "You haven't annotated this image", status: "warning"})
    //          handleMessage("You haven't annotated this image", "warning", setMessage)
    //      }
    // }
    //

    const handleFeed = async () => {
        if (feedback.length === 0) {
            handleMessage("Please provide feedback to any of the available annotations", "error", setMessage)
            return
        }

        // const hasFeedback = annotations.some(item => Object.keys(item.feedback).length > 0)
        // if (!hasFeedback) {
        //     // setMessage({show: true, message: "Please provide feedback to any of the available annotations", status: "error"})
        //      handleMessage("Please provide feedback to any of the available annotations", "error", setMessage)
        //     return
        // }
        //
        setLoader(true)

        const jsonBody = {
            annotation: sec,
            feedback,
        }

        console.log(jsonBody)

        try {
            await axiosInstance.post('save-feedback', jsonBody)
            setIsView(false)
            setAnnotations([])
        }catch (err) {
            const error = err.response.data.error
            // setMessage({show: true, message: error, status: "error"})
            handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
        }
    }

    //
    // useEffect(() => {
    //     if (canEdit) {
    //         setAllow("me")
    //     }
    //     // else {
    //     //     setAllow("feedback")
    //     // }
    // }, [canEdit]);

    function handleCancel () {
        setUpdate(false)
        setBtn("save")
    }

    async function handleShare () {
        if (checkedIds.length === 0) {
            handleMessage("Please select at least one person or Cancel", "error", setMessage)
        }
        else {
            await handleSave()
        }

    }

    async function handleSaveShare() {
        setLoader(true)
        try {
            const response = await axiosInstance.get(`fileShare/${isView.fileId}`)
            const data = response.data
            console.log(data)
            setBtn("share")
            setUpdate(true)
            const newEntry = {
              annotationRole: "Annotator",
              limitedAccess: false,
              parent: false,
              permission: "view",
              user: {
                email: data.owner.email,
                firstName: data.owner.firstName,
                lastName: `${data.owner.lastName} (Owner/ Tutor)`,
                _id: data.owner._id
              }
            };
            setFile({
                ...data,
                shared_with: [...data.shared_with, newEntry]
            });

        }catch (err) {
            const error = err.response.data.error
            handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
        }
    }

    function handleClose() {
        setIsView({view: false, files: [], fileId: ""})
    }

    return (
        <div className={styles.main}>
            <div  className={styles.main2}>
                {
                    isView.fileId && (
                        <>
                            <div className={styles.image}>
                                {/*<span className={getClassNameLeft(isView.fileId)} onClick={() => handlePrev(isView.fileId)}>*/}
                                {/*    <FontAwesomeIcon icon={faChevronLeft} />*/}
                                {/*</span>*/}
                                <Image obj={obj} annotations={annotations} setAnnotations={setAnnotations} loader={loader}
                                       canEdit={canEdit} cred={cred} setCred={setCred} feedback={feedback}
                                       setFeedback={setFeedback} setAllow={setAllow} feed={feed}/>
                                {/*<span className={getClassNameRight(isView.fileId)} onClick={() => handleNext(isView.fileId)}>*/}
                                {/*    <FontAwesomeIcon icon={faChevronRight} />*/}
                                {/*</span>*/}
                            </div>
                            <div className={styles.imageInfo}>
                                <div className={styles.close}>
                                    <FontAwesomeIcon icon={faXmark} onClick={handleClose} />
                                </div>
                                <div>
                                    <h1 className={styles.imageName}>{obj.name}</h1>
                                    <div className={styles.info}>
                                        <div className={styles.info1}>
                                            <p> <FontAwesomeIcon icon={faUser} />  <span>Owner</span></p>
                                            {/*<p> <FontAwesomeIcon icon={faPenToSquare} />  <span>Annotated by me</span></p>*/}
                                            <p> <FontAwesomeIcon icon={faMessage} />  <span>Feedback</span></p>
                                            <p> <FontAwesomeIcon icon={faUsers} />  <span>Other Annotators</span></p>
                                        </div>
                                        <div className={styles.info2}>
                                            <p>{obj.owner}</p>
                                            {/*{*/}
                                            {/*    obj.annotated ? (*/}
                                            {/*        <p>Yes</p>*/}
                                            {/*    ) : (*/}
                                            {/*        <p>Yes</p>*/}
                                            {/*    )*/}
                                            {/*}*/}
                                            <p>
                                                {
                                                    !!feed.length ? (
                                                        <>Yes</>
                                                    ) : (
                                                        <>Not Available</>
                                                    )
                                                }
                                            </p>
                                            <p>Not Available</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.tabDiv} style={{ marginTop: '20px' }}>
                                    <div className={`${styles.tabDivInfo} ${tab === 1 ? styles.active : ""}`} onClick={() => setTab(1)}>
                                        Annotations
                                    </div>
                                    <div className={`${styles.tabDivInfo} ${tab === 2 ? styles.active : ""}`} onClick={() => setTab(2)}>
                                        Feedback
                                    </div>
                                    <div className={`${styles.tabDivInfo} ${tab === 3 ? styles.active : ""}`} onClick={() => setTab(3)}>
                                        Share
                                    </div>
                                </div>

                                <div className={styles.tabs}>
                                    {
                                        tab === 1 ? (
                                            <Annotations primary={primary} setPrimary={setPrimary} setAnnotations={setAnnotations}
                                                         setLoader={setLoader} setMessage={setMessage} setBtn={setBtn}
                                                         setCanEdit={setCanEdit} setSec={setSec} cred={cred}  />
                                        ) : null
                                    }
                                </div>

                                <div className={styles.buttons}>
                                    {
                                        !!annotations.length && (
                                            btn === "save" ? (
                                                <>
                                                    <Button text="Save annotations" status="save" onClick={handleSave}/>
                                                    <Button text="Save and Share annotations" status="share" onClick={handleSaveShare}/>
                                                </>
                                            ) : btn === "feed" ? (
                                               <Button text="Save Feedback" status="save" onClick={handleFeed}/>
                                            ) : null
                                        )
                                    }
                                </div>
                            </div>
                        </>
                    )
                }
                <div className={`${styles.share} ${update ? styles.active : ''}`}>
                    <div className={styles.close}>
                        <FontAwesomeIcon icon={faXmark} onClick={handleCancel} />
                    </div>

                    <div>
                        <h1 className={styles.imageName}>Share your annotations</h1>
                        <p className={styles.para}>Select the people or teams you can view your annotations and provide feedback</p>
                    </div>

                    <div className={style.tabDiv} style={{ marginTop: '20px' }}>
                        <div className={`${style.tabDivInfo} ${tabX === 1 ? style.active : ""}`} onClick={() => setTabX(1)}>
                            People
                        </div>
                        <div className={`${style.tabDivInfo} ${tabX === 2 ? style.active : ""}`} onClick={() => setTabX(2)}>
                            Teams
                        </div>
                    </div>

                    <div className={styles.tabs}>
                        {
                            tabX === 1 ? (
                                <People file={file} checkedIds={checkedIds} setCheckedIds={setCheckedIds} cred={cred} />
                            ) : null
                        }
                    </div>

                   <hr/>

                    <div className={style.buttons}>
                        <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                        <Button text="Update and Save" status="active" onClick={handleShare} />
                    </div>
                </div>
            </div>
        </div>
    )
}
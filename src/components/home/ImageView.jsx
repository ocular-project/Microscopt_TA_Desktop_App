import styles from "../css/annotation.module.css";
import OtherSidebar from "./annotations/OtherSidebar.jsx";
import React, { useRef, useState, useEffect, useCallback } from "react";
import Success from "./body/Success.jsx";
import {handleMessage} from "../utils/repeating.js";
import css from "../css/general.module.css";
import axiosInstance from "../utils/files/axiosInstance.js";
import {getUserData} from "../utils/files/RepeatingFiles.jsx";
import {useParams} from "react-router-dom";
import Image from "./annotations/Image.jsx";
import {IoCloseCircleOutline, IoShareSocialOutline} from "react-icons/io5";
import {faCheck} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Users from "./body/autoComplete/Users.jsx";
import Share from "./annotations/Share.jsx";
import { config } from "../utils/files/config.js"

const SIDEBAR_WIDTH = 300;
const ZOOM_STEP = 0.1;

export default function ImageView(){

    const [message, setMessage] = useState([])
    const [loader, setLoader] = useState(false)
    const [annotators, setAnnotators] = useState()
    const [msg, setMsg] = useState("")
    const [file, setFile] = useState(null)
    const [cred, setCred] = useState({});
    const { fileId } = useParams();
    const [zoom, setZoom] = useState(1);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const imageRef = useRef(null);
    const [annotations, setAnnotations] = useState([]);
    const [share, setShare] = useState(false)
    const [access, setAccess] = useState(null)
    const [other, setOther] = useState(false)
    const [feed, setFeed] = useState(false)
    const [visual, setVisual] = useState("box")

    useEffect(() => {
        if (config()) {
            fetchData2()
        } else {
            setCred(getUserData("credentials"));
           // console.log(getUserData("credentials"))
           if (fileId) {
               fetchData()
           }
        }

   }, []);

    async function fetchData() {
       setLoader(true)
       try{
           const response = await axiosInstance.get(`/file/${fileId}`)
           const data = response.data
           console.log(data.file)
           setFile(data.file)
           setMsg(data.message)
           !!data.annotators.length && setAnnotators(data.annotators)
           // console.log(data.annotators)
           // console.log(cred._id)
       }catch (err) {
           console.log(err.response)
           const error = err.response.data.error
           handleMessage(error, "error", setMessage)
       }finally {
           setLoader(false)
       }
   }

   async function fetchData2() {
       setLoader(true)
       try{
           const response = await window.electronAPI.getFile(fileId)
           // console.log(response)
           if (response.success){
               const data = response.data
               setFile(data.file)
               setMsg(data.message)
           }
           else {
               handleMessage(response.error, "error", setMessage)
           }

       }catch (err) {
           // console.log(err.response)
           const error = err.response.error
           handleMessage(error, "error", setMessage)
       }finally {
           setLoader(false)
       }
   }

    const fitImageToViewport = useCallback(() => {
        if (!imageRef.current) return;
        const imgNaturalWidth = imageRef.current.naturalWidth;
        const imgNaturalHeight = imageRef.current.naturalHeight;

        const viewportWidth = window.innerWidth - SIDEBAR_WIDTH - 40;
        const viewportHeight = window.innerHeight - 120;

        if (imgNaturalWidth === 0 || imgNaturalHeight === 0) return;

        const scaleX = viewportWidth / imgNaturalWidth;
        const scaleY = viewportHeight / imgNaturalHeight;
        const fitScale = Math.min(scaleX, scaleY, 1);

        setZoom(fitScale);
        setImageSize({ width: imgNaturalWidth, height: imgNaturalHeight });
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer1} style={{ width: SIDEBAR_WIDTH }}>

                <OtherSidebar setZoom={setZoom} fitImageToViewport={fitImageToViewport} ZOOM_STEP={ZOOM_STEP}
                      setAnnotations={setAnnotations} annotations={annotations} setLoader={setLoader}
                              setMessage={setMessage} msg={msg} annotators={annotators} cred={cred} setMsg={setMsg}
                              setShare={setShare} setAccess={setAccess} setOther={setOther} other={other}
                              setFeed={setFeed} setVisual={setVisual} visual={visual} file={file}
                />
            </div>
            <Image loader={loader} file={file} SIDEBAR_WIDTH={SIDEBAR_WIDTH} zoom={zoom} setZoom={setZoom} imageRef={imageRef}
                   imageSize={imageSize} setImageSize={setImageSize} fitImageToViewport={fitImageToViewport}
                   setAnnotations={setAnnotations} annotations={annotations} cred={cred} feed={feed} visual={visual}
            />
            {
                share && (
                    <Share setShare={setShare} share={share} setMessage={setMessage} file={file} access={access} annotations={annotations} cred={cred} />
                )
            }

            <Success message={message} setMessage={setMessage}/>
        </div>
    )
}
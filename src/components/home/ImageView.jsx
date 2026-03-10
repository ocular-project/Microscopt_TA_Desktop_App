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
import { configg } from "../utils/files/config.js"
import Header from "./annotations/Header.jsx";
import AnnotatorShare from "./annotations/AnnotatorShare.jsx";
import AnnotatorFeedback from "./annotations/AnnotatorFeedback.jsx";
import Instructions from "./annotations/Instructions.jsx";
import Labels from "./annotations/Labels.jsx";

const SIDEBAR_WIDTH = 300;
const ZOOM_STEP = 0.1;

export default function ImageView(){

    const [message, setMessage] = useState([])
    const [loader, setLoader] = useState(false)
    const [annotators, setAnnotators] = useState()
    const [msg, setMsg] = useState("")
    const [file, setFile] = useState(null)
    const [cred, setCred] = useState({});
    // const { fileId } = useParams();
    const [zoom, setZoom] = useState(1);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    const imageRef = useRef(null);
    const containerRef = useRef(null);

    const [annotations, setAnnotations] = useState([]);
    const [share, setShare] = useState(false)
    const [pop, setPop] = useState(false)
    const [pop2, setPop2] = useState(false)
    const [selected, setSelected] = useState(null)
    const [feedback, setFeedback] = useState(null)
    const [instructions, setInstructions] = useState(null)
    const [instruct, setInstruct] = useState(false)
    const [label, setLabel] = useState(false)
    const [labels, setLabels] = useState([''])

    const [access, setAccess] = useState(null)
    const [other, setOther] = useState(false)
    const [feed, setFeed] = useState(false)
    const [visual, setVisual] = useState("box")
    const [isClosed, setIsClosed] = useState(false)
    const [width, setWidth] = useState(window.innerWidth);
    const [annotator, setAnnotator] = useState({ owner: "", annoId: "" })
    const [back, setBack] = useState(false)

    const { cat, fileId } = useParams();

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        // console.log(width)
        if (width <= 768){
            setIsClosed(true)
        }
        else {
            setIsClosed(false)
        }
    }, [width]);

    useEffect(() => {
        setCred(getUserData("credentials"));
        // console.log(getUserData("credentials"))
        // console.log(cat)
        if (cat === "computer") {
            fetchData2()
        } else {
           fetchData()
        }

   }, []);

    async function fetchData() {
       setLoader(true)
       try{
           const response = await axiosInstance.get(`/file/${fileId}`)
           const data = response.data
           // console.log(data)
           setFile(data.file)
           setMsg(data.message)
           if (!!data.annotators.length){
               setAnnotators(data.annotators)
               setPop(true)
           }
           // console.log(data.annotators)
           // console.log(cred._id)
           const response2 = await axiosInstance.get(`/file-instructions/${fileId}`)
           // console.log(response2.data.file)
           setInstructions(response2.data.file)
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
           const credentials = getUserData("credentials")
           const response = await window.electronAPI.getFile(fileId, credentials)
           // console.log(response)
           if (response.success){
               const data = response.data
               console.log(data.file)
               setFile(data.file)
               if (!!data.annotators.length){
                   setAnnotators(data.annotators)
                   setPop(true)
               }
               // console.log(data.annotators)
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
        if (!imageRef.current || !containerRef.current) return;

        const img = imageRef.current;
          const container = containerRef.current;

          const imgNaturalWidth = img.naturalWidth;
          const imgNaturalHeight = img.naturalHeight;

          const viewportWidth = container.clientWidth;
          const viewportHeight = container.clientHeight;

          if (!imgNaturalWidth || !imgNaturalHeight) return;

          const scaleX = viewportWidth / imgNaturalWidth;
          const scaleY = viewportHeight / imgNaturalHeight;
          // const fitScale = Math.min(scaleX, scaleY, 1);
          let fitScale;

          const screenWidth = window.innerWidth;

          // 🔹 Large screens
          if (screenWidth > 768) {
            fitScale = Math.min(scaleX, scaleY, 1);
          }

          // 🔹 Tablets
          else if (screenWidth <= 768 && screenWidth > 480) {
            fitScale = scaleX * 3; // prioritize width
          }

          // 🔹 Mobile
          else {
            fitScale = scaleX * 6; // slightly larger for clarity
          }

          setZoom(fitScale);
          setImageSize({
            width: imgNaturalWidth,
            height: imgNaturalHeight
          });
    }, []);

     useEffect(() => {
        if (feedback){
            setPop2(true)
        }
    }, [feedback]);

    return (
        <div className={styles.container}>
            <div className={`${styles.innerContainer1} ${isClosed ? styles.closed : ''}`} style={{ width: SIDEBAR_WIDTH }}>

                <OtherSidebar setZoom={setZoom} fitImageToViewport={fitImageToViewport} ZOOM_STEP={ZOOM_STEP}
                      setAnnotations={setAnnotations} annotations={annotations} setLoader={setLoader} instructions={instructions} setInstruct={setInstruct}
                              setMessage={setMessage} msg={msg} annotators={annotators} cred={cred} setMsg={setMsg} setLabels={setLabels}
                              setBack={setBack} back={back} feedback={feedback} setFeedback={setFeedback} selected={selected} setSelected={setSelected}
                              setShare={setShare} setAccess={setAccess} setOther={setOther} other={other} annotator={annotator} setAnnotator={setAnnotator}
                              setFeed={setFeed} setVisual={setVisual} visual={visual} file={file} setIsClosed={setIsClosed} width={width} setLabel={setLabel} cat={cat}
                />
            </div>
            <div className={styles.innerContainer2}>
                <Header setIsClosed={setIsClosed} width={width} setZoom={setZoom} fitImageToViewport={fitImageToViewport} ZOOM_STEP={ZOOM_STEP} other={other}
                     setShare={setShare} setAnnotations={setAnnotations} annotations={annotations} setLoader={setLoader} cat={cat}
                    setMessage={setMessage} msg={msg} annotators={annotators} cred={cred} setMsg={setMsg} annotator={annotator} back={back}
                />
                {
                    cat === 'computer' && (
                        <div className={styles.strip}>
                            <p>All your annotations will be saved on your machine</p>
                        </div>
                    )
                }
                <div className={`${css.loader} ${loader ? css.active : ""}`}></div>
                <Image loader={loader} file={file} SIDEBAR_WIDTH={SIDEBAR_WIDTH} zoom={zoom} setZoom={setZoom} imageRef={imageRef} containerRef={containerRef}
                    imageSize={imageSize} setImageSize={setImageSize} fitImageToViewport={fitImageToViewport} ZOOM_STEP={ZOOM_STEP} labels={labels} cat={cat}
                    setAnnotations={setAnnotations} annotations={annotations} cred={cred} feed={feed} visual={visual} setIsClosed={setIsClosed} width={width}
                />
            </div>
            {
                share && (
                    <Share setShare={setShare} share={share} setMessage={setMessage} file={file} access={access} annotations={annotations} cred={cred} />
                )
            }

            {
                pop && (
                    <AnnotatorShare loader={loader} setLoader={setLoader} annotators={annotators} setPop={setPop} cred={cred}
                                    selected={selected} setSelected={setSelected} setAnnotations={setAnnotations} cat={cat}
                                    setAnnotator={setAnnotator} setFeed={setFeed} setMessage={setMessage} setMsg={setMsg}
                                    setBack={setBack} setOther={setOther} setAccess={setAccess} feedback={feedback} setFeedback={setFeedback}/>
                )
            }

            {
                pop2 && (
                    <AnnotatorFeedback setPop2={setPop2} loader={loader} setLoader={setLoader} annotators={annotators} setPop={setPop} cred={cred}
                                    selected={selected} setSelected={setSelected} setAnnotations={setAnnotations} cat={cat}
                                    setAnnotator={setAnnotator} setFeed={setFeed} setMessage={setMessage} setMsg={setMsg}
                                    setBack={setBack} setOther={setOther} setAccess={setAccess} feedback={feedback} setFeedback={setFeedback}/>
                )
            }

            {
                instruct && (
                    <Instructions setInstruct={setInstruct} setInstructions={setInstructions} instructions={instructions} setMessage={setMessage} file={file} cred={cred} cat={cat}/>
                )
            }

            {
                label && (
                    <Labels setLabel={setLabel} setMessage={setMessage} labels={labels} setLabels={setLabels}/>
                )
            }

            <Success message={message} setMessage={setMessage}/>
        </div>
    )
}
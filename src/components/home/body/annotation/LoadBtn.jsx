import styles from "../../../css/buttons.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useRef, useState} from "react";
import { capitalizeFirstLetter } from "../../../utils/functions.jsx"

export default function LoadBtn({ status, info, onLoad, text, setCanEdit, cred }){

    const [vis, setVis] = useState(false)
    const [anno, setAnno] = useState([])
    const [me, setMe] = useState({})
    const [feed, setFeed] = useState(false)
    const btnRef = useRef(null)

    const handleLoad = (text, id) => {
        setVis(false)
        onLoad(text, id)
    }

    const handleClickOutSide = (event) => {
        if (btnRef.current && !btnRef.current.contains(event.target)){
            setVis(false)
        }
    }

    useEffect(() => {
       document.addEventListener("mousedown", handleClickOutSide)
        return () => {
            document.addEventListener("mousedown", handleClickOutSide)
        }
    }, []);

     useEffect(() => {
        if (status === "load"){
            if (Object.keys(info).length > 0) {
                let annos = [];
                let anno = null;
                let hasFeedback = false;

                info.annotators.forEach(inf => {
                    if(inf.annotator._id === cred?._id){
                        anno = inf
                    }else {
                        annos.push(inf)
                    }

                    if(!hasFeedback && inf.feedback && Object.keys(inf.feedback).length > 0){
                        hasFeedback = true
                    }
                })

                setAnno(annos)
                setMe(anno)
                setFeed(hasFeedback)

            }

        }
    }, [info]);

    return (
        <>
             {
                 Object.keys(info).length > 0 &&
                  <div className={`${styles.load}`} ref={btnRef}>
                    <div className={styles.load1} onClick={() => setVis(!vis)}>
                         <span>{text}</span>
                         <FontAwesomeIcon icon={faChevronDown}  className={`${styles.loadIcon} ${vis ? styles.rotate : ""}`}/>
                    </div>
                    <div className={`${styles.load2} ${vis ? styles.active : ""}`}>
                        <ul>
                            {
                                me != null &&
                                <>
                                    <li>
                                        <div className={styles.anno} onClick={() => handleLoad("My annotations.jsx", me.annotator._id)}>
                                            My Annotations
                                        </div>
                                    </li>
                                    {
                                        feed &&
                                        <li>
                                            <div className={styles.anno} onClick={() => handleLoad("My annotations.jsx with feedback", me.annotator._id)}>
                                                My Annotations with feedback
                                            </div>
                                        </li>
                                    }
                                </>
                            }

                            {
                                anno?.length !== 0 && (
                                    <>
                                        <li>
                                            <div className={`${styles.otherAnno} ${me != null ? styles.active : "" }`}>
                                                Other Annotators
                                            </div>
                                        </li>
                                        {
                                            anno.map((ann, index) => (
                                                <li key={index}>
                                                    <div className={styles.anno} onClick={() => handleLoad(ann.annotator, ann.annotator._id)}>
                                                        {
                                                            ann.annotator.firstName? (
                                                                <>
                                                                    {capitalizeFirstLetter(ann.annotator.firstName)} {capitalizeFirstLetter(ann.annotator.lastName)}
                                                                </>
                                                            ) : (
                                                                 <>
                                                                    {ann.annotator.email}
                                                                </>
                                                            )
                                                        }

                                                    </div>
                                                </li>
                                            ))
                                        }
                                    </>

                                )
                            }
                        </ul>
                    </div>
                 </div>
            }
        </>
    )
}
import {IoCloseCircleOutline, IoShareSocialOutline} from "react-icons/io5";
import React, {useEffect, useRef, useState} from "react";
import Quill from "quill";
import styles from "../../css/popup.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import css from "../../../css/general.module.css";
import Button from "../../../utils/Button.jsx";
import "quill/dist/quill.snow.css";
import {RxFilePlus} from "react-icons/rx";
import {handleMessage} from "../../../utils/repeating.js";
import axiosInstance from "../../../utils/files/axiosInstance.js";
import {getUserData} from "../../../utils/files/RepeatingFiles.jsx";

export default function Instructions({ setMessage, file, cat, setIsPop, setLoader, setFolders }){

    // const [loader, setLoader] = useState(true)
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const [content, setContent] = useState("");
    const [instructions, setInstructions] = useState(null)
    const [cred, setCred] = useState({});
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
       setCred(getUserData("credentials"));
       // console.log(file)
   }, []);

    useEffect(() => {
       if (loading && file.instructions){
           fetchInstructions()
       } else {
           setLoading(false)
       }
    }, [loading]);

    async function fetchInstructions() {
        setLoader(true)
        try {
            if (cat === "computer"){
                const response = await window.electronAPI.getInstructions(file._id);
                if (!response.success) {
                     setError(response.error);
                     return
                }
                setInstructions(response.file)
            }
            else {
                const response2 = await axiosInstance.get(`/file-instructions/${file._id}`)
                setInstructions(response2.data.file)
            }
        }catch (err) {
           console.log(err)
            const error = err.response?.data?.error || "Unknown error occurred"
            handleMessage(error, "error", setMessage)
       }finally {
           setLoader(false)
           setLoading(false)
       }
    }

    useEffect(() => {
    // Initialize Quill only once
      if (!quillRef.current && editorRef.current) {
        quillRef.current = new Quill(editorRef.current, {
          theme: "snow",
          placeholder: "Write your instructions...",
          modules: {
            toolbar: (cat !== "computer" && file.owner.email === "me") ? [
              [{ header: [1, 2, false] }],
              ["bold", "italic"],
              [{ list: "ordered" }, { list: "bullet" }],
            ] : false,
          },
        });

        // Listen for changes and update state
        quillRef.current.on("text-change", () => {
          setContent(quillRef.current.root.innerHTML);
        });
      }

      // Load existing instructions (Delta) into Quill if available
      if (instructions && quillRef.current) {
        // Check if instructions is a Delta object (from Quill)
          const inst = instructions.instructions
        if (inst.ops) {
          quillRef.current.setContents(inst);
        } else {
          // Fallback: if instructions is HTML string
          quillRef.current.root.innerHTML = inst;
        }

        // Also update the content state
        setContent(
          inst.ops
            ? quillRef.current.getContents()
            : quillRef.current.root.innerHTML
        );
      }

      if (quillRef.current) {
        const canEdit = (cat !== "computer" && file.owner.email === "me");
        quillRef.current.enable(canEdit); // true = editable, false = read-only
      }

      // console.log(quillRef?.current?.getText().trim())
    }, [instructions, file, cred]);

    function handleCancel(){
        setIsPop(false)
    }

    async function handleSave() {
        setLoader(true)
        const content = quillRef.current.getContents();
        // console.log(content)
        try {
            const response = await axiosInstance.post(`/file-instructions/${file._id}`, content)
            const data = response.data
            setInstructions(data.file)
            handleMessage(data.message, "success", setMessage)
            handleCancel()
            setFolders(prev =>
                prev.map(folder =>
                    folder._id === file._id
                        ? { ...folder, instructions: true }
                        : folder
                )
            )
        }
        catch (err) {
            console.log(err)
            const error = err.response?.data?.error || "Unknown error occurred"
            handleMessage(error, "error", setMessage)
        }finally {
            setLoader(false)
        }
    }

    return (
        <div className={styles.main}>
            <div className={styles.header}>
                <div className={styles.headerDiv1}>
                    {
                       (cat !== "computer" && file.owner.email === "me") ? (
                            <>
                                <h1>{instructions ? "Edit" : "Add"} instructions</h1>
                                <p>
                                    {
                                        file.type === "file" ? "Instructions will only apply to the selected image."
                                            : "Instructions will only apply to the images in this folder. These instructions will not apply to images in sub folders"
                                    }
                                </p>
                            </>

                        ) : (
                            <>
                                <h1>Instructions</h1>
                            </>
                        )
                    }
                </div>
                <div className={styles.mainSpan} onClick={handleCancel}>
                    <FontAwesomeIcon icon={faXmark} />
                </div>
            </div>
            {
                !loading && (
                    <>
                       <hr/>
                        <div style={{ marginTop: '20px' }}>
                            {
                               cred && (
                                   <>
                                       {
                                          (cat !== "computer" && file.owner.email === "me") ? (
                                              <p className="text-[10px] font-[400]">Please add instructions annotators are to follow will annotating {file.type === "file" ? "this image": "images in this folder"}. All individuals with access to {file.type === "file" ? "this image": "this folder"} will view the instructions</p>
                                           ) : (
                                              <p className="text-[10px] font-[400]">Here are the instructions you are to follow while annotating {file.type === "file" ? "this image": "images in this folder"}</p>
                                           )
                                       }
                                   </>
                                )
                           }
                           <div style={{ marginTop: '20px', minHeight: '20vh' }}>
                               <div ref={editorRef} />
                           </div>
                        </div>
                        {
                            error && <div className={css.error}>{error}</div>
                         }

                        {
                            (cat !== "computer" && file.owner.email === "me") && (
                                 <>
                                     <hr/>

                                    <div className={styles.buttons}>
                                        <Button text="Cancel" status="cancel" onClick={handleCancel}/>
                                        <Button text={instructions ? "Update" : "Create"} status="active" onClick={handleSave} />
                                    </div>
                                 </>
                            )
                        }

                    </>
                )
            }

        </div>
    )
}
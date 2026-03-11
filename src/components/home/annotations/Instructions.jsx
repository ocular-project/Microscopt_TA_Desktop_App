import styles from "./css/image.module.css";
import {IoCloseCircleOutline, IoShareSocialOutline} from "react-icons/io5";
import React, {useEffect, useRef, useState} from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {RxFilePlus} from "react-icons/rx";
import {handleMessage} from "../../utils/repeating.js";
import axiosInstance from "../../utils/files/axiosInstance.js";

export default function Instructions({ instructions, setInstructions, setMessage, file, setInstruct, cred, cat }){

    const [loader, setLoader] = useState(false)
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const [content, setContent] = useState("");

    useEffect(() => {
    // Initialize Quill only once
      if (!quillRef.current && editorRef.current) {
        quillRef.current = new Quill(editorRef.current, {
          theme: "snow",
          placeholder: "Write your instructions...",
          modules: {
            toolbar: file?.owner?._id === cred?._id ? [
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
        const canEdit = file?.owner?._id === cred?._id;
        quillRef.current.enable(canEdit); // true = editable, false = read-only
      }

      console.log(quillRef?.current?.getText().trim())
    }, [instructions, file, cred]);

    function handleClose(){
        setInstruct(false)
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
            handleClose()
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
        <div className={styles.main3}>
           <div className={styles.main4}>
               <div className={`${styles.loader} ${loader ? styles.active : ""}`}></div>
               <div className={styles.closeDiv} onClick={handleClose}>
                   <h1 className={styles.closeH1}>Instructions</h1>
                   <IoCloseCircleOutline className={styles.close} />
               </div>
               {
                   file?.owner?._id === cred?._id ? (
                      <p className={styles.select}>Please add instructions annotators are to follow while annotating this image. All individuals with access to this image will view the instructions</p>
                   ) : (
                      <p className={styles.select}>Here are the instructions you are to follow while annotating this image</p>
                   )
               }

               <div style={{ marginTop: '20px', minHeight: '20vh' }}>
                   <div ref={editorRef} />
               </div>

               <div className={styles.buttonsFlex}>
                   {/*<div className={`${styles.buttons} ${finalShare ? styles.active : styles.disabled}`} onClick={handleSave}>*/}
                   {/*     <IoShareSocialOutline />*/}
                   {/*     <span>Save Instructions</span>*/}
                   {/*</div>*/}
                   {
                       file?.owner?._id === cred?._id && (
                           <>
                               {
                                   instructions ? (
                                       <>
                                           <div className={`${styles.buttons} ${quillRef?.current?.getText().trim() ? styles.active : styles.disabled}`}
                                                 onClick={() => {
                                                    if (quillRef?.current?.getText().trim().length !== 0) handleSave();
                                                  }}
                                           >
                                                <RxFilePlus />
                                                <span>Edit Instructions</span>
                                           </div>
                                           <div className={`${styles.buttons}`} onClick={handleClose}>
                                                    <span>Cancel</span>
                                           </div>
                                       </>
                                   ) : (
                                       <>
                                           <div className={`${styles.buttons} ${quillRef?.current?.getText().trim() ? styles.active : styles.disabled}`}
                                                onClick={() => {
                                                    if (quillRef?.current?.getText().trim().length !== 0) handleSave();
                                                  }}
                                           >
                                                <RxFilePlus />
                                                <span>Save Instructions</span>
                                           </div>
                                           <div className={`${styles.buttons}`} onClick={handleClose}>
                                                    <span>Cancel</span>
                                           </div>
                                       </>
                                   )
                               }
                           </>
                       )
                   }

               </div>
           </div>
        </div>
    )
}
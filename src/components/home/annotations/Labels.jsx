import React, {useEffect, useRef, useState} from "react";
import styles from "./css/image.module.css";
import {IoCloseCircleOutline} from "react-icons/io5";
import {RxFilePlus} from "react-icons/rx";
import { Plus, Trash2, GripVertical, AlertCircle, Tag } from 'lucide-react';
import {handleMessage} from "../../utils/repeating.js";

export default function Labels({ setLabel, setMessage, labels, setLabels }){

    const [loader, setLoader] = useState(false)
    const lastInputRef = useRef(null);
    const [filename, setFilename] = useState('');

    useEffect(() => {
        if (labels.length > 1 && lastInputRef.current) {
            lastInputRef.current.focus();
        }
    }, [labels.length]);

   const isListNameEmpty = filename.trim() === '';
  const hasEmptyInput = labels.some(item => item.trim() === '');
  const isInvalid = isListNameEmpty || hasEmptyInput;

    function handleClose(){
        setLabel(false)
    }

    function handleSave(){
        const json = JSON.stringify(labels, null, 2); // format JSON
        const blob = new Blob([json], { type: "application/json" });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename.replace(/\s+/g, "_")}.json`;
        a.click();

        URL.revokeObjectURL(url);

        setFilename("")
        setLabels([''])
        handleMessage("Label file saved successfully on your machine", "success", setMessage)
    }
    
    const handleInputChange = (index, value) => {
        const newItems = [...labels];
        newItems[index] = value;
        setLabels(newItems);
    };

    const addLabel = () => {
        // Optional: Prevent adding if the current last one is empty
        if (labels[labels.length - 1].trim() === '') return;
        setLabels([...labels, '']);
    };

    const removeLabel = (index) => {
        // Keep at least one input field
        if (labels.length <= 1) {
        setLabels(['']);
        return;
        }
        const newItems = labels.filter((_, i) => i !== index);
        setLabels(newItems);
    };

    return (
         <div className={styles.main3}>
           <div className={styles.main4}>
               <div className={`${styles.loader} ${loader ? styles.active : ""}`}></div>
               <div className={styles.closeDiv} onClick={handleClose}>
                   <h1 className={styles.closeH1}>Create labels</h1>
                   <IoCloseCircleOutline className={styles.close} />
               </div>

               <p className={styles.select}>The labels created will be saved on your machine in a json file, this is the file you will load when you click <strong>Load labels</strong>. You can create more than one labels' file</p>
               <div className={styles.emailDiv} style={{ padding: '10px 20px', marginTop: '20px' }}>

                   <div className="space-y-2" style={{ marginBottom: '20px' }}>
                    <label style={{ marginBottom: '10px' }} className="text-[10px] font-medium text-slate-700 flex items-center gap-2">
                      <Tag size={16} className="text-slate-400" />
                      File name
                    </label>
                    <input
                      type="text"
                      value={filename}
                       style={{ padding: '10px 20px' }}
                      onChange={(e) => setFilename(e.target.value)}
                      className={`w-full text-[11px] bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all placeholder:text-slate-400 ${
                        isListNameEmpty 
                        ? 'border-amber-200 focus:ring-amber-400' 
                        : 'border-slate-200 focus:ring-primary'
                      }`}
                    />
                  </div>

                   <label style={{ marginBottom: '10px' }} className="text-[10px] font-medium text-slate-700 flex items-center gap-2">
                      Labels
                    </label>

                   {
                       !!labels.length && labels.map((label, index) => (
                           <div
                            key={index}
                            style={{ marginBottom: '10px' }}
                            className="group flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
                           >
                               <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
                                  <GripVertical size={18} />
                               </div>
                               <div className="relative flex-1 flex items-center gap-2">
                              <input
                                ref={index === labels.length - 1 ? lastInputRef : null}
                                type="text"
                                value={label}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                placeholder={`Enter label ${index + 1}...`}
                                style={{ padding: '10px 20px' }}
                                className={`w-full bg-slate-50 border text-[11px] rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 ${
                                  label.trim() === '' && labels.length > 0 
                                  ? 'border-amber-200 focus:ring-amber-400' 
                                  : 'border-slate-200 focus:ring-primary'
                                }`}
                              />

                              {index === labels.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={addLabel}
                                  disabled={label.trim() === ''}
                                  className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg transition-all shadow-sm active:scale-95 ${
                                    label.trim() === '' 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-primary hover:bg-primary text-white'
                                  }`}
                                  title="Add another input"
                                >
                                  <Plus size={20} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => removeLabel(index)}
                                  className="shrink-0 flex items-center justify-center w-10 h-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Remove label"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                           </div>
                       ))
                   }
               </div>
               <div className={styles.buttonsFlex}>
                   <div className={`${styles.buttons} ${!isInvalid ? styles.active : styles.disabled}`}
                        onClick={() => {
                            if (!isInvalid) handleSave();
                        }}
                   >
                        <span>Save Labels as File</span>
                   </div>
                   <div className={`${styles.buttons}`} onClick={handleClose}>
                        <span>Cancel</span>
                   </div>
               </div>
           </div>
        </div>
    )
}